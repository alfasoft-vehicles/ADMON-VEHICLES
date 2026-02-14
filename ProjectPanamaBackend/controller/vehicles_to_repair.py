from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.propietarios import Propietarios
from models.estados import Estados
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pytz

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