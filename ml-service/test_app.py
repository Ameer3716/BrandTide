import pytest
import sys
from unittest.mock import patch, MagicMock

# --- Fake Torch ---
class FakeTensor:
    def __init__(self, data):
        self.data = data
    def to(self, *args, **kwargs): return self
    @property
    def shape(self): return (len(self.data), len(self.data[0])) if hasattr(self.data[0], '__len__') else (len(self.data),)
    def cpu(self): return self
    def __getitem__(self, idx):
        return FakeTensor(self.data[idx]) if isinstance(self.data, list) else self
    def item(self):
        return self.data
    def argmax(self, dim=None):
        if not isinstance(self.data, list): return FakeTensor(0)
        idx = max(range(len(self.data)), key=self.data.__getitem__)
        return FakeTensor(idx)

class FakeTorch:
    class device:
        def __init__(self, name): self.name = name
        def __str__(self): return self.name
    
    @staticmethod
    def tensor(data, **kwargs):
        return FakeTensor(data)
        
    @staticmethod
    def softmax(logits, dim=-1):
        return logits
        
    @staticmethod
    def no_grad():
        def decorator(func): return func
        return decorator

sys.modules['torch'] = FakeTorch()
sys.modules['transformers'] = MagicMock()
# ------------------

from fastapi.testclient import TestClient
import torch
import app as ml_app

class MockModel:
    def __call__(self, **kwargs):
        input_ids = kwargs.get("input_ids")
        batch_size = input_ids.shape[0] if input_ids is not None else 1
        class Output:
            # Return fake logits where index 1 (neutral) is highest
            logits = torch.tensor([[0.1, 0.8, 0.1]] * batch_size)
        return Output()
    
    def eval(self): pass
    def to(self, device): pass

class MockTokenizer:
    def __call__(self, texts, **kwargs):
        batch_size = len(texts)
        return {
            "input_ids": torch.tensor([[1, 2, 3]] * batch_size),
            "attention_mask": torch.tensor([[1, 1, 1]] * batch_size)
        }

@pytest.fixture
def client():
    # Patch model and tokenizer directly
    ml_app.model = MockModel()
    ml_app.tokenizer = MockTokenizer()
    ml_app.label_mapping = {0: "negative", 1: "neutral", 2: "positive"}
    ml_app.max_len = 128
    ml_app.device = torch.device("cpu")
    
    with patch("app.load_model", return_value=None):
        with TestClient(ml_app.app) as c:
            yield c

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True

def test_predict_single(client):
    response = client.post("/predict", json={"text": "This is a great product!"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "label" in data["data"]
    assert data["data"]["label"] == "neutral"

def test_predict_batch(client):
    response = client.post("/predict/batch", json={
        "reviews": [{"text": "Good"}, {"text": "Bad"}]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 2
    assert data["data"][0]["label"] == "neutral"
    assert data["data"][1]["label"] == "neutral"

def test_predict_empty_text(client):
    response = client.post("/predict", json={"text": ""})
    assert response.status_code == 422

def test_predict_batch_empty_array(client):
    response = client.post("/predict/batch", json={"reviews": []})
    assert response.status_code == 422

def test_predict_batch_extra_fields(client):
    response = client.post("/predict/batch", json={
        "reviews": [{"text": "Good", "custom_id": 123}]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"][0]["custom_id"] == 123
