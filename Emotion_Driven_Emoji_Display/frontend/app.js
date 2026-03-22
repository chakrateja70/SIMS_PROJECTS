/**
 * EmotiVision - Real-Time Multi-Face Emotion Detection
 * Frontend Application Logic
 */

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5000',
    FRAME_RATE: 5, // Frames per second to send to backend
    CANVAS_SCALE: 1,
    EMOTION_COLORS: {
        'Happy': '#00ff88',
        'Sad': '#4a9eff',
        'Angry': '#ff4757',
        'Surprise': '#ffd700',
        'Fear': '#9b59b6',
        'Disgust': '#2ecc71',
        'Neutral': '#95a5a6'
    }
};

// Global state
let videoStream = null;
let isDetecting = false;
let animationFrameId = null;
let lastFrameTime = 0;
let fpsHistory = [];
let currentFaces = [];
let uploadedImageData = null;
let currentMode = 'camera';

// DOM Elements
const webcamElement = document.getElementById('webcam');
const overlayCanvas = document.getElementById('overlay');
const overlayCtx = overlayCanvas.getContext('2d');
const loadingOverlay = document.getElementById('loadingOverlay');
const noCameraOverlay = document.getElementById('noCameraOverlay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const faceCountEl = document.getElementById('faceCount');
const fpsEl = document.getElementById('fps');
const latencyEl = document.getElementById('latency');
const emotionList = document.getElementById('emotionList');
const confidenceThreshold = document.getElementById('confidenceThreshold');
const confidenceValue = document.getElementById('confidenceValue');
const showBboxCheckbox = document.getElementById('showBbox');
const showEmojiCheckbox = document.getElementById('showEmoji');
const showConfidenceCheckbox = document.getElementById('showConfidence');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 EmotiVision initialized');
    initCamera();
    checkBackendHealth();
    setupEventListeners();
});

/**
 * Initialize camera and video stream
 */
async function initCamera() {
    try {
        loadingOverlay.style.display = 'flex';
        noCameraOverlay.style.display = 'none';
        
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });
        
        webcamElement.srcObject = videoStream;
        
        await new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                webcamElement.play();
                resolve();
            };
        });
        
        overlayCanvas.width = webcamElement.videoWidth;
        overlayCanvas.height = webcamElement.videoHeight;
        
        loadingOverlay.style.display = 'none';
        showToast('Camera initialized successfully', 'success');
        console.log('✅ Camera initialized');
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        loadingOverlay.style.display = 'none';
        noCameraOverlay.style.display = 'flex';
        showToast('Failed to access camera. Please check permissions.', 'error');
    }
}

/**
 * Check backend server health
 */
async function checkBackendHealth() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            updateStatus('connected', 'Connected');
            console.log('✅ Backend server connected');
        } else {
            updateStatus('disconnected', 'Server Error');
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        updateStatus('disconnected', 'Disconnected');
        showToast('Cannot connect to backend server. Please start the backend (run backend/app.py).', 'error');
    }
}

/**
 * Start emotion detection
 */
function startDetection() {
    if (isDetecting) return;
    
    isDetecting = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    updateStatus('detecting', 'Detecting...');
    showToast('Emotion detection started', 'success');
    detectLoop();
    
    console.log('▶ Detection started');
}

/**
 * Stop emotion detection
 */
function stopDetection() {
    if (!isDetecting) return;
    
    isDetecting = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    updateStatus('connected', 'Connected');
    clearOverlay();
    currentFaces = [];
    updateEmotionList([]);
    showToast('Emotion detection stopped', 'warning');
    
    console.log('⏸ Detection stopped');
}

/**
 * Main detection loop
 */
function detectLoop() {
    if (!isDetecting) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - lastFrameTime;
    const frameInterval = 1000 / CONFIG.FRAME_RATE;
    
    if (elapsed > frameInterval) {
        lastFrameTime = currentTime - (elapsed % frameInterval);
        captureAndAnalyze();
        updateFPS();
    }
    
    animationFrameId = requestAnimationFrame(detectLoop);
}

/**
 * Capture frame and send to backend for analysis
 */
