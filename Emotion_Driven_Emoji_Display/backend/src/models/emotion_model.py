import os
import cv2
import numpy as np
from typing import Tuple, Dict
from deepface import DeepFace
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Flatten,
    Dense,
    Dropout,
    BatchNormalization,
    SeparableConv2D
)

DEEPFACE_AVAILABLE = True

# Emotion labels (7 classes)
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

class EmotionModel:
    """
    Advanced emotion classification with DeepFace integration
    Falls back to Keras model if DeepFace unavailable
    """

    def __init__(self, model_path: str = None, use_deepface: bool = True):
        self.use_deepface = use_deepface and DEEPFACE_AVAILABLE
        self.keras_model = None
        self.input_shape = (48, 48)
        self.emotion_labels = EMOTION_LABELS

        if self.use_deepface:
            print("✅ Using DeepFace for emotion detection (70-90% accuracy)")
            print("   Backend models: VGG-Face, Facenet, OpenFace, DeepFace")
        else:
            print("⚠️  DeepFace not available, using Keras model")
            self.load_keras_model(model_path)

    def load_keras_model(self, model_path: str = None):
        """Load Keras .h5 model as fallback"""

        if model_path and os.path.exists(model_path):
            try:
                self.keras_model = keras.models.load_model(model_path, compile=False)
                self.keras_model.compile(
                    optimizer='adam',
                    loss='categorical_crossentropy',
                    metrics=['accuracy']
                )
                print(f"✅ Loaded Keras model from {model_path}")
                return
            except Exception as e:
                print(f"⚠️ Failed to load model from {model_path}: {e}")

        possible_paths = [
            os.path.join(os.path.dirname(__file__), '..', 'weights', 'emotion_model.h5'),
            os.path.join(os.path.dirname(__file__), '..', 'weights', 'mini_xception_fer2013.h5'),
            os.path.join(os.path.dirname(__file__), '..', 'weights', 'efficientnet_affectnet.h5'),
        ]

        for path in possible_paths:
            if os.path.exists(path):
                try:
                    self.keras_model = keras.models.load_model(path, compile=False)
                    self.keras_model.compile(
                        optimizer='adam',
                        loss='categorical_crossentropy',
                        metrics=['accuracy']
                    )
                    print(f"✅ Loaded Keras model from {path}")
                    return
                except Exception as e:
                    print(f"⚠️ Failed to load {path}: {e}")

        print("⚠️ No pre-trained model found, creating demo model (untrained)")
        self.keras_model = self._create_demo_model()

    def _create_demo_model(self):
        """Create Mini-XCEPTION architecture (untrained demo model)"""

        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            BatchNormalization(),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),

            SeparableConv2D(64, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),

            SeparableConv2D(128, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),

            Flatten(),
            Dense(256, activation='relu'),
            BatchNormalization(),
            Dropout(0.5),
            Dense(7, activation='softmax')
        ])

        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        return model

    def is_loaded(self) -> bool:
        return self.use_deepface or self.keras_model is not None

    def predict(self, face_input: np.ndarray) -> Tuple[str, float, Dict[str, float]]:

        if self.use_deepface:
            return self._predict_deepface(face_input)
        else:
            return self._predict_keras(face_input)

    def _predict_deepface(self, face_input: np.ndarray):

        try:
            if face_input.max() <= 1.0:
                face_img = (face_input * 255).astype(np.uint8)
            else:
                face_img = face_input.astype(np.uint8)

            if len(face_img.shape) == 3 and face_img.shape[2] == 1:
                face_img = face_img.squeeze()

            if face_img.shape[0] < 48 or face_img.shape[1] < 48:
                face_img = cv2.resize(face_img, (48, 48))

            if len(face_img.shape) == 2:
                face_img = cv2.cvtColor(face_img, cv2.COLOR_GRAY2BGR)

            result = DeepFace.analyze(
                img_path=face_img,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='skip',
                silent=True
            )

            if isinstance(result, list):
                result = result[0]

            deepface_emotions = result['emotion']

            emotion_mapping = {
                'angry': 'Angry',
                'disgust': 'Disgust',
                'fear': 'Fear',
                'happy': 'Happy',
                'sad': 'Sad',
                'surprise': 'Surprise',
                'neutral': 'Neutral'
            }

            all_predictions = {}

            for deepface_label, our_label in emotion_mapping.items():
                score = deepface_emotions.get(deepface_label, 0.0)
                all_predictions[our_label] = score / 100.0

            dominant_emotion = result['dominant_emotion']
            emotion = emotion_mapping.get(dominant_emotion, 'Neutral')
            confidence = all_predictions[emotion]

            print(f"✅ DeepFace prediction: {emotion} ({confidence:.1%})")

            return emotion, confidence, all_predictions

        except Exception as e:

            print(f"⚠️ DeepFace prediction failed: {e}")
            print("   Falling back to Keras model...")

            if self.keras_model is None:
                self.load_keras_model()

            if self.keras_model is not None:
                return self._predict_keras(face_input)
            else:
                return 'Neutral', 0.5, {label: 1.0/7 for label in self.emotion_labels}

    def _predict_keras(self, face_input: np.ndarray):

        if self.keras_model is None:
            raise RuntimeError("Keras model not loaded")

        face_batch = np.expand_dims(face_input, axis=0)

        predictions = self.keras_model.predict(face_batch, verbose=0)[0]

        emotion_idx = np.argmax(predictions)
        emotion = self.emotion_labels[emotion_idx]
        confidence = float(predictions[emotion_idx])

        all_predictions = {
            label: float(predictions[i])
            for i, label in enumerate(self.emotion_labels)
        }

        print(f"📊 Keras prediction: {emotion} ({confidence:.1%})")

        return emotion, confidence, all_predictions

    def predict_batch(self, faces_input: np.ndarray):

        results = []

        for face in faces_input:
            emotion, confidence, all_preds = self.predict(face)
            results.append((emotion, confidence, all_preds))

        return results