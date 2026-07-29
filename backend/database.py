"""
database.py
-----------
SQLite database (via SQLAlchemy) for:
  - AdminUser        : admin panel login credentials
  - PredictionRecord : every prediction made through the client, for
                        the admin History page
  - ClassInfo        : editable disease info (symptoms/treatment/description)
                        shown on the client + editable from AdminClasses
"""

import json
import datetime as dt
from sqlalchemy import (create_engine, Column, Integer, String, Float,
                         DateTime, Text)
from sqlalchemy.orm import declarative_base, sessionmaker
from passlib.context import CryptContext

DATABASE_URL = "sqlite:///./tealeaf.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


class PredictionRecord(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, nullable=False)      # relative path under /uploads
    mode = Column(String, nullable=False)            # high_confidence | dual | default | uncertain
    classes = Column(Text, nullable=False)            # JSON list
    scores = Column(Text, nullable=False)             # JSON list
    all_probs = Column(Text, nullable=False)          # JSON dict, all 6 classes
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "image_path": self.image_path,
            "mode": self.mode,
            "classes": json.loads(self.classes),
            "scores": json.loads(self.scores),
            "all_probs": json.loads(self.all_probs),
            "message": self.message,
            "created_at": self.created_at.isoformat(),
        }


class ClassInfo(Base):
    __tablename__ = "class_info"
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    symptoms = Column(Text, nullable=False)
    treatment = Column(Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "class_name": self.class_name,
            "display_name": self.display_name,
            "description": self.description,
            "symptoms": self.symptoms,
            "treatment": self.treatment,
        }


DEFAULT_CLASS_INFO = [
    dict(class_name="Healthy", display_name="Healthy Leaf",
         description="A normal tea leaf with no signs of disease or stress.",
         symptoms="Uniform green colour, no lesions, no discolouration, no streaking.",
         treatment="No action needed — continue routine monitoring."),
    dict(class_name="Helopeltis", display_name="Helopeltis (Mosquito Bug) Damage",
         description="Insect damage caused by the Helopeltis (tea mosquito bug).",
         symptoms="Brown lesions/spots on leaves, often on young shoots.",
         treatment="Consult an agronomist about targeted insecticide application and shade management; remove heavily affected shoots."),
    dict(class_name="Not_Tea_Leaf", display_name="Not a Tea Leaf",
         description="The uploaded image does not appear to be a tea leaf.",
         symptoms="N/A",
         treatment="Please upload a clear photo of a single tea leaf."),
    dict(class_name="Red_Spider", display_name="Red Spider Mite Damage",
         description="Damage caused by red spider mites feeding on the leaf.",
         symptoms="Yellowing of the leaf, sometimes a bronze/rusty tinge, fine webbing on the underside.",
         treatment="Consult an agronomist about miticide treatment and improving field ventilation/humidity control."),
    dict(class_name="Sunlight_Scorching", display_name="Sunlight Scorching",
         description="Environmental stress from excessive sun exposure — not a disease.",
         symptoms="Darkened, dry patches typically at the leaf tips and edges.",
         treatment="Provide shade cover during peak sun hours; ensure adequate irrigation."),
    dict(class_name="Thrips", display_name="Thrips Damage",
         description="Insect damage caused by thrips feeding on the leaf surface.",
         symptoms="Silvery streaking along the leaf, especially near the central vein.",
         treatment="Consult an agronomist about targeted insecticide application; monitor young leaves closely."),
]


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(AdminUser).first():
            db.add(AdminUser(
                username="admin",
                hashed_password=pwd_context.hash("admin123"),
            ))
        if not db.query(ClassInfo).first():
            for c in DEFAULT_CLASS_INFO:
                db.add(ClassInfo(**c))
        db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
