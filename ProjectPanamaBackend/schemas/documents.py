from pydantic import BaseModel

class Info(BaseModel):
  driver_number: str
  vehicle_number: str