from models.vehiculosreparacion import VehiculosReparacion
from datetime import datetime
import pytz
from config.dbconnection import session
from fastapi.responses import JSONResponse

async def update_expired_entries(db, company_code: str = None, entries_list: list = None):
  """
  Función auxiliar para actualizar entradas de vehículos a patio pendientes que han expirado a estado suspendido.
  """
  try:
    panama_timezone = pytz.timezone('America/Panama')
    fecha_actual = datetime.now(panama_timezone).date()
    
    entradas_actualizadas = 0
    
    if entries_list:
      entries_to_update = entries_list
    else:
      entries_to_update = db.query(VehiculosReparacion).filter(
          VehiculosReparacion.EMPRESA == company_code,
          VehiculosReparacion.ESTADO == "PEN"
      ).all()
    
    for entry in entries_to_update:
      fecha_entry = entry.FECHA
      if isinstance(fecha_entry, str):
        try:
          fecha_entry = datetime.strptime(fecha_entry, "%Y-%m-%d").date()
        except ValueError:
          continue

      if (entry.ESTADO == "PEN" and 
        fecha_entry and 
        fecha_entry < fecha_actual):
        entry.ESTADO = "SUS"
        entradas_actualizadas += 1
    
    if entradas_actualizadas > 0:
      db.commit()
    
    return entradas_actualizadas
      
  except Exception as e:
    db.rollback()
    print(f"Error actualizando entradas expiradas: {str(e)}")
    return 0
