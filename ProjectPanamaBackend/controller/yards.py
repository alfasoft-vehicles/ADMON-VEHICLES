from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.patios import Patios
from models.vehiculos import Vehiculos
from fastapi.encoders import jsonable_encoder

async def yards(company_code: str):
  db = session()
  try:
    yards_info = db.query(Patios.CODIGO, Patios.NOMBRE).filter(Patios.EMPRESA == company_code).all()

    if not yards_info:
      return JSONResponse(content={"message": "No hay patios"}, status_code=404)

    yards_list = [{'id': yard.CODIGO, 'name': yard.NOMBRE} for yard in yards_info]
    return JSONResponse(content=jsonable_encoder(yards_list), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def vehicle_yard(company_code: str, vehicle_number: str):
  db = session()
  try:
    yard_info = db.query(Patios.CODIGO, Patios.NOMBRE).join(
      Vehiculos, Patios.CODIGO == Vehiculos.PATIO
    ).filter(
      Vehiculos.NUMERO == vehicle_number,
      Patios.EMPRESA == company_code,
      Vehiculos.EMPRESA == company_code
    ).first()

    if not yard_info:
      return JSONResponse(content={"message": "No se encontró el patio del vehículo"}, status_code=404)

    return JSONResponse(content=jsonable_encoder({'id': yard_info.CODIGO, 'name': yard_info.NOMBRE}), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()