from pydantic import BaseModel
from typing import Optional

class Surcharge(BaseModel):
  id: str
  value: str

class newSurcharge(BaseModel):
  company_code: str
  vehicle_number: str
  driver_number: str
  user: str
  surcharges_list: list[Surcharge]

class Revenue(BaseModel):
  company_code: str
  vehicle_number: str
  driver_number: str
  payment_method: str
  mileage: int
  daily_rent: Optional[float] = 0.0
  accidents: Optional[float] = 0.0
  surcharges_list: Optional[list[Surcharge]] = None
  registration: Optional[float] = 0.0
  savings: Optional[float] = 0.0

class newRentReceipt(BaseModel):
  company_code: str
  vehicle_number: str
  driver_number: str
  user: str
  amount: float