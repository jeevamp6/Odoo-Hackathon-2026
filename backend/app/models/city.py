from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    city_name = Column(String(100))
    arrival_date = Column(Date)
    departure_date = Column(Date)
