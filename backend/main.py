from fastapi import FastAPI, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os, random
from models import SurveyProgress, SurveyResponse
from database import SessionLocal
from sqlalchemy.exc import NoResultFound

AUDIO_DIR = "static/audio"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Util: get all song filenames
def get_all_songs():
    return [f for f in os.listdir(AUDIO_DIR) if f.endswith(".wav")]

# POST /login
@app.post("/login")
def login(user_id: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if not user:
        user = SurveyProgress(user_id=user_id, completed_songs="")
        db.add(user)
        db.commit()
    return {"status": "ok"}

# GET /next-song
@app.get("/next-song")
def next_song(user_id: str, db: Session = Depends(get_db)):
    all_songs = get_all_songs()
    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    played = user.completed_songs.split(",") if user.completed_songs else []
    remaining = list(set(all_songs) - set(played))

    if not remaining:
        return {"complete": True}

    chosen = random.choice(remaining)
    return {
        "song_id": chosen,
        "song_file": chosen,
        "complete": False
    }

# POST /submit
@app.post("/submit")
def submit(
    user_id: str = Form(...),
    song_id: str = Form(...),
    feature1: str = Form(...),
    feature2: str = Form(...),
    feature3: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    # Save response
    response = SurveyResponse(
        user_id=user_id,
        song_id=song_id,
        feature1=feature1,
        feature2=feature2,
        feature3=feature3,
        description=description
    )
    db.add(response)

    # Update progress
    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if user:
        songs = user.completed_songs.split(",") if user.completed_songs else []
        if song_id not in songs:
            songs.append(song_id)
            user.completed_songs = ",".join(songs)
    db.commit()
    return {"status": "submitted"}

# GET /health
@app.get("/health")
def health_check():
    return {"status": "FastAPI is working!"}