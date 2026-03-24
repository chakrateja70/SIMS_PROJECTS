import cv2
import numpy as np
import mediapipe as mp
import base64
from typing import List, Dict, Optional

class FaceDetector:
    """MediaPipe Face Detection wrapper"""
    
    def __init__(self, min_detection_confidence: float = 0.5):
        """
        Initialize face detector
        
        Args:
            min_detection_confidence: Minimum confidence threshold (0-1)
        """
        self.mp_face_detection = mp.solutions.face_detection
        self.detector = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 1 for full range, 0 for short range
            min_detection_confidence=min_detection_confidence
        )
        # Use ASCII-only message to avoid Windows console encoding issues
        print("MediaPipe Face Detector initialized")
    
    def is_loaded(self) -> bool:
        """Check if detector is loaded"""
        return self.detector is not None
    
    def decode_base64_image(self, base64_string: str) -> Optional[np.ndarray]:
        """Decode base64 image to OpenCV format"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            img_bytes = base64.b64decode(base64_string)
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            return img
        except Exception as e:
            print(f"❌ Error decoding image: {e}")
            return None
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """Detect faces in image"""
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        h, w = image_rgb.shape[:2]
        
        # Process image
        results = self.detector.process(image_rgb)
        
        detections = []
        
        if results.detections:
            for detection in results.detections:
                # Get bounding box (relative coordinates)
                bbox_rel = detection.location_data.relative_bounding_box
                
                # Convert to absolute coordinates
                x = int(bbox_rel.xmin * w)
                y = int(bbox_rel.ymin * h)
                width = int(bbox_rel.width * w)
                height = int(bbox_rel.height * h)
                
                # Ensure bbox is within image bounds
                x = max(0, x)
                y = max(0, y)
                width = min(width, w - x)
                height = min(height, h - y)
                
                # Skip invalid bboxes
                if width <= 0 or height <= 0:
                    continue
                
                # Get confidence score
                confidence = detection.score[0] if detection.score else 0.0
                
                detections.append({
                    'bbox': [x, y, width, height],
                    'confidence': float(confidence),
                    'image_shape': (h, w)
                })
        
        return detections
    
    def extract_face(self, image: np.ndarray, detection: Dict) -> np.ndarray:
        """Extract face region from image"""
        x, y, w, h = detection['bbox']
        face_img = image[y:y+h, x:x+w]
        return face_img
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()
