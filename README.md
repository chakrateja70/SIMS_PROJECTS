# SIMS Projects

A collection of projects built as part of SIMS. Each project lives in its own folder with its own README.

**Total projects: 9**

---

## Projects

### 1. Emotion Driven Emoji Display
Real-time multi-face emotion detection with emoji overlays. Uses MediaPipe for face detection and a deep learning model for emotion classification. Supports live camera and image upload.

### 2. Intelligent Online Shopping Analyzer
Analytics dashboard for retail transaction data. Combines a FastAPI backend with an HTML/CSS/JS frontend to visualize sales, generate product recommendations (FP-Growth), and segment customers (RFM + K-Means).

### 3. Intelligent Web Data Extraction and Summarization
Scrapes or crawls web pages and generates summaries using Groq LLMs. Backend is FastAPI + Python; frontend is Next.js + TypeScript.

### 4. MultiLingua Text Engine
A text processing engine with multilingual support. FastAPI backend and Next.js frontend.

### 5. Object Detection
YOLOv8-based object detection project focused on earphones/earbuds. Includes a demo and training utilities.

### 6. PDF Q&A Assistant
Upload a PDF and ask questions about its content. Uses a RAG pipeline on the backend (FastAPI + Python) and a React/TypeScript frontend.

### 7. Receipt Scanning Analysis Workflow
End-to-end receipt analysis app. Accepts receipt images or PDFs, runs OCR, and uses a Groq LLM for structured data extraction. Stores results in PostgreSQL.

### 8. Hybrid Face Recognition
Lightweight hybrid face recognition pipeline combining RetinaFace (detection), FaceNet (embeddings), and Pinecone (vector DB). Supports batch video processing, multi-person search, and a FastAPI + single-page web UI with live SSE logs.

### 9. FinAgent — Financial AI Assistant
Multi-agent AI system with a full web UI, voice input/output, live stock charts, and smart query routing. Built with FastAPI, Phidata, Groq LLMs, Yahoo Finance, and Sarvam AI. Includes Finance, Web Search, and Multi-Agent modes with automatic smart routing.

---

## About

This repository is maintained as a central hub for SIMS projects. Each project is self-contained in its own directory. Refer to the individual project README for setup and run instructions.
