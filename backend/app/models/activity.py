from sqlalchemy import Column, Integer, String, Time, DECIMAL, ForeignKey
from app.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True)
    day_id = Column(Integer, ForeignKey("days.id"))
    activity_name = Column(String(150))
    activity_time = Column(Time)
    cost = Column(DECIMAL(8,2))
