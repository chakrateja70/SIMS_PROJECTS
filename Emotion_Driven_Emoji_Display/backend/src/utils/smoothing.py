import numpy as np
from collections import deque
from typing import Dict, Tuple

class TemporalSmoother:
    """
    Temporal smoothing using moving average filter
    Reduces emotion "flickering" across consecutive frames
    """
    def __init__(self, window_size: int = 5):
        """window_size: Number of frames to average (default: 5)"""
        self.window_size = window_size
        self.history = {}  # Per-face history: {face_id: deque of predictions}
        print(f"✅ Temporal Smoother initialized (window_size={window_size})")
    
    def smooth(
        self, 
        face_id: int, 
        predictions: Dict[str, float]
    ) -> Tuple[str, float]:
        """Apply temporal smoothing to predictions"""
        # Initialize history for new face
        if face_id not in self.history:
            self.history[face_id] = deque(maxlen=self.window_size)
        
        # Convert predictions dict to array (ordered by emotion labels)
        emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        pred_array = np.array([predictions.get(e, 0.0) for e in emotions])
        
        # Add current predictions to history
        self.history[face_id].append(pred_array)
        
        # Calculate moving average
        smoothed_pred = np.mean(list(self.history[face_id]), axis=0)
        
        # Get emotion with highest smoothed probability
        emotion_idx = np.argmax(smoothed_pred)
        emotion = emotions[emotion_idx]
        confidence = float(smoothed_pred[emotion_idx])
        
        return emotion, confidence
    
    def reset(self, face_id: int = None):
        """
        Reset smoothing history
        
        Args:
            face_id: Specific face to reset (None = reset all)
        """
        if face_id is None:
            self.history = {}
            print("✅ All smoothing buffers reset")
        elif face_id in self.history:
            del self.history[face_id]
            print(f"✅ Smoothing buffer reset for face {face_id}")
    
    def get_history_length(self, face_id: int) -> int:
        """Get number of frames in history for a face"""
        if face_id not in self.history:
            return 0
        return len(self.history[face_id])

class KalmanSmoother:
    """
    Advanced Kalman filter for temporal smoothing
    More sophisticated than moving average, handles rapid changes better
    """
    
    def __init__(self, process_noise: float = 0.01, measurement_noise: float = 0.1):
        """
        Initialize Kalman filter
        
        Args:
            process_noise: Process noise covariance (Q)
            measurement_noise: Measurement noise covariance (R)
        """
        self.process_noise = process_noise
        self.measurement_noise = measurement_noise
        self.filters = {}  # Per-face Kalman filter state
        print(f"✅ Kalman Smoother initialized")
    
    def smooth(
        self,
        face_id: int,
        predictions: Dict[str, float]
    ) -> Tuple[str, float]:
        """Apply Kalman filtering to predictions"""
        # Convert predictions to array
        emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        measurement = np.array([predictions.get(e, 0.0) for e in emotions])
        
        # Initialize filter for new face
        if face_id not in self.filters:
            self.filters[face_id] = {
                'x': measurement,  # State estimate
                'P': np.eye(7) * 1.0  # Estimation error covariance
            }
        
        # Kalman filter prediction step
        x_pred = self.filters[face_id]['x']
        P_pred = self.filters[face_id]['P'] + np.eye(7) * self.process_noise
        
        # Kalman filter update step
        K = P_pred / (P_pred + np.eye(7) * self.measurement_noise)  # Kalman gain
        x_updated = x_pred + K @ (measurement - x_pred)
        P_updated = (np.eye(7) - K) @ P_pred
        
        # Update filter state
        self.filters[face_id]['x'] = x_updated
        self.filters[face_id]['P'] = P_updated
        
        # Normalize to ensure probabilities sum to 1
        x_normalized = x_updated / np.sum(x_updated)
        
        # Get emotion with highest probability
        emotion_idx = np.argmax(x_normalized)
        emotion = emotions[emotion_idx]
        confidence = float(x_normalized[emotion_idx])
        
        return emotion, confidence
    
    def reset(self, face_id: int = None):
        """Reset Kalman filter state"""
        if face_id is None:
            self.filters = {}
            print("✅ All Kalman filters reset")
        elif face_id in self.filters:
            del self.filters[face_id]
            print(f"✅ Kalman filter reset for face {face_id}")

class ExponentialSmoother:
    """Exponential moving average smoother,Simple and fast, with adjustable responsiveness"""
    
    def __init__(self, alpha: float = 0.3):
        """
        Initialize exponential smoother
        
        Args:
            alpha: Smoothing factor (0-1). Higher = more responsive to changes
        """
        self.alpha = alpha
        self.state = {}  # Per-face state
        print(f"✅ Exponential Smoother initialized (alpha={alpha})")
    
    def smooth(
        self,
        face_id: int,
        predictions: Dict[str, float]
    ) -> Tuple[str, float]:
        """
        Apply exponential smoothing
        
        Args:
            face_id: Unique face identifier
            predictions: Dictionary of emotion probabilities
            
        Returns:
            Tuple of (smoothed_emotion, smoothed_confidence)
        """
        # Convert predictions to array
        emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        current = np.array([predictions.get(e, 0.0) for e in emotions])
        
        # Initialize state for new face
        if face_id not in self.state:
            self.state[face_id] = current
        
        # Exponential moving average: S_t = α * Y_t + (1-α) * S_{t-1}
        smoothed = self.alpha * current + (1 - self.alpha) * self.state[face_id]
        
        # Update state
        self.state[face_id] = smoothed
        
        # Get emotion with highest probability
        emotion_idx = np.argmax(smoothed)
        emotion = emotions[emotion_idx]
        confidence = float(smoothed[emotion_idx])
        
        return emotion, confidence
    
    def reset(self, face_id: int = None):
        """Reset exponential smoother state"""
        if face_id is None:
            self.state = {}
            print("✅ All exponential smoother states reset")
        elif face_id in self.state:
            del self.state[face_id]
            print(f"✅ Exponential smoother state reset for face {face_id}")
