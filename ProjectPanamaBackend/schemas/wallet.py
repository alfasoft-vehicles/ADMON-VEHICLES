from pydantic import BaseModel

class Surcharge(BaseModel):
  id: str
  value: str

class newSurcharge(BaseModel):
  company_code: str
  driver_number: str
  user: str
  surcharges_list: list[Surcharge]