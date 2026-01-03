from fastapi import FastAPI
from app.database import engine, Base
from app.models.trip import Trip
from app.models.city import City
from app.models.day import Day
from app.models.activity import Activity
from app.routes import trips, itinerary

app = FastAPI(title="GlobalTrotters Backend")

Base.metadata.create_all(bind=engine)

app.include_router(trips.router)
app.include_router(itinerary.router)

@app.get("/")
def root():
    return {"message": "Backend is running"}
