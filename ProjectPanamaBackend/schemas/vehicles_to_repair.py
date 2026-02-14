from pydantic import BaseModel

class NewVehicleEntry(BaseModel):
  user: str
  company_code: str
  vehicle_number: str
  yard: str
  justify: str
  date: str
  time: str