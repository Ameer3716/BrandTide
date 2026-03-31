# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ── Python deps ───────────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── App code ──────────────────────────────────────────────────────────────────
COPY . .

# ── Pre-bake the model into the image ─────────────────────────────────────────
# This runs during `docker build`, so the model is already on disk when the
# container starts.  The image will be ~1.5 GB but startup is instant with no
# network download needed at runtime.
#
# If the HF repo is private, pass your token as a build-arg:
#   docker build --build-arg HF_TOKEN=hf_xxxx .
ARG HF_TOKEN=""
ENV HF_TOKEN=${HF_TOKEN}

RUN python - <<'EOF'
import os
from huggingface_hub import snapshot_download

repo   = os.environ.get("HF_MODEL_REPO", "AbdullahCheemaDev/XLM-RoBERTa_Multilingual")
token  = os.environ.get("HF_TOKEN") or None
target = "/app/model/best_model"

print(f"Pre-downloading model '{repo}' into {target} …")
snapshot_download(
    repo_id=repo,
    local_dir=target,
    token=token,
    allow_patterns=["*.json", "*.safetensors", "*.txt", "*.model"],
)
print("Model pre-download complete.")
EOF

# ── HuggingFace Spaces expects the app on port 7860 ───────────────────────────
EXPOSE 7860

# Use uvicorn directly (no gunicorn needed for a single-worker CPU Space).
# PORT is injected automatically by HuggingFace Spaces at runtime.
CMD ["uvicorn", "app:app", \
     "--host", "0.0.0.0", \
     "--port", "7860", \
     "--timeout-keep-alive", "300", \
     "--workers", "1"]