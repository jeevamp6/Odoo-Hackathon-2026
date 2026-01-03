from sqlalchemy import Column, Integer, Date, ForeignKey
from app.database import Base

class Day(Base):
    __tablename__ = "days"

    id = Column(Integer, primary_key=True)
    city_id = Column(Integer, ForeignKey("cities.id"))
    travel_date = Column(Date)
