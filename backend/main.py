from fastapi import FastAPI, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os, random, csv
from models import SurveyProgress, SurveyResponse
from database import SessionLocal

AUDIO_DIR = "static/audio"
CSV_DIR = "static/CSVs"
GEMINI_FILE = os.path.join(CSV_DIR, "gemini.csv")
CHATGPT_FILE = os.path.join(CSV_DIR, "chatgpt.csv")

descriptions_cache = {}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_all_songs():
    return [f for f in os.listdir(AUDIO_DIR) if f.endswith(".wav")]

def load_descriptions():
    if descriptions_cache:
        return descriptions_cache

    gemini_map = {}
    chatgpt_map = {}

    if os.path.exists(GEMINI_FILE):
        with open(GEMINI_FILE, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                gemini_map[row['file_name']] = row['description']

    if os.path.exists(CHATGPT_FILE):
        with open(CHATGPT_FILE, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                chatgpt_map[row['file_name']] = row['description']

    descriptions_cache['gemini'] = gemini_map
    descriptions_cache['chatgpt'] = chatgpt_map
    return descriptions_cache

@app.post("/login")
def login(user_id: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if not user:
        user = SurveyProgress(user_id=user_id, completed_songs="")
        db.add(user)
        db.commit()
    return {"status": "ok"}

@app.get("/next-song")
def next_song(user_id: str, db: Session = Depends(get_db)):
    all_songs = get_all_songs()

    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if not user:
        user = SurveyProgress(user_id=user_id, completed_songs="")
        db.add(user)
        db.commit()

    played = user.completed_songs.split(",") if user.completed_songs else []
    available = []

    for song in all_songs:
        if song in played:
            continue
        count = db.query(SurveyResponse).filter_by(song_id=song).count()
        if count < 3:
            available.append(song)

    if not available:
        return {"complete": True}

    chosen = random.choice(available)
    descriptions = load_descriptions()
    gemini_desc = descriptions['gemini'].get(chosen, "")
    chatgpt_desc = descriptions['chatgpt'].get(chosen, "")

    return {
        "song_id": chosen,
        "song_file": chosen,
        "gemini_description": gemini_desc,
        "chatgpt_description": chatgpt_desc,
        "complete": False
    }

@app.post("/submit")
def submit(
    user_id: str = Form(...),
    song_id: str = Form(...),
    feature1: str = Form(...),
    feature2: str = Form(...),
    feature3: str = Form(...),
    user_description: str = Form(...),
    gemini_rating: int = Form(...),
    chatgpt_rating: int = Form(...),
    db: Session = Depends(get_db)
):
    response = SurveyResponse(
        user_id=user_id,
        song_id=song_id,
        feature1=feature1,
        feature2=feature2,
        feature3=feature3,
        user_description=user_description,
        gemini_rating=gemini_rating,
        chatgpt_rating=chatgpt_rating
    )
    db.add(response)

    user = db.query(SurveyProgress).filter_by(user_id=user_id).first()
    if user:
        songs = user.completed_songs.split(",") if user.completed_songs else []
        if song_id not in songs:
            songs.append(song_id)
            user.completed_songs = ",".join(songs)
    db.commit()
    return {"status": "submitted"}

@app.get("/health")
def health_check():
    return {"status": "FastAPI is working!"}