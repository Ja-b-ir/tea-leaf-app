"""
main.py
-------
FastAPI application entrypoint. Routes:

  Public:
    GET  /api/health
    GET  /api/classes            -> disease info shown on the client
    GET  /api/model-stats        -> headline numbers from the training run
    POST /api/predict            -> upload a leaf photo, get a prediction

  Admin (JWT protected):
    POST /api/admin/login
    GET  /api/admin/dashboard    -> aggregate stats for AdminDashboard
    GET  /api/admin/history      -> paginated prediction history
    DELETE /api/admin/history/{id}
    GET  /api/admin/classes
    PUT  /api/admin/classes/{class_name}
"""

import os
import json
import uuid
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import init_db, get_db, PredictionRecord, ClassInfo
from auth import verify_admin, create_access_token, get_current_admin
import model as model_lib

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Tea Leaf Disease Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # demo only — restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def _startup():
    init_db()
    model_lib.ensure_model_file()


# ── Headline numbers from the training notebook — shown on About/Admin ─────
MODEL_STATS = {
    "test_accuracy": 0.8541,
    "test_loss": 0.3992,
    "binary_avg_accuracy": 0.9277,
    "phase1_epochs": 74,
    "phase1_best_val_acc": 0.8099,
    "phase2_epochs": 53,
    "phase2_best_val_acc": 0.8569,
    "train_images": 18339,
    "val_images": 2290,
    "test_images": 4182,
    "total_params": 6248790,
    "backbone": "EfficientNetV2B0 (ImageNet pretrained)",
    "num_classes": 6,
    "class_names": model_lib.CLASS_NAMES,
    "thresholds": {
        "base_threshold": model_lib.BASE_THRESHOLD,
        "delta_threshold": model_lib.DELTA_THRESHOLD,
        "high_conf_threshold": model_lib.HIGH_CONF_THRESHOLD,
    },
    "per_class": {
        "Healthy":            {"precision": 0.68, "recall": 0.83, "f1": 0.75, "support": 593,  "binary_acc": 0.8714},
        "Helopeltis":         {"precision": 0.84, "recall": 0.82, "f1": 0.83, "support": 725,  "binary_acc": 0.9232},
        "Not_Tea_Leaf":       {"precision": 1.00, "recall": 1.00, "f1": 1.00, "support": 806,  "binary_acc": 1.0000},
        "Red_Spider":         {"precision": 0.89, "recall": 0.78, "f1": 0.83, "support": 713,  "binary_acc": 0.9328},
        "Sunlight_Scorching": {"precision": 0.83, "recall": 0.74, "f1": 0.79, "support": 602,  "binary_acc": 0.9087},
        "Thrips":             {"precision": 0.86, "recall": 0.91, "f1": 0.88, "support": 743,  "binary_acc": 0.9302},
    },
}


@app.get("/api/health")
def health():
    return {"status": "ok", "model_ready": model_lib.model_ready()}


@app.get("/api/model-stats")
def get_model_stats():
    return MODEL_STATS


@app.get("/api/classes")
def get_classes(db: Session = Depends(get_db)):
    return [c.to_dict() for c in db.query(ClassInfo).order_by(ClassInfo.id).all()]


@app.post("/api/predict")
async def predict(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not model_lib.model_ready():
        raise HTTPException(
            status_code=503,
            detail="Model file not found on server. Place best_phase2.keras in backend/model/.",
        )

    contents = await file.read()
    try:
        result = model_lib.predict_image(contents)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    saved_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, saved_name), "wb") as f:
        f.write(contents)

    record = PredictionRecord(
        image_path=saved_name,
        mode=result["mode"],
        classes=json.dumps(result["classes"]),
        scores=json.dumps(result["scores"]),
        all_probs=json.dumps(result["all_probs"]),
        message=result["message"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record.to_dict()


# ─────────────────────────────── Admin ─────────────────────────────────────

@app.post("/api/admin/login")
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = verify_admin(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/admin/dashboard")
def admin_dashboard(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    total = db.query(func.count(PredictionRecord.id)).scalar() or 0

    by_mode = dict(
        db.query(PredictionRecord.mode, func.count(PredictionRecord.id))
        .group_by(PredictionRecord.mode).all()
    )

    # count first predicted class per record
    class_counts = {c: 0 for c in model_lib.CLASS_NAMES}
    for (classes_json,) in db.query(PredictionRecord.classes).all():
        classes = json.loads(classes_json)
        if classes:
            class_counts[classes[0]] = class_counts.get(classes[0], 0) + 1

    recent = (db.query(PredictionRecord)
              .order_by(PredictionRecord.created_at.desc())
              .limit(5).all())

    return {
        "total_predictions": total,
        "by_mode": by_mode,
        "by_class": class_counts,
        "recent": [r.to_dict() for r in recent],
        "model_stats": MODEL_STATS,
    }


@app.get("/api/admin/history")
def admin_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    class_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    q = db.query(PredictionRecord)
    if class_filter:
        q = q.filter(PredictionRecord.classes.contains(class_filter))
    total = q.count()
    items = (q.order_by(PredictionRecord.created_at.desc())
             .offset((page - 1) * page_size).limit(page_size).all())
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [r.to_dict() for r in items],
    }


@app.delete("/api/admin/history/{record_id}")
def delete_history(record_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    image_path = os.path.join(UPLOAD_DIR, record.image_path)
    if os.path.exists(image_path):
        os.remove(image_path)
    db.delete(record)
    db.commit()
    return {"deleted": record_id}


@app.get("/api/admin/classes")
def admin_get_classes(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return [c.to_dict() for c in db.query(ClassInfo).order_by(ClassInfo.id).all()]


@app.put("/api/admin/classes/{class_name}")
def admin_update_class(class_name: str, payload: dict, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    c = db.query(ClassInfo).filter(ClassInfo.class_name == class_name).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    for field in ("display_name", "description", "symptoms", "treatment"):
        if field in payload:
            setattr(c, field, payload[field])
    db.commit()
    db.refresh(c)
    return c.to_dict()
