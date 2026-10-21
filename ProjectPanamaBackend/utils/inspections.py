from models.inspecciones import Inspecciones
from datetime import datetime
import pytz
from config.dbconnection import session
from fastapi.responses import JSONResponse

async def update_expired_inspections(db, company_code: str = None, inspections_list: list = None):
  """
  Función auxiliar para actualizar inspecciones pendientes que han expirado a estado suspendido.
  
  Args:
      db: Sesión de base de datos
      company_code: Código de empresa para filtrar (opcional si se pasa inspections_list)
      inspections_list: Lista de inspecciones ya consultadas (opcional)
  
  Returns:
      int: Número de inspecciones actualizadas
  """
  try:
    panama_timezone = pytz.timezone('America/Panama')
    fecha_actual = datetime.now(panama_timezone).date()
    
    inspecciones_actualizadas = 0
    
    # Si se pasa una lista de inspecciones, usar esa lista
    if inspections_list:
      inspections_to_update = inspections_list
    else:
      # Si no, consultar inspecciones pendientes de la empresa
      inspections_to_update = db.query(Inspecciones).filter(
          Inspecciones.EMPRESA == company_code,
          Inspecciones.ESTADO == "PEN"
      ).all()
    
    for inspection in inspections_to_update:
      if (inspection.ESTADO == "PEN" and 
        inspection.FECHA and 
        inspection.FECHA < fecha_actual):
        inspection.ESTADO = "SUS"
        inspecciones_actualizadas += 1
    
    if inspecciones_actualizadas > 0:
      db.commit()
    
    return inspecciones_actualizadas
      
  except Exception as e:
    db.rollback()
    print(f"Error actualizando inspecciones expiradas: {str(e)}")
    return 0
  
async def update_all_expired_inspections(company_code: str):
  """Endpoint dedicado para actualizar todas las inspecciones expiradas de una empresa"""
  db = session()
  try:
    updated_count = await update_expired_inspections(db, company_code=company_code)
    
    return JSONResponse(content={
      "message": f"Actualizadas {updated_count} inspecciones",
      "updated_count": updated_count
    }, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()