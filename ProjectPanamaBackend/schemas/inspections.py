from typing import Optional
from pydantic import BaseModel

class InspectionInfo(BaseModel):
  usuario: str
  propietario: Optional[str] = None
  conductor: Optional[str] = None
  vehiculo: Optional[str] = None
  fechaInicial: Optional[str] = None
  fechaFinal: Optional[str] = None

class DownloadImageRequest(BaseModel):
  image_url: str

class NewInspection(BaseModel):
  user: str
  company_code: str
  vehicle_number: str
  mechanic_code: str
  mileage: int
  inspection_type: str
  inspection_date: str
  inspection_time: str
  alfombra: int
  copas_rines: int
  extinguidor: int
  antena: int
  lamparas: int
  triangulo: int
  gato: int
  pipa: int
  copas: int
  llanta_repuesto: int
  placa_municipal: int
  caratula_radio: int
  registro_vehiculo: int
  revisado: int
  pago_municipio: int
  formato_colisiones_menores: int
  poliza_seguros: int
  luces_delanteras: int
  luces_traseras: int
  vidrios: int
  retrovisor: int
  tapiceria: int
  gps: int
  combustible: str 
  panapass: str 
  description: str
  nota: str

class ReportInspection(BaseModel):
  user: str
  inspection_id: int

class UpdateInspection(BaseModel):
  inspection_id: int
  user: str
  mechanic_code: str
  mileage: int
  inspection_type: str
  alfombra: int
  copas_rines: int
  extinguidor: int
  antena: int
  lamparas: int
  triangulo: int
  gato: int
  pipa: int
  copas: int
  llanta_repuesto: int
  placa_municipal: int
  caratula_radio: int
  registro_vehiculo: int
  revisado: int
  pago_municipio: int
  formato_colisiones_menores: int
  poliza_seguros: int
  luces_delanteras: int
  luces_traseras: int
  vidrios: int
  retrovisor: int
  tapiceria: int
  gps: int
  combustible: str 
  panapass: str 
  description: str
  nota: str