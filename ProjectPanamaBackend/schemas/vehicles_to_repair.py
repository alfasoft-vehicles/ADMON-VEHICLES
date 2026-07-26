from pydantic import BaseModel
from typing import Optional

class NewVehicleEntry(BaseModel):
    user: str
    company_code: str
    vehicle_number: str
    yard: str
    repair_type: str
    justify: Optional[str] = ""
    date: str
    time: str

class VehicleToRepairInfo(BaseModel):
    usuario: str
    propietario: Optional[str] = None
    patio: Optional[str] = None
    vehiculo: Optional[str] = None
    fechaInicial: Optional[str] = None
    fechaFinal: Optional[str] = None

class UpdateVehicleRepair(BaseModel):
    user: str
    patio_id: str
    repair_type: str
    description: Optional[str] = ""

class DownloadImageRequest(BaseModel):
    image_url: str

class FinishRepairRequest(BaseModel):
    entry_id: int
    notes: str
    user: str