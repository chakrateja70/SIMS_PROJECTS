import cv2
import torch
import numpy as np
from numpy.linalg import norm
from typing import List, Tuple, Dict

from config import (
    ENABLE_QUALITY_CHECKS, BLUR_THRESHOLD, BRIGHTNESS_MIN, BRIGHTNESS_MAX,
    USE_SIMPLE_TRACKING
)


# -------------------------------
# UTILITY FUNCTIONS
# -------------------------------

def l2_normalize(x):
    if len(x.shape) == 1:
        return x / (norm(x) + 1e-10)
    else:
        norms = np.linalg.norm(x, axis=1, keepdims=True)
        return x / (norms + 1e-10)


def cosine_distance(a, b):
    return 1 - np.dot(a, b)


def check_face_quality(face_img: np.ndarray) -> Tuple[bool, dict, float]:
    if not ENABLE_QUALITY_CHECKS:
        return True, {'blur': 100.0, 'brightness': 128.0, 'confidence': 1.0}, 1.0

    small_face = cv2.resize(face_img, (80, 80))
    gray = cv2.cvtColor(small_face, cv2.COLOR_RGB2GRAY) if len(small_face.shape) == 3 else small_face

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    confidence = 0.8

    quality_ok = (
        blur_score >= BLUR_THRESHOLD and
        BRIGHTNESS_MIN <= brightness <= BRIGHTNESS_MAX
    )

    metrics = {
        'blur': blur_score,
        'brightness': brightness,
        'confidence': confidence
    }

    return quality_ok, metrics, confidence


# -------------------------------
# CLASSES
# -------------------------------

class FaceTracker:
    def __init__(self, frame_window=30):
        self.frame_window = frame_window
        self.last_detection_frame = {}
        self.unique_faces = 0

    def is_duplicate(self, current_frame: int, box: tuple) -> bool:
        if not USE_SIMPLE_TRACKING:
            return False

        x1, y1, x2, y2 = box
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2
        grid_key = (center_x // 100, center_y // 100)

        if grid_key in self.last_detection_frame:
            last_frame = self.last_detection_frame[grid_key]
            if current_frame - last_frame < self.frame_window:
                return True

        return False

    def add_face(self, frame: int, box: tuple, face_id: str):
        x1, y1, x2, y2 = box
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2
        grid_key = (center_x // 100, center_y // 100)

        self.last_detection_frame[grid_key] = frame
        self.unique_faces += 1


class TemporalClusterer:
    def __init__(self, frame_threshold=30):
        self.frame_threshold = frame_threshold
        self.detections = []

    def add_detection(self, frame: int, distance: float, confidence: float):
        self.detections.append((frame, distance, confidence))

    def get_clusters(self) -> List[Dict]:
        if not self.detections:
            return []

        sorted_detections = sorted(self.detections, key=lambda x: x[0])

        clusters = []
        current_cluster = {
            'start_frame': sorted_detections[0][0],
            'end_frame': sorted_detections[0][0],
            'distances': [sorted_detections[0][1]],
            'confidences': [sorted_detections[0][2]],
            'frames': [sorted_detections[0][0]]
        }

        for frame, distance, confidence in sorted_detections[1:]:
            if frame - current_cluster['end_frame'] <= self.frame_threshold:
                current_cluster['end_frame'] = frame
                current_cluster['distances'].append(distance)
                current_cluster['confidences'].append(confidence)
                current_cluster['frames'].append(frame)
            else:
                clusters.append({
                    'start_frame': current_cluster['start_frame'],
                    'end_frame': current_cluster['end_frame'],
                    'avg_distance': np.mean(current_cluster['distances']),
                    'best_distance': np.min(current_cluster['distances']),
                    'avg_confidence': np.mean(current_cluster['confidences']),
                    'count': len(current_cluster['frames']),
                    'frames': current_cluster['frames']
                })

                current_cluster = {
                    'start_frame': frame,
                    'end_frame': frame,
                    'distances': [distance],
                    'confidences': [confidence],
                    'frames': [frame]
                }

        clusters.append({
            'start_frame': current_cluster['start_frame'],
            'end_frame': current_cluster['end_frame'],
            'avg_distance': np.mean(current_cluster['distances']),
            'best_distance': np.min(current_cluster['distances']),
            'avg_confidence': np.mean(current_cluster['confidences']),
            'count': len(current_cluster['frames']),
            'frames': current_cluster['frames']
        })

        return clusters


class BatchFaceEncoder:
    def __init__(self, model, device, batch_size=16):
        self.model = model
        self.device = device
        self.batch_size = batch_size
        self.pending_faces = []
        self.pending_metadata = []

    def add_face(self, face_rgb: np.ndarray, metadata: dict):
        self.pending_faces.append(face_rgb)
        self.pending_metadata.append(metadata)

    def process_batch(self, force=False) -> List[Tuple[np.ndarray, dict]]:
        if not force and len(self.pending_faces) < self.batch_size:
            return []

        if len(self.pending_faces) == 0:
            return []

        face_batch = np.stack([cv2.resize(f, (160, 160)) for f in self.pending_faces])
        face_tensor = torch.tensor(face_batch).permute(0, 3, 1, 2).float() / 255.0
        face_tensor = face_tensor.to(self.device)

        with torch.no_grad():
            embeddings = self.model(face_tensor).cpu().numpy()

        embeddings = l2_normalize(embeddings)

        results = list(zip(embeddings, self.pending_metadata))

        self.pending_faces = []
        self.pending_metadata = []

        if self.device == "cuda":
            torch.cuda.empty_cache()

        return results

    def flush(self) -> List[Tuple[np.ndarray, dict]]:
        return self.process_batch(force=True)
