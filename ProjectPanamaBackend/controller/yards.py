from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.patios import Patios
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.propietarios import Propietarios
from models.estados import Estados
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pytz

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

#-----------------------------------------------------------------------------------------------

async def new_vehicle_entry_data(company_code: str, vehicle_number: str):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == vehicle_number, Vehiculos.EMPRESA == company_code).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)
    
    driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR).first()

    states = db.query(Estados).filter(Estados.EMPRESA == company_code).all()
    state_vehicle = next((state.NOMBRE for state in states if state.CODIGO == vehicle.ESTADO), '')
    
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    date = now_in_panama.strftime("%d/%m/%Y")
    current_time = now_in_panama.strftime("%H:%M:%S")

    id_owner = vehicle.PROPI_IDEN if vehicle.PROPI_IDEN else ''
    if id_owner:
      owner = db.query(Propietarios).filter(Propietarios.CODIGO == id_owner, Propietarios.EMPRESA == company_code).first()
      if owner:
        owner_vehicle = owner.CODIGO + ' - ' + owner.NOMBRE
      else:
        owner_vehicle = ''

    vehicle_info = {
      'vehicle_number': vehicle_number,
      'brand': vehicle.NOMMARCA + ' ' + vehicle.LINEA,
      'model': vehicle.MODELO,
      'plate': vehicle.PLACA,
      'vehicle_state': state_vehicle,
      'owner': owner_vehicle,
      'quota': vehicle.NRO_CUPO if vehicle.NRO_CUPO else '',
      'driver_name': driver.NOMBRE if driver else '',
      'driver_code': vehicle.CONDUCTOR if vehicle.CONDUCTOR else '',
      'driver_phone': driver.TELEFONO if driver else '',
      'inspection_date': date,
      'inspection_time': current_time,
    }
    
    return JSONResponse(content=jsonable_encoder(vehicle_info), status_code=200)
    
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()