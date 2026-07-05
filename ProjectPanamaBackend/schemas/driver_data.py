from pydantic import BaseModel
from typing import Optional
from datetime import date

class DriverData(BaseModel):
  company_code: str
  vehicle_number: str
  base64: str

class FingerprintData(BaseModel):
  company_code: str
  cedula: str
  base64: str