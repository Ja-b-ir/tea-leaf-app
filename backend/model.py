"""
model.py
--------
Loads the trained EfficientNetV2B0 tea-leaf-disease model and exposes a
single predict_image() function that the API calls.

Drop your trained weights file at:  backend/model/best_phase2.keras
(this is the file produced by the training notebook — Section 9:
`best_model = tf.keras.models.load_model("best_phase2.keras")`)

The smart_predict() logic below is copied as-is from the training
notebook (Delta-Gap Threshold layer) so the demo app makes exactly the
same decisions the notebook reported.
"""

import os
import io
import numpy as np
from PIL import Image

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "best_phase2.keras")

# Optional: a direct-download URL for the model file (e.g. a Hugging Face
# model repo file link). If set, the model is downloaded to MODEL_PATH the
# first time the server starts — this lets you keep the (often 20MB+) model
# file out of GitHub entirely, since GitHub's browser upload caps at 25MB.
# On Render, set this as an environment variable named MODEL_URL.
MODEL_URL = os.environ.get("MODEL_URL", "").strip()

IMG_HEIGHT, IMG_WIDTH = 224, 224

CLASS_NAMES = ["Healthy", "Helopeltis", "Not_Tea_Leaf",
               "Red_Spider", "Sunlight_Scorching", "Thrips"]

# ── Smart Prediction thresholds (must match training notebook) ─────────────
BASE_THRESHOLD = 0.35
DELTA_THRESHOLD = 0.15
HIGH_CONF_THRESHOLD = 0.65

CONFUSED_CLASSES = {"Red_Spider", "Thrips", "Helopeltis"}
CONFUSED_INDICES = {CLASS_NAMES.index(c) for c in CONFUSED_CLASSES}

# ── Lazy model load — TensorFlow is heavy, only import/load when needed ────
_model = None
_load_error = None


def ensure_model_file() -> bool:
    """
    Downloads the model from MODEL_URL if it isn't already on disk.
    Called at server startup (see main.py) and again lazily before load,
    so it works whether or not the startup download succeeded yet.
    Returns True if the model file is present after this call.
    """
    if os.path.exists(MODEL_PATH):
        return True
    if not MODEL_URL:
        return False
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    import urllib.request
    print(f"[model] Downloading model from {MODEL_URL} ...", flush=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("[model] Download complete.", flush=True)
    return True


def _get_model():
    global _model, _load_error
    if _model is not None:
        return _model
    if _load_error is not None:
        raise _load_error
    try:
        ensure_model_file()
        import tensorflow as tf
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}, and no MODEL_URL was "
                f"set to download it. Copy best_phase2.keras into backend/model/, "
                f"or set the MODEL_URL environment variable."
            )
        _model = tf.keras.models.load_model(MODEL_PATH)
        return _model
    except Exception as e:  # noqa: BLE001
        _load_error = e
        raise


def model_ready() -> bool:
    return os.path.exists(MODEL_PATH) or bool(MODEL_URL)


def smart_predict(probs: np.ndarray) -> dict:
    """Delta-Gap Threshold prediction logic (identical to training notebook)."""
    sorted_idx = np.argsort(probs)[::-1]
    top1_idx, top2_idx = sorted_idx[0], sorted_idx[1]
    top1_score, top2_score = float(probs[top1_idx]), float(probs[top2_idx])
    delta = top1_score - top2_score
    top1_name, top2_name = CLASS_NAMES[top1_idx], CLASS_NAMES[top2_idx]

    if top1_score >= HIGH_CONF_THRESHOLD:
        return {
            "mode": "high_confidence",
            "classes": [top1_name],
            "scores": [top1_score],
            "message": f"High confidence — {top1_name} ({top1_score*100:.1f}%)",
        }

    both_confused = top1_idx in CONFUSED_INDICES and top2_idx in CONFUSED_INDICES
    if (delta < DELTA_THRESHOLD and both_confused
            and top1_score >= BASE_THRESHOLD and top2_score >= BASE_THRESHOLD):
        return {
            "mode": "dual",
            "classes": [top1_name, top2_name],
            "scores": [top1_score, top2_score],
            "message": (f"Ambiguous — possible {top1_name} ({top1_score*100:.1f}%) "
                        f"OR {top2_name} ({top2_score*100:.1f}%)  [Δ={delta*100:.1f}%]"),
        }

    if top1_score >= BASE_THRESHOLD:
        return {
            "mode": "default",
            "classes": [top1_name],
            "scores": [top1_score],
            "message": f"Default — {top1_name} ({top1_score*100:.1f}%)",
        }

    return {
        "mode": "uncertain",
        "classes": [],
        "scores": [],
        "message": f"Uncertain — top score {top1_score*100:.1f}% below base threshold ({BASE_THRESHOLD*100:.0f}%)",
    }


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    """
    Loads raw image bytes -> (1, 224, 224, 3) float32 array with RAW pixel
    values [0,255]. Do NOT rescale here — EfficientNetV2B0 was built with
    include_preprocessing=True, so the model normalises internally.
    """
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    arr = np.asarray(img).astype("float32")
    return np.expand_dims(arr, axis=0)


def predict_image(file_bytes: bytes) -> dict:
    """
    Full pipeline: bytes -> preprocessed tensor -> model forward pass ->
    smart_predict() decision. Returns a JSON-serialisable dict.
    """
    model = _get_model()
    batch = preprocess_image(file_bytes)
    probs = model.predict(batch, verbose=0)[0]

    result = smart_predict(probs)
    result["all_probs"] = {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}
    return result
