from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class SurveyProgress(Base):
    __tablename__ = "progress"
    user_id = Column(String, primary_key=True)
    completed_songs = Column(String)  # Comma-separated song filenames

class SurveyResponse(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)
    song_id = Column(String)
    feature1 = Column(String)
    feature2 = Column(String)
    feature3 = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)