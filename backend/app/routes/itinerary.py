from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.city import City
from app.models.day import Day
from app.models.activity import Activity

router = APIRouter(prefix="/itinerary", tags=["Itinerary"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{trip_id}")
def get_itinerary(trip_id: int, db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.trip_id == trip_id).all()
    result = []

    for city in cities:
        days = db.query(Day).filter(Day.city_id == city.id).all()
        day_data = []

        for day in days:
            activities = db.query(Activity).filter(Activity.day_id == day.id).all()
            day_data.append({
                "date": day.travel_date,
                "activities": activities
            })

        result.append({
            "city": city.city_name,
            "days": day_data
        })

    return result
