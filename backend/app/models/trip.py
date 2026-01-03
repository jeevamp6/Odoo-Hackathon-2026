from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DECIMAL
from app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    title = Column(String(150))
    start_date = Column(Date)
    end_date = Column(Date)
    total_budget = Column(DECIMAL(10,2))
    is_public = Column(Boolean, default=False)
