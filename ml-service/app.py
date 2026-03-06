"""
BrandTide ML Inference Service
XLM-RoBERTa Multilingual Sentiment Classifier
Serves predictions via FastAPI for the Node.js backend.

In production (Render), the model is auto-downloaded from HuggingFace Hub
on first startup. Locally, it uses the ../model/best_model/ directory.
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

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

# ── Config ───────────────────────────────────────────────────────────────────
HF_REPO_ID = os.environ.get("HF_MODEL_REPO", "AbdullahCheemaDev/XLM-RoBERTa_Multilingual")
BASE_DIR = Path(__file__).resolve().parent

# Local path (dev) vs cached path (production)
LOCAL_MODEL_DIR = BASE_DIR.parent / "model" / "best_model"
CACHED_MODEL_DIR = BASE_DIR / "model" / "best_model"
LOCAL_LABEL_MAP = BASE_DIR.parent / "model" / "label_mapping.json"
LOCAL_MODEL_CFG = BASE_DIR.parent / "model" / "model_config.json"

# ── Globals ──────────────────────────────────────────────────────────────────
model = None
tokenizer = None
label_mapping = {}   # {0: "negative", 1: "neutral", 2: "positive"}
max_len = 128
device = None


def resolve_model_dir() -> Path:
    """Find or download the model. Priority: local dev path → cached path → HuggingFace download."""
    # 1. Local dev path (monorepo sibling folder)
    if LOCAL_MODEL_DIR.exists() and (LOCAL_MODEL_DIR / "config.json").exists():
        logger.info(f"Using local model at {LOCAL_MODEL_DIR}")
        return LOCAL_MODEL_DIR

    # 2. Already cached inside ml-service/model/
    if CACHED_MODEL_DIR.exists() and (CACHED_MODEL_DIR / "config.json").exists():
        logger.info(f"Using cached model at {CACHED_MODEL_DIR}")
        return CACHED_MODEL_DIR

    # 3. Download from HuggingFace Hub
    logger.info(f"Model not found locally. Downloading from HuggingFace: {HF_REPO_ID} ...")
    from huggingface_hub import snapshot_download
    downloaded = snapshot_download(
        repo_id=HF_REPO_ID,
        local_dir=str(CACHED_MODEL_DIR),
        allow_patterns=["*.json", "*.safetensors", "*.txt", "*.model"],
    )
    logger.info(f"Model downloaded to {downloaded}")
    return CACHED_MODEL_DIR


def load_model():
    """Load the XLM-RoBERTa model and tokenizer."""
    global model, tokenizer, label_mapping, max_len, device

    # Select device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    model_dir = resolve_model_dir()

    # Load label mapping  {"negative": 0, "neutral": 1, "positive": 2}
    label_map_path = LOCAL_LABEL_MAP if LOCAL_LABEL_MAP.exists() else model_dir.parent / "label_mapping.json"
    if label_map_path.exists():
        with open(label_map_path, "r") as f:
            raw_map = json.load(f)
        label_mapping = {v: k for k, v in raw_map.items()}
    else:
        # Fallback: use model config
        label_mapping = {0: "negative", 1: "neutral", 2: "positive"}
    logger.info(f"Label mapping: {label_mapping}")

    # Load model config for max_len
    model_cfg_path = LOCAL_MODEL_CFG if LOCAL_MODEL_CFG.exists() else model_dir.parent / "model_config.json"
    if model_cfg_path.exists():
        with open(model_cfg_path, "r") as f:
            model_cfg = json.load(f)
        max_len = model_cfg.get("max_len", 128)
    logger.info(f"Max sequence length: {max_len}")

    # Load tokenizer & model
    logger.info(f"Loading tokenizer from {model_dir} ...")
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))

    logger.info(f"Loading model from {model_dir} ...")
    model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
    model.to(device)
    model.eval()

    logger.info("Model loaded successfully!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    load_model()
    yield


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="BrandTide ML Service",
    description="XLM-RoBERTa multilingual sentiment classifier",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────
class SingleRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to classify")


class BatchItem(BaseModel):
    text: str = Field(default="", description="Review text")
    # Allow extra fields to be passed through
    class Config:
        extra = "allow"


class BatchRequest(BaseModel):
    reviews: list[BatchItem] = Field(..., min_items=1, max_items=500)


class PredictionResult(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]


# ── Inference helpers ────────────────────────────────────────────────────────
@torch.no_grad()
def predict_texts(texts: list[str]) -> list[PredictionResult]:
    """Run inference on a list of texts and return predictions."""
    if model is None or tokenizer is None:
        raise RuntimeError("Model not loaded")

    # Tokenize
    encoding = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=max_len,
        return_tensors="pt",
    )
    encoding = {k: v.to(device) for k, v in encoding.items()}

    # Forward pass
    outputs = model(**encoding)
    probs = torch.softmax(outputs.logits, dim=-1).cpu()

    results = []
    for i in range(len(texts)):
        scores_dict = {}
        for idx, label_name in label_mapping.items():
            scores_dict[label_name] = round(probs[i][idx].item(), 4)

        predicted_idx = probs[i].argmax().item()
        results.append(PredictionResult(
            label=label_mapping[predicted_idx],
            confidence=round(probs[i][predicted_idx].item(), 4),
            scores=scores_dict,
        ))

    return results


# ── Routes ───────────────────────────────────────────────────────────────────
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
                "label": results[0].label,
                "confidence": results[0].confidence,
                "scores": results[0].scores,
            },
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
async def predict_batch(req: BatchRequest):
    """Classify a batch of reviews."""
    try:
        texts = [item.text for item in req.reviews]
        results = predict_texts(texts)

        # Merge predictions back with original data
        output = []
        for item, pred in zip(req.reviews, results):
            row = item.model_dump()
            row["label"] = pred.label
            row["confidence"] = pred.confidence
            row["scores"] = pred.scores
            output.append(row)

        return {
            "success": True,
            "data": output,
        }
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ML_PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
