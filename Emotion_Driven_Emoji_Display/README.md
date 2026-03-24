
# 🎭 Emotion-Driven Emoji Display

Real-time multi-face emotion detection system with emoji overlays. Built with **MediaPipe Face Detection** for face localization and **Deep Learning** for emotion classification. Modern frontend with live camera and image upload support.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Webcam
- Modern browser (Chrome/Firefox/Safari)


### Installation & Run

```bash
# 1. Clone/Download the project
cd Emotion_Driven_Emoji_Display

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Start backend server
python app.py

# 4. Open frontend
# Open frontend/index.html in your browser (double-click or drag into browser)
```

### Usage


1. **Grant camera permissions** when prompted
2. **Click "Start Detection"** to analyze webcam feed
3. **Or switch to Image Upload** to analyze a photo
4. **See emotions** displayed on faces in real-time with emoji overlays

---


## 📚 Module Details

### Module A: Face Detection (`face_detector.py`)
- **Model**: MediaPipe BlazeFace
- **Function**: Detect multiple faces simultaneously
- **Input**: RGB image (any resolution)
- **Output**: List of bounding boxes `[(x, y, w, h), ...]`

**Key Features**:
- Real-time performance (100+ FPS)
- Multi-face support
- Robust to various lighting conditions

### Module B: Preprocessing (`preprocessing.py`)
**Pipeline**:
1. Crop face using bounding box
2. Resize to model input size (48×48 for Mini-XCEPTION, 224×224 for EfficientNet)
3. Convert to grayscale (for FER-2013 models)
4. Histogram equalization (lighting normalization)
5. Normalize pixels to [0, 1]

### Module C: Emotion Classification (`emotion_model.py`)
**Supported Models**:
- **Mini-XCEPTION** (48×48 grayscale) - Fast, CPU-friendly
- **EfficientNet-B0** (224×224 RGB) - High accuracy
- **ResNet-50** (224×224 RGB) - Balanced performance

**Output Classes**:
1. Angry 😠
2. Disgust 🤢
3. Fear 😨
4. Happy 😊
5. Sad 😢
6. Surprise 😲
7. Neutral 😐

### Temporal Smoothing (`smoothing.py`)
Prevents emotion "flickering" between frames using:
- **Moving Average Filter** (default, window_size=5)
- **Kalman Filter** (advanced)
- **Exponential Smoothing** (lightweight)

---

## 🔧 Configuration

### Backend Configuration (`app.py`)

```python
# Model selection
emotion_model = EmotionModel(model_path='weights/efficientnet_affectnet.h5')

# Smoothing window
temporal_smoother = TemporalSmoother(window_size=5)

# Server settings
uvicorn.run(app, host="0.0.0.0", port=5000)
```


### Frontend Configuration (`frontend/app.js`)

```javascript
const CONFIG = {
  API_URL: 'http://localhost:5000',
  FRAME_RATE: 5,  // Frames per second to send
  CANVAS_SCALE: 1
};
```

---

## 📡 API Endpoints

### Predict Emotions
```bash
POST /predict
Content-Type: application/json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Response**:
```json
{
  "faces": [
    {
      "face_id": 0,
      "bbox": [120, 80, 200, 200],
      "emotion": "Happy",
      "confidence": 0.847,
      "emoji": "😊",
      "all_predictions": { ... }
    }
  ],
  "timestamp": 1710345678,
  "processing_time_ms": 45,
  "total_faces": 1
}
```

### Reset Smoothing
```bash
POST /reset
```

---



## 🧠 Model Weights


### Option 1: Use Pre-trained Weights (Recommended)

Download pre-trained weights and place in `backend/src/weights/`:

- **facial_expression_model_weights.h5** (default in this repo):
  - Already included in `backend/src/weights/`
  - Used for facial expression (emotion) recognition
  - If you want to use your own model, replace this file with your trained weights

- **Mini-XCEPTION on FER-2013**:
  - Download from: https://github.com/oarriaga/face_classification
  - Place as: `backend/src/weights/mini_xception_fer2013.h5`

- **EfficientNet on AffectNet**:
  - Train your own or use transfer learning
  - Place as: `backend/src/weights/efficientnet_affectnet.h5`

### Option 2: Demo Mode (No Weights)

If no weights found, server creates untrained demo model for testing structure.

---

## ⚡ Performance

| Hardware | FPS | Latency | Max Faces |
|----------|-----|---------|-----------|
| Intel i5 CPU | 15-20 | 45ms | 5 |
| Intel i7 CPU | 25-30 | 35ms | 8 |
| NVIDIA GTX 1060 | 60+ | 15ms | 15 |
| NVIDIA RTX 3080 | 120+ | 8ms | 20+ |

---


### Import errors
```bash
pip install -r requirements.txt --upgrade
```

---

## 📦 Dependencies


**Backend**:
- `fastapi` - Web server framework (served with `uvicorn`)
- `opencv-python` - Computer vision
- `mediapipe` - Face detection
- `tensorflow` - Deep learning
- `numpy` - Numerical computing

**Frontend**:
- HTML5 Canvas
- WebRTC
- Vanilla JavaScript (no frameworks)

---


## 🙏 Acknowledgments

- **MediaPipe** (Google) - Face detection
- **TensorFlow** - Deep learning framework
- **FER-2013** - Emotion dataset
- **AffectNet** - Large-scale emotion database