async function captureAndAnalyze() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = webcamElement.videoWidth;
        canvas.height = webcamElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(webcamElement, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        const startTime = Date.now();
        const response = await fetch(`${CONFIG.API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                image: imageData,
                mode: 'camera'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        updateLatency(latency);
        updateFaceCount(data.total_faces);
        currentFaces = data.faces;
        
        drawDetections(data.faces);
        updateEmotionList(data.faces);
        
    } catch (error) {
        console.error('❌ Detection error:', error);
        if (isDetecting) {
            updateStatus('error', 'Error');
        }
    }
}

/**
 * Draw emotion detections on overlay canvas
 */
function drawDetections(faces) {
    clearOverlay();
    
    const showBbox = showBboxCheckbox.checked;
    const showEmoji = showEmojiCheckbox.checked;
    const showConfidence = showConfidenceCheckbox.checked;
    const minConfidence = confidenceThreshold.value / 100;
    
    faces.forEach(face => {
        if (face.confidence < minConfidence) return;

        const [x, y, w, h] = face.bbox;
        const emotion = face.emotion;
        const confidence = face.confidence;
        const emoji = face.emoji;
        const color = CONFIG.EMOTION_COLORS[emotion] || '#00ff88';

        if (showBbox) {
            overlayCtx.strokeStyle = color;
            overlayCtx.lineWidth = 4;
            overlayCtx.shadowBlur = 0;
            overlayCtx.strokeRect(x, y, w, h);
        }

        const labelText = showConfidence ?
            `${emotion} ${(confidence * 100).toFixed(0)}%` :
            emotion;

        overlayCtx.font = 'bold 16px Arial';
        const metrics = overlayCtx.measureText(labelText);
        const labelWidth = metrics.width + 20;
        const labelHeight = 28;
        const labelX = x;
        const labelY = Math.max(5, y - labelHeight - 5);

        overlayCtx.fillStyle = '#FFD700';
        overlayCtx.fillRect(labelX, labelY, labelWidth, labelHeight);

        overlayCtx.fillStyle = '#000000';
        overlayCtx.textAlign = 'left';
        overlayCtx.textBaseline = 'middle';
        overlayCtx.shadowBlur = 0;
        overlayCtx.fillText(labelText, labelX + 10, labelY + labelHeight / 2);

        if (showEmoji) {
            overlayCtx.font = `${Math.min(w, h) * 0.25}px Arial`;
            overlayCtx.textAlign = 'center';
            overlayCtx.textBaseline = 'bottom';
            overlayCtx.fillText(emoji, x + w / 2, y - Math.max(18, Math.min(w, h) * 0.25));
        }
    });
}

/**
 * Clear overlay canvas
 */
function clearOverlay() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

/**
 * Update emotion list in sidebar
 */
function updateEmotionList(faces) {
    if (faces.length === 0) {
        emotionList.innerHTML = `
            <div class="empty-state">
                <p>No faces detected</p>
                <span class="empty-icon">👤</span>
            </div>
        `;
        return;
    }
    
    const minConfidence = confidenceThreshold.value / 100;
    const filteredFaces = faces.filter(f => f.confidence >= minConfidence);
    
    emotionList.innerHTML = filteredFaces.map((face, index) => `
        <div class="emotion-item" style="animation-delay: ${index * 0.05}s">
            <div class="emotion-emoji">${face.emoji}</div>
            <div class="emotion-details">
                <div class="emotion-name">Face ${face.face_id + 1}: ${face.emotion}</div>
                <div class="emotion-confidence">
                    Confidence: ${(face.confidence * 100).toFixed(1)}%
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${face.confidence * 100}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStatus(state, text) {
    statusIndicator.className = `status-indicator ${state}`;
    statusText.textContent = text;
}

function updateFaceCount(count) {
    faceCountEl.textContent = count;
}

function updateLatency(latency) {
    latencyEl.textContent = `${latency}ms`;
}

function updateFPS() {
    const now = Date.now();
    fpsHistory.push(now);
    fpsHistory = fpsHistory.filter(time => now - time < 1000);
    const fps = fpsHistory.length;
    fpsEl.textContent = fps;
}

/**
 * Capture screenshot with emotion overlays
 */
function captureScreenshot() {
    const canvas = document.createElement('canvas');
    const webcam = document.getElementById('webcam');
    const overlay = document.getElementById('overlay');
    
    // Set canvas size to match video
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Step 1: Draw video frame
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    
    // Step 2: Draw overlay canvas on top
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
    
    // Step 3: Download combined image
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.href = url;
        a.download = `emotion-detection-${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Screenshot saved with emotion overlays! 📸', 'success');
    }, 'image/png');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setupEventListeners() {
    confidenceThreshold.addEventListener('input', (e) => {
        confidenceValue.textContent = `${e.target.value}%`;
        if (currentFaces.length > 0) {
            drawDetections(currentFaces);
            updateEmotionList(currentFaces);
        }
    });
    
    showBboxCheckbox.addEventListener('change', () => {
        if (currentFaces.length > 0) {
            drawDetections(currentFaces);
        }
    });
    
    showEmojiCheckbox.addEventListener('change', () => {
        if (currentFaces.length > 0) {
            drawDetections(currentFaces);
        }
    });
    
    showConfidenceCheckbox.addEventListener('change', () => {
        if (currentFaces.length > 0) {
            drawDetections(currentFaces);
        }
    });
    
    window.addEventListener('resize', () => {
        if (webcamElement.videoWidth > 0) {
            overlayCanvas.width = webcamElement.videoWidth;
            overlayCanvas.height = webcamElement.videoHeight;
            if (currentFaces.length > 0) {
                drawDetections(currentFaces);
            }
        }
    });
}

window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
});

// ============================================
// IMAGE UPLOAD FEATURE
// ============================================

function switchMode(mode) {
    currentMode = mode;
    
    const cameraContainer = document.getElementById('cameraContainer');
    const uploadContainer = document.getElementById('uploadContainer');
    const cameraModeBtn = document.getElementById('cameraModeBtn');
    const uploadModeBtn = document.getElementById('uploadModeBtn');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (mode === 'camera') {
        cameraContainer.style.display = 'block';
        uploadContainer.style.display = 'none';
        cameraModeBtn.classList.add('active');
        uploadModeBtn.classList.remove('active');
        startBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
        
        if (isDetecting) {
            stopDetection();
        }
        
        clearOverlay();
        updateEmotionList([]);
        
    } else {
        cameraContainer.style.display = 'none';
        uploadContainer.style.display = 'block';
        cameraModeBtn.classList.remove('active');
        uploadModeBtn.classList.add('active');
        startBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        
        if (isDetecting) {
            stopDetection();
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        uploadedImageData = e.target.result;
        
        const uploadedImage = document.getElementById('uploadedImage');
        const uploadPreview = document.getElementById('uploadPreview');
        
        uploadedImage.src = uploadedImageData;
        uploadPreview.style.display = 'block';
        
        showToast('Image uploaded successfully', 'success');
    };
    
    reader.onerror = function() {
        showToast('Failed to read image file', 'error');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Analyze uploaded image for emotions
 */
async function analyzeUploadedImage() {
    if (!uploadedImageData) {
        showToast('Please upload an image first', 'error');
        return;
    }
    
    try {
        showToast('Analyzing emotions...', 'info');
        
        // Send to backend
        const startTime = Date.now();
        const response = await fetch(`${CONFIG.API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: uploadedImageData })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const latency = Date.now() - startTime;
        
        // Update UI
        updateLatency(latency);
        updateFaceCount(data.total_faces);
        
        // Draw results on uploaded image
        drawUploadedImageResults(data.faces);
        
        // Update emotion list
        updateEmotionList(data.faces);
        
        if (data.total_faces === 0) {
            showToast('No faces detected in image', 'warning');
        } else {
            showToast(`Detected ${data.total_faces} face(s)`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        showToast('Failed to analyze image. Please try again.', 'error');
    }
}

/**
 * Draw emotion results on uploaded image
 */
function drawUploadedImageResults(faces) {
    const img = document.getElementById('uploadedImage');
    
    // Create a fresh canvas each time (prevents overlapping)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create new image object to ensure clean load
    const freshImg = new Image();
    freshImg.crossOrigin = "anonymous";
    
    freshImg.onload = function() {
        // Set canvas size to match image
        canvas.width = freshImg.naturalWidth;
        canvas.height = freshImg.naturalHeight;
        
        // Draw the original image (clean slate)
        ctx.drawImage(freshImg, 0, 0);
        
        // Get settings
        const showBbox = showBboxCheckbox.checked;
        const showEmoji = showEmojiCheckbox.checked;
        const showConfidence = showConfidenceCheckbox.checked;
        const minConfidence = confidenceThreshold.value / 100;
        
        // Draw each detected face
        faces.forEach(face => {
            if (face.confidence < minConfidence) return;
            
            const [x, y, w, h] = face.bbox;
            const emotion = face.emotion;
            const confidence = face.confidence;
            const emoji = face.emoji;
            const color = CONFIG.EMOTION_COLORS[emotion] || '#00ff88';
            
            // Draw bounding box
            if (showBbox) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.shadowBlur = 0;
                ctx.strokeRect(x, y, w, h);
            }
            
            // Draw label (only ONE per face)
            const labelText = showConfidence ? 
                `${emotion} ${(confidence * 100).toFixed(0)}%` : 
                emotion;
            
            ctx.font = 'bold 18px Arial';
            const metrics = ctx.measureText(labelText);
            const labelWidth = metrics.width + 20;
            const labelHeight = 30;
            const labelX = x;
            const labelY = Math.max(5, y - labelHeight - 5);
            
            // Yellow background
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
            
            // Black text
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 0;
            ctx.fillText(labelText, labelX + 10, labelY + labelHeight / 2);
            
            // Optional emoji in center
            if (showEmoji) {
                ctx.font = `${Math.min(w, h) * 0.25}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, x + w / 2, y + h / 2);
            }
        });
        
        // Update the displayed image with new canvas (completely replaces old one)
        img.src = canvas.toDataURL('image/jpeg', 0.95);
    };
    
    // Load from original uploaded data (clean image without previous drawings)
    freshImg.src = uploadedImageData;
}

console.log('✅ EmotiVision app.js loaded');