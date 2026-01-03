from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.trip import Trip

router = APIRouter(prefix="/trips", tags=["Trips"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.schemas.trip import TripCreate, TripResponse

@router.post("/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    new_trip = Trip(**trip.dict())
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip
