from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    password = Column(String)

class SurveyProgress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    song_id = Column(String)
    song_file = Column(String)
    rank1 = Column(String)
    rank2 = Column(String)
    rank3 = Column(String)
    chosen_desc = Column(String)
    complete = Column(Boolean, default=False)