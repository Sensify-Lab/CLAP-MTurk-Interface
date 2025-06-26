from fastapi import FastAPI, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import SessionLocal
from models import SurveyProgress

app = FastAPI()

# Allow frontend on localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve dummy audio from static folder
app.mount("/audio", StaticFiles(directory="static/audio"), name="audio")

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Login: just accept any user ID and do nothing for now
@app.post("/login")
def login(user_id: str = Form(...), db: Session = Depends(get_db)):
    # Log login event (optional)
    print(f"User '{user_id}' started a session.")
    return {"status": "ok"}

# Always return dummy song data
@app.get("/next-song")
def next_song(user_id: str):
    return {
        "song_id": "song1",
        "song_file": "song1.mp3",
        "top_feature_1": "Calm",
        "top_feature_2": "Energetic",
        "top_feature_3": "Melancholic",
        "gpt_desc": "A mellow track with ambient tones.",
        "gemini_desc": "An emotional piece evoking deep reflection.",
        "complete": False
    }

# Handle dummy submission
@app.post("/submit")
def submit_response(data: dict):
    print(f"Received submission: {data}")
    return {"status": "submitted"}

# Health check endpoint
@app.get("/health")
def health_check():
    print("FastAPI is working!")
    return {"status": "FastAPI is working!"}