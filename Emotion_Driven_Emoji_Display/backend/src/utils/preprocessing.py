import cv2
import numpy as np
from typing import Tuple

def preprocess_face(
    face_img: np.ndarray,
    target_size: Tuple[int, int] = (48, 48),
    grayscale: bool = True,
    equalize_hist: bool = True,
    normalize: bool = True
) -> np.ndarray:
    """Preprocess face image for emotion model input"""
    # Resize to target size
    face_resized = cv2.resize(face_img, target_size, interpolation=cv2.INTER_AREA)
    
    # Convert to grayscale
    if grayscale:
        if len(face_resized.shape) == 3:
            face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        else:
            face_gray = face_resized
    else:
        face_gray = face_resized
    
    # Histogram equalization for lighting normalization
    if equalize_hist and grayscale:
        face_eq = cv2.equalizeHist(face_gray)
    else:
        face_eq = face_gray
    
    # Normalize pixel values to [0, 1]
    if normalize:
        face_normalized = face_eq.astype('float32') / 255.0
    else:
        face_normalized = face_eq.astype('float32')
    
    # Add channel dimension (H, W) -> (H, W, 1)
    if len(face_normalized.shape) == 2:
        face_output = np.expand_dims(face_normalized, axis=-1)
    else:
        face_output = face_normalized
    
    return face_output

def preprocess_face_efficientnet(
    face_img: np.ndarray,
    target_size: Tuple[int, int] = (224, 224)
) -> np.ndarray:
    """Preprocess face for EfficientNet model (RGB, 224x224)"""
    # Resize
    face_resized = cv2.resize(face_img, target_size, interpolation=cv2.INTER_AREA)
    
    # Convert BGR to RGB
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    
    # Normalize to [0, 1]
    face_normalized = face_rgb.astype('float32') / 255.0
    
    # EfficientNet expects input in range [0, 1]
    return face_normalized


def augment_face(face_img: np.ndarray) -> np.ndarray:
    """Apply data augmentation to face image"""
    # Random horizontal flip
    if np.random.rand() > 0.5:
        face_img = cv2.flip(face_img, 1)
    
    # Random brightness adjustment
    alpha = 1.0 + np.random.uniform(-0.2, 0.2)  # Contrast
    beta = np.random.uniform(-20, 20)  # Brightness
    face_img = cv2.convertScaleAbs(face_img, alpha=alpha, beta=beta)
    
    # Random rotation (-10 to +10 degrees)
    angle = np.random.uniform(-10, 10)
    h, w = face_img.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    face_img = cv2.warpAffine(face_img, rotation_matrix, (w, h))
    
    return face_img

def crop_face_with_margin(
    image: np.ndarray,
    bbox: list,
    margin: float = 0.2
) -> np.ndarray:
    """Crop face from image with margin"""
    x, y, w, h = bbox
    img_h, img_w = image.shape[:2]
    
    # Calculate margin in pixels
    margin_w = int(w * margin)
    margin_h = int(h * margin)
    
    # Expand bbox with margin
    x1 = max(0, x - margin_w)
    y1 = max(0, y - margin_h)
    x2 = min(img_w, x + w + margin_w)
    y2 = min(img_h, y + h + margin_h)
    
    # Crop
    face_crop = image[y1:y2, x1:x2]
    
    return face_crop


def batch_preprocess_faces(
    faces: list,
    target_size: Tuple[int, int] = (48, 48)
) -> np.ndarray:
    """Preprocess batch of face images"""
    preprocessed = []
    
    for face in faces:
        face_processed = preprocess_face(face, target_size=target_size)
        preprocessed.append(face_processed)
    
    # Stack into batch
    batch = np.array(preprocessed)
    
    return batch
