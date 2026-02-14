from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.patios import Patios
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.propietarios import Propietarios
from models.estados import Estados
from models.permisosusuario import PermisosUsuario
from models.vehiculosreparacion import VehiculosReparacion
from schemas.vehicles_to_repair import NewVehicleEntry
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
      'date': date,
      'time': current_time,
    }
    
    return JSONResponse(content=jsonable_encoder(vehicle_info), status_code=200)
    
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def create_vehicle_entry(data: NewVehicleEntry):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == data.vehicle_number, Vehiculos.EMPRESA == data.company_code).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR).first()
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)

    owner = db.query(Propietarios).filter(Propietarios.CODIGO == vehicle.PROPI_IDEN, Propietarios.EMPRESA == data.company_code).first()
    if not owner:
      return JSONResponse(content={"message": "Owner not found"}, status_code=404)
    
    yard = db.query(Patios).filter(Patios.CODIGO == data.yard, Patios.EMPRESA == data.company_code).first()
    if not yard:
      return JSONResponse(content={"message": "Yard not found"}, status_code=404)
    
    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.user, PermisosUsuario.EMPRESA == data.company_code).first()
    
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)

    new_entry = VehiculosReparacion(
      EMPRESA=data.company_code,
      UNIDAD=data.vehicle_number,
      PLACA=vehicle.PLACA,
      NRO_CUPO=vehicle.NRO_CUPO,
      PROPI_IDEN=vehicle.PROPI_IDEN,
      NOMPROPI=owner.NOMBRE,
      CONDUCTOR=vehicle.CONDUCTOR,
      CEDULA=driver.CEDULA,
      NOMCONDU=driver.NOMBRE,
      PATIO=data.yard,
      NOMPATIO=yard.NOMBRE,
      JUSTIFICACION=data.justify,
      FECHA=data.date,
      HORA=data.time,
      ESTADO="PEN",
      USUARIO=data.user if data.user else "",
      NOMUSUARIO=user.NOMBRE if user else "",
      FEC_CREADO=now_in_panama.strftime("%Y-%m-%d %H:%M:%S")
    )

    db.add(new_entry)
    db.commit()

    return JSONResponse(content={"id": new_entry.ID}, status_code=201)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()