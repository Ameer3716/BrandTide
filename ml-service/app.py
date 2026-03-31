"""
BrandTide ML Inference Service
XLM-RoBERTa Multilingual Sentiment Classifier
Serves predictions via FastAPI for the Node.js backend.

Deployment targets:
  - HuggingFace Spaces (Docker) — PORT=7860 (set automatically by HF)
  - Local dev                   — PORT=8000 (or ML_PORT override)
"""

import os
import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

# ── Config ────────────────────────────────────────────────────────────────────
HF_REPO_ID = os.environ.get("HF_MODEL_REPO", "AbdullahCheemaDev/XLM-RoBERTa_Multilingual")

# HF_TOKEN is read automatically by huggingface_hub from the environment.
# Set it as a Secret in your HF Space settings if the model repo is private.
HF_TOKEN = os.environ.get("HF_TOKEN", None)

BASE_DIR = Path(__file__).resolve().parent

# Model is pre-baked into the image at /app/model/best_model during Docker build.
# If missing (first-run without pre-bake), it will be downloaded at startup.
CACHED_MODEL_DIR = BASE_DIR / "model" / "best_model"

# ── Globals ───────────────────────────────────────────────────────────────────
model     = None
tokenizer = None
label_mapping: dict[int, str] = {}   # {0: "negative", 1: "neutral", 2: "positive"}
max_len   = 128
device    = None


# ── Model loading helpers ─────────────────────────────────────────────────────

def resolve_model_dir() -> Path:
    """
    Return the path to a ready-to-load model directory.
    Priority:
      1. Pre-baked path inside the Docker image  (/app/model/best_model)
      2. Download from HuggingFace Hub at runtime
    """
    if CACHED_MODEL_DIR.exists() and (CACHED_MODEL_DIR / "config.json").exists():
        logger.info(f"Using cached/pre-baked model at {CACHED_MODEL_DIR}")
        return CACHED_MODEL_DIR

    logger.info(f"Model not found locally. Downloading from HuggingFace: {HF_REPO_ID} …")
    from huggingface_hub import snapshot_download
    downloaded = snapshot_download(
        repo_id=HF_REPO_ID,
        local_dir=str(CACHED_MODEL_DIR),
        token=HF_TOKEN,
        allow_patterns=["*.json", "*.safetensors", "*.txt", "*.model"],
    )
    logger.info(f"Model downloaded to {downloaded}")
    return CACHED_MODEL_DIR


def load_model():
    """Load the XLM-RoBERTa model and tokenizer into memory."""
    global model, tokenizer, label_mapping, max_len, device

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    model_dir = resolve_model_dir()

    # ── Label mapping ─────────────────────────────────────────────────────────
    label_map_path = model_dir.parent / "label_mapping.json"
    if label_map_path.exists():
        with open(label_map_path, "r") as f:
            raw_map = json.load(f)
        # raw_map is  {"negative": 0, "neutral": 1, "positive": 2}
        # invert to   {0: "negative", 1: "neutral", 2: "positive"}
        label_mapping = {v: k for k, v in raw_map.items()}
    else:
        label_mapping = {0: "negative", 1: "neutral", 2: "positive"}
    logger.info(f"Label mapping: {label_mapping}")

    # ── Max sequence length ───────────────────────────────────────────────────
    model_cfg_path = model_dir.parent / "model_config.json"
    if model_cfg_path.exists():
        with open(model_cfg_path, "r") as f:
            model_cfg = json.load(f)
        max_len = model_cfg.get("max_len", 128)
    logger.info(f"Max sequence length: {max_len}")

    # ── Load tokenizer & model ────────────────────────────────────────────────
    logger.info(f"Loading tokenizer from {model_dir} …")
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))

    logger.info(f"Loading model from {model_dir} …")
    model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
    model.to(device)
    model.eval()

    logger.info("✅ Model loaded successfully!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model once on startup, release nothing on shutdown."""
    load_model()
    yield


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="BrandTide ML Service",
    description="XLM-RoBERTa multilingual sentiment classifier",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tightened via ALLOWED_ORIGINS env var if needed
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────────────────────

class SingleRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to classify")


class BatchItem(BaseModel):
    text: str = Field(default="", description="Review text")

    class Config:
        extra = "allow"   # pass-through extra CSV columns unchanged


class BatchRequest(BaseModel):
    reviews: list[BatchItem] = Field(..., min_items=1, max_items=500)


class PredictionResult(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]


# ── Inference ─────────────────────────────────────────────────────────────────

@torch.no_grad()
def predict_texts(texts: list[str]) -> list[PredictionResult]:
    """Run inference on a batch of texts and return predictions."""
    if model is None or tokenizer is None:
        raise RuntimeError("Model not loaded")

    encoding = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=max_len,
        return_tensors="pt",
    )
    encoding = {k: v.to(device) for k, v in encoding.items()}

    outputs = model(**encoding)
    probs   = torch.softmax(outputs.logits, dim=-1).cpu()

    results = []
    for i in range(len(texts)):
        scores_dict = {
            label_name: round(probs[i][idx].item(), 4)
            for idx, label_name in label_mapping.items()
        }
        predicted_idx = probs[i].argmax().item()
        results.append(PredictionResult(
            label=label_mapping[predicted_idx],
            confidence=round(probs[i][predicted_idx].item(), 4),
            scores=scores_dict,
        ))

    return results


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(device) if device else None,
    }


@app.post("/predict")
async def predict_single(req: SingleRequest):
    """Classify a single text."""
    try:
        results = predict_texts([req.text])
        return {
            "success": True,
            "data": {
                "label":      results[0].label,
                "confidence": results[0].confidence,
                "scores":     results[0].scores,
            },
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
async def predict_batch(req: BatchRequest):
    """Classify a batch of reviews."""
    try:
        texts   = [item.text for item in req.reviews]
        results = predict_texts(texts)

        output = []
        for item, pred in zip(req.reviews, results):
            row = item.model_dump()
            row["label"]      = pred.label
            row["confidence"] = pred.confidence
            row["scores"]     = pred.scores
            output.append(row)

        return {"success": True, "data": output}
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # HuggingFace Spaces injects PORT=7860 automatically.
    # Local dev falls back to ML_PORT or 8000.
    port = int(os.environ.get("PORT", os.environ.get("ML_PORT", 7860)))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)