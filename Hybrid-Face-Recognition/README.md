# Hybrid Face Recognition

Lightweight hybrid face recognition pipeline that combines RetinaFace (face detection), FaceNet (embedding) and Pinecone (vector DB) with a FastAPI + single-page frontend.

This repository provides two ways to run the system:
- CLI runner for batch video processing and quick searches (`main.py`).
- Full backend + UI (`server.py` + `frontend/`) powered by FastAPI and a single-page JavaScript frontend.

**Key features**
- Store: extract faces from video → encode → upsert into Pinecone (namespace per video).
- Search: instant vector similarity search for a reference image.
- Batch & multi-video modes: search multiple people or across many videos.
- Simple web UI to upload videos/images and run jobs with live SSE logs.

**Repository layout**
- `main.py` : CLI entrypoint for local runs and quick experiments.
- `run.py`  : Launcher to start the FastAPI server and open the frontend.
- `server.py`: FastAPI backend exposing `/api/*` endpoints and background job streaming.
- `store_modes.py`, `search_modes.py`: core processing logic for each mode.
- `models.py`: initializes FaceNet model and Pinecone client.
- `utils.py`: helper utilities (tracking, batching, clustering, quality checks).
- `config.py`: default configuration and CLI argument parsing.
- `frontend/` : single-page app (`index.html`, `app.js`, `style.css`).

**Requirements**
Install dependencies (recommended in a virtualenv):

```bash
python -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Note: GPU support requires a CUDA-enabled PyTorch build. If you don't have a GPU, the code will fall back to CPU.

Environment variables
- `PINECONE_API_KEY` : API key for Pinecone (if using Pinecone).
- `PINECONE_INDEXNAME` : Target Pinecone index name.

Quickstart — CLI

1) Store faces from a video (creates a namespace derived from the filename):

```bash
python main.py --mode store --video path/to/video.mp4
```

2) Search for a person in the stored namespace using a reference image:

```bash
python main.py --mode search --image path/to/person.jpg
```

3) Bulk store multiple videos:

```bash
python main.py --mode bulk_store --video vid1.mp4 vid2.mp4
```

4) Batch search (many people, one namespace):

```bash
python main.py --mode batch_search --image a.jpg b.jpg c.jpg
```

Quickstart — Web UI

Start server and open the frontend automatically:

```bash
python run.py         # opens http://localhost:8000 by default
```

Or run with uvicorn directly (dev reload):

```bash
uvicorn server:app --reload --port 8000
```

API overview
- `POST /api/store` — upload a video to index faces (background job with SSE).
- `POST /api/search` — upload image and run instant search against a namespace.
- `POST /api/batch-search` — upload multiple images to search in a namespace.
- `GET /api/status` — returns device, namespaces and total vectors.

Configuration
- Tweak defaults in [config.py](config.py#L1). Common settings: `BASE_FRAME_SKIP`, `MIN_FACE_SIZE`, `MAX_FACES_TO_COLLECT`, `GPU_BATCH_SIZE`, `DIST_THRESHOLD`.
- CLI overrides are supported in `config.py` (pass `--mode`, `--video`, `--image` to `main.py`).

Notes & troubleshooting
- Ensure `PINECONE_API_KEY` and `PINECONE_INDEXNAME` are set when using Pinecone.
- If TensorFlow or PyTorch on Windows misreport `__version__`, the code contains small shims to mitigate that.
- For faster indexing reduce `BASE_FRAME_SKIP` (fewer frames) or increase `GPU_BATCH_SIZE` when GPU memory allows.

Contributing
- Bug reports and pull requests are welcome. Keep changes focused and run tests (if any) locally before submitting.