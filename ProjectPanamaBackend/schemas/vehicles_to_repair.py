from pydantic import BaseModel
from typing import Optional

class NewVehicleEntry(BaseModel):
  user: str
  company_code: str
  vehicle_number: str
  yard: str
  justify: str
  date: str
  time: str

class VehicleToRepairInfo(BaseModel):
    usuario: str
    propietario: Optional[str] = None
    patio: Optional[str] = None
    vehiculo: Optional[str] = None
    fechaInicial: Optional[str] = None
    fechaFinal: Optional[str] = None