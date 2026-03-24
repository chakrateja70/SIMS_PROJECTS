import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from src.models.face_detector import FaceDetector
from src.models.emotion_model import EmotionModel
from src.utils.preprocessing import preprocess_face
from src.utils.smoothing import TemporalSmoother

# Initialize FastAPI app
app = FastAPI(
    title="Emotion Detection API",
    description="Real-time multi-face emotion detection with emoji overlay",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
face_detector = FaceDetector()
emotion_model = EmotionModel()
temporal_smoother = TemporalSmoother(window_size=5)

# Emotion to emoji mapping
EMOTION_EMOJIS = {
    'Angry': '😠',
    'Disgust': '🤢',
    'Fear': '😨',
    'Happy': '😊',
    'Sad': '😢',
    'Surprise': '😲',
    'Neutral': '😐'
}


class PredictionRequest(BaseModel):
    image: str  # Base64 encoded image
    mode: str = "camera"


class FaceResult(BaseModel):
    face_id: int
    bbox: List[int]
    emotion: str
    confidence: float
    emoji: str
    all_predictions: Dict[str, float]


class PredictionResponse(BaseModel):
    faces: List[FaceResult]
    timestamp: int
    processing_time_ms: int
    total_faces: int


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Emotion Detection API",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "reset": "/reset"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Emotion detection server is running",
        "models": {
            "face_detector": face_detector.is_loaded(),
            "emotion_model": emotion_model.is_loaded()
        }
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_emotions(request: PredictionRequest):
    """
    Predict emotions for all faces in the image
    """
    start_time = time.time()
    
    try:
        # Decode image
        image = face_detector.decode_base64_image(request.image)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Detect faces
        detections = face_detector.detect_faces(image)
        
        faces = []
        
        for idx, detection in enumerate(detections):
            # Extract face region
            face_img = face_detector.extract_face(image, detection)
            
            # Preprocess face
            face_input = preprocess_face(face_img)
            
            # Predict emotion
            emotion, confidence, all_predictions = emotion_model.predict(face_input)
            
            # FIXED: Use raw predictions (no smoothing)
            # Smoothing is only useful for live video, not static images
            final_emotion = emotion
            final_confidence = confidence
            
            # Create face result
            faces.append(FaceResult(
                face_id=idx,
                bbox=detection['bbox'],
                emotion=final_emotion,
                confidence=round(final_confidence, 3),
                emoji=EMOTION_EMOJIS[final_emotion],
                all_predictions={
                    label: round(float(all_predictions[label]), 3)
                    for label in all_predictions
                }
            ))
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        return PredictionResponse(
            faces=faces,
            timestamp=int(time.time()),
            processing_time_ms=processing_time,
            total_faces=len(faces)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reset")
def reset_smoothing():
    """Reset temporal smoothing buffers"""
    temporal_smoother.reset()
    return {"message": "Smoothing buffers reset successfully"}


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 Starting Emotion Detection Server")
    print("="*60)
    print("📍 Server URL: http://localhost:5000")
    print("🔍 Health Check: http://localhost:5000/health")
    print("🎯 Prediction Endpoint: http://localhost:5000/predict")
    print("📚 API Docs: http://localhost:5000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=5000)
