from pydantic import BaseModel
from datetime import date
from typing import Optional
from decimal import Decimal

class TripBase(BaseModel):
    title: str
    start_date: date
    end_date: date
    total_budget: Decimal
    is_public: bool = False
    
class TripCreate(TripBase):
    user_id: int

class TripResponse(TripBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
