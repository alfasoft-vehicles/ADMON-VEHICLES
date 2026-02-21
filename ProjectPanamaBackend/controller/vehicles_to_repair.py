from fastapi.responses import JSONResponse, FileResponse
from fastapi import UploadFile, File, BackgroundTasks, HTTPException
from config.dbconnection import session
from models.patios import Patios
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.propietarios import Propietarios
from models.estados import Estados
from models.permisosusuario import PermisosUsuario
from models.vehiculosreparacion import VehiculosReparacion
from models.infoempresas import InfoEmpresas
from schemas.vehicles_to_repair import NewVehicleEntry
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pytz
from dotenv import load_dotenv
from typing import List
import os
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from utils.pdf import qr_pdf

PDF_THREAD_POOL = ThreadPoolExecutor(max_workers=4)

load_dotenv()

upload_directory = os.getenv('DIRECTORY_IMG')
route_app = os.getenv('ROUTE_APP')
qr_path = 'vehicles_to_repair'

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

    fecha_obj = datetime.strptime(data.date, "%d/%m/%Y").date()

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
      FECHA=fecha_obj,
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

#-----------------------------------------------------------------------------------------------

async def upload_images(entry_id: int, images: List[UploadFile] = File(...)):
  db = session()
  try:

    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()
    if not entry:
      raise HTTPException(status_code=404, detail=f"Entrada de vehículo a patio con ID {entry_id} no encontrada.")

    vehicle_number = entry.UNIDAD
    company_code = entry.EMPRESA

    available_slots = []
    for i in range(1, 7):
        column_name = f"FOTO{i:02d}"
        if not getattr(entry, column_name):
            available_slots.append(column_name)

    if not available_slots:
        return JSONResponse(
            content={"message": "No hay espacios disponibles para guardar más fotos."},
            status_code=400
        )
        
    full_entry_path = os.path.join(upload_directory, "vehiculos" ,company_code, vehicle_number, "patio", str(entry_id))
    os.makedirs(full_entry_path, exist_ok=True)

    saved_count = 0
    for slot_name, image in zip(available_slots, images):
        
        _, ext = os.path.splitext(image.filename)
        new_filename = f"{slot_name.lower()}{ext}"
        
        full_file_path = os.path.join(full_entry_path, new_filename)
        with open(full_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        relative_db_path = os.path.join(company_code, vehicle_number, "patio", str(entry_id), new_filename)
        normalized_path = relative_db_path.replace("\\", "/") 
        setattr(entry, slot_name, normalized_path) 
        saved_count += 1

    entry.ESTADO = "FIN"
    entry.NRO_FOTOS = saved_count

    db.commit()

    message = f"{saved_count} de {len(images)} imágenes fueron guardadas."
    if len(images) > saved_count:
        message += f" {len(images) - saved_count} fueron descartadas por falta de espacio."

    return JSONResponse(content={"message": message}, status_code=201)

  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def generate_qr(entry_id: int):
  db = session()
  try:

    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()

    if not entry:
      return JSONResponse(content={"message": f"Entrada de vehículo a patio con ID {entry_id} no encontrada."}, status_code=404)

    if entry.ESTADO != "FIN":
      return JSONResponse(content={"message": "El registro aún no está finalizado"}, status_code=400)
    
    headers = {
      "Content-Disposition": "attachment; filename=doc_qr.pdf"
    }
    pdf_name = "doc_qr.pdf"

    if entry.DOCQR != "" and entry.DOCQR is not None:
      full_path = os.path.join(upload_directory, "vehiculos", entry.DOCQR).replace("\\", "/")
      if os.path.exists(full_path):
        return FileResponse(
          full_path,
          media_type="application/pdf",
          filename=pdf_name,
          headers=headers
        )
    else:
      vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == entry.UNIDAD, Vehiculos.EMPRESA == entry.EMPRESA).first()

      driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR).first()

      states = db.query(Estados).filter(Estados.EMPRESA == entry.EMPRESA).all()
      state_vehicle = next((state.NOMBRE for state in states if state.CODIGO == vehicle.ESTADO), '')

      id_owner = vehicle.PROPI_IDEN if vehicle.PROPI_IDEN else ''
      if id_owner:
        owner = db.query(Propietarios).filter(Propietarios.CODIGO == id_owner, Propietarios.EMPRESA == entry.EMPRESA).first()
        if owner:
          owner_vehicle = owner.CODIGO + ' - ' + owner.NOMBRE
        else:
          owner_vehicle = ''

      info_empresa = db.query(InfoEmpresas).filter(InfoEmpresas.ID == entry.EMPRESA).first()

      vehicle_info = {
        'vehicle_number': entry.UNIDAD,
        'brand': vehicle.NOMMARCA + ' ' + vehicle.LINEA,
        'model': vehicle.MODELO,
        'plate': vehicle.PLACA,
        'vehicle_state': state_vehicle,
        'owner': owner_vehicle,
        'quota': vehicle.NRO_CUPO if vehicle.NRO_CUPO else '',
        'driver_name': driver.NOMBRE if driver else '',
        'driver_code': vehicle.CONDUCTOR if vehicle.CONDUCTOR else '',
        'driver_phone': driver.TELEFONO if driver else '',
        'justification': entry.JUSTIFICACION,
        'company_name': info_empresa.NOMBRE if info_empresa else '',
        'company_logo': info_empresa.LOGO if info_empresa else ''
      }
      
      full_entry_path = os.path.join(upload_directory, "vehiculos", entry.EMPRESA, entry.UNIDAD, "patio", str(entry_id))
      os.makedirs(full_entry_path, exist_ok=True)

      full_pdf_path = os.path.join(full_entry_path, pdf_name)

      loop = asyncio.get_event_loop()
      await loop.run_in_executor(
        PDF_THREAD_POOL,
        qr_pdf,
        route_app,
        qr_path,
        vehicle_info,
        full_pdf_path
      )

      relative_path = os.path.join(entry.EMPRESA, entry.UNIDAD, "patio", str(entry_id), pdf_name).replace("\\", "/")

      entry.DOCQR = relative_path
      db.commit()

      return FileResponse(
        full_pdf_path,
        media_type="application/pdf",
        filename=pdf_name,
        headers=headers
      )

  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()