from models.tiposreparaciones import TiposReparaciones
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
from schemas.vehicles_to_repair import NewVehicleEntry, VehicleToRepairInfo, UpdateVehicleRepair, FinishRepairRequest
from utils.vehicles_to_repair import update_expired_entries
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
from typing import List
import os
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from utils.pdf import qr_pdf, html2pdf
from collections import defaultdict
import jinja2
import tempfile

PDF_THREAD_POOL = ThreadPoolExecutor(max_workers=4)

load_dotenv()

upload_directory = os.getenv('DIRECTORY_IMG')
route_api = os.getenv('ROUTE_API')
route_app = os.getenv('ROUTE_APP')
qr_path = 'vehicle-repair'

async def get_repair_types(company_code: str):
  db = session()
  try:
    repairs_types = db.query(TiposReparaciones).filter(TiposReparaciones.EMPRESA == company_code).all()

    repair_types_dict = {repair.CODIGO: repair.NOMBRE for repair in repairs_types}
    
    return JSONResponse(content=jsonable_encoder(repair_types_dict), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

async def get_repair_edit_data(entry_id: int):
  db = session()
  try:
    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()
    if not entry:
      return JSONResponse(content={"message": "Record not found"}, status_code=404)

    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == entry.UNIDAD, Vehiculos.EMPRESA == entry.EMPRESA).first()
    driver = db.query(Conductores).filter(Conductores.CODIGO == entry.CONDUCTOR).first()
    
    states = db.query(Estados).filter(Estados.EMPRESA == entry.EMPRESA).all()
    state_vehicle = next((state.NOMBRE for state in states if state.CODIGO == (vehicle.ESTADO if vehicle else "")), '')

    owner_str = ""
    if entry.PROPI_IDEN:
      owner = db.query(Propietarios).filter(Propietarios.CODIGO == entry.PROPI_IDEN, Propietarios.EMPRESA == entry.EMPRESA).first()
      if owner:
        owner_str = owner.CODIGO + ' - ' + owner.NOMBRE
      else:
        owner_str = entry.PROPI_IDEN

    yard = db.query(Patios).filter(Patios.CODIGO == entry.PATIO, Patios.EMPRESA == entry.EMPRESA).first()

    data = {
      "id": entry.ID,
      "unidad": entry.UNIDAD,
      "placa": entry.PLACA,
      "propietario": owner_str,
      "estado_vehiculo": state_vehicle,
      "cupo": vehicle.NRO_CUPO if vehicle else entry.NRO_CUPO,
      "conductor_nombre": entry.NOMCONDU,
      "conductor_codigo": entry.CONDUCTOR,
      "conductor_celular": driver.TELEFONO if driver else "",
      "fecha": entry.FECHA.strftime('%d-%m-%Y') if entry.FECHA else None,
      "hora": entry.HORA.strftime('%H:%M') if entry.HORA else None,
      "patio": {
        "id": yard.CODIGO if yard else entry.PATIO,
        "name": yard.NOMBRE if yard else entry.NOMPATIO
      },
      "tipo_reparacion": entry.TIPOREPAR or "",
      "descripcion": entry.JUSTIFICACION
    }

    return JSONResponse(content=jsonable_encoder(data), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def update_repair_entry(entry_id: int, data: UpdateVehicleRepair):
  db = session()
  try:
    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()
    if not entry:
      return JSONResponse(content={"message": "Record not found"}, status_code=404)

    if entry.ESTADO != "PEN":
      return JSONResponse(content={"message": "Only pending records can be edited"}, status_code=400)

    if entry.USUARIO != data.user:
      return JSONResponse(content={"message": "No permission to edit this record"}, status_code=403)

    yard = db.query(Patios).filter(Patios.CODIGO == data.patio_id, Patios.EMPRESA == entry.EMPRESA).first()
    if not yard:
      return JSONResponse(content={"message": "Yard not found"}, status_code=404)

    repair_type = db.query(TiposReparaciones).filter(TiposReparaciones.CODIGO == data.repair_type, TiposReparaciones.EMPRESA == entry.EMPRESA).first()
    if not repair_type:
      return JSONResponse(content={"message": "Repair type not found"}, status_code=404)

    entry.PATIO = yard.CODIGO
    entry.NOMPATIO = yard.NOMBRE
    entry.TIPOREPAR = repair_type.CODIGO
    entry.NOMTIPOREPAR = repair_type.NOMBRE
    entry.JUSTIFICACION = data.description or ""
    entry.ESTADO = "PEN"

    db.commit()

    return JSONResponse(content={"message": "Record updated successfully"}, status_code=200)
  except Exception as e:
    db.rollback()
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
    
    repair_type = db.query(TiposReparaciones).filter(TiposReparaciones.CODIGO == data.repair_type, TiposReparaciones.EMPRESA == data.company_code).first()
    if not repair_type:
      return JSONResponse(content={"message": "Repair type not found"}, status_code=404)
    
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
      TIPOREPAR=repair_type.CODIGO,
      NOMTIPOREPAR=repair_type.NOMBRE,
      JUSTIFICACION=data.justify or "",
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

      repair_type_str = (entry.TIPOREPAR + ' - ' + entry.NOMTIPOREPAR) if entry.TIPOREPAR else (entry.NOMTIPOREPAR or '')

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
        'repair_type': repair_type_str,
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

#-----------------------------------------------------------------------------------------------

async def report_repairs(data: VehicleToRepairInfo, company_code: str):
  db = session()
  try:
    filters = [
      VehiculosReparacion.EMPRESA == company_code,
      VehiculosReparacion.ESTADO == 'FIN'
    ]

    if data.fechaInicial and data.fechaInicial.strip() and data.fechaFinal and data.fechaFinal.strip():
        filters.append(VehiculosReparacion.FECHA >= data.fechaInicial)
        filters.append(VehiculosReparacion.FECHA <= data.fechaFinal)
    
    if data.propietario and data.propietario.strip():
        filters.append(VehiculosReparacion.PROPI_IDEN == data.propietario)
    
    if data.patio and data.patio.strip():
        filters.append(VehiculosReparacion.PATIO == data.patio)
    
    if data.vehiculo and data.vehiculo.strip():
        filters.append(VehiculosReparacion.UNIDAD == data.vehiculo)

    entries = db.query(VehiculosReparacion).filter(*filters).order_by(VehiculosReparacion.FECHA.desc(), VehiculosReparacion.HORA.desc()).all()

    if not entries:
      return JSONResponse(content={"message": "No records found"}, status_code=404)

    await update_expired_entries(db, entries_list=entries)

    owners_dict = defaultdict(list)

    for entry in entries:
      fecha_formateada = entry.FECHA.strftime('%d-%m-%Y') if entry.FECHA else ""
      hora_formateada = entry.HORA.strftime('%H:%M') if entry.HORA else ""
      
      fotos = []
      for i in range(1, 7): 
        foto_field = f"FOTO{i:02d}"
        foto_value = getattr(entry, foto_field, "")
        if foto_value and foto_value.strip(): 
          foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
          fotos.append(foto_url)

      repair_info = {
        "id": entry.ID,
        "fecha_hora": f"{fecha_formateada} {hora_formateada}",
        "unidad": entry.UNIDAD,
        "placa": entry.PLACA,
        "cupo": entry.NRO_CUPO,
        "tipo_reparacion": entry.NOMTIPOREPAR or "",
        "patio": entry.NOMPATIO,
        "justificacion": entry.JUSTIFICACION,
        "estado": entry.ESTADO,
        "usuario": entry.NOMUSUARIO,
        "fotos": fotos
      }
      owners_dict[entry.PROPI_IDEN].append(repair_info)

    result = []
    for owner_code, repairs in owners_dict.items():
      owner = db.query(Propietarios).filter(Propietarios.CODIGO == owner_code, Propietarios.EMPRESA == company_code).first()
      result.append({
        "codigo_propietario": owner_code,
        "nombre_propietario": owner.NOMBRE if owner else owner_code,
        "cantidad_registros": len(repairs),
        "repairs": repairs
      })

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.usuario).first()
    
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    
    data_view = {
      'repairs': result,
      'fechas': {
            "fecha_inicial": datetime.strptime(data.fechaInicial, "%Y-%m-%d").strftime("%d/%m/%Y") if data.fechaInicial else "",
            "fecha_final": datetime.strptime(data.fechaFinal, "%Y-%m-%d").strftime("%d/%m/%Y") if data.fechaFinal else ""
        },
      'total_registros': len(entries),
      'fecha': now_in_panama.strftime("%d/%m/%Y"),
      'hora': now_in_panama.strftime("%I:%M:%S %p"),
      'usuario': user.NOMBRE if user else data.usuario,
      'titulo': 'Reporte de Vehículos en Reparación'
    }

    headers = {
      "Content-Disposition": "attachment; filename=reporte-reparaciones.pdf"
    }

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    
    template = template_env.get_template("ReporteVehiculosReparacion.html")
    header = template_env.get_template("header.html")
    footer = template_env.get_template("footer.html")
    
    output_text = template.render(data_view=data_view)
    output_header = header.render(data_view=data_view)
    output_footer = footer.render(data_view=data_view)

    with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as html_file:
      html_path = html_file.name
      html_file.write(output_text)
    with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as header_file:
      header_path = header_file.name
      header_file.write(output_header)
    with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as footer_file:
      footer_path = footer_file.name
      footer_file.write(output_footer)
    
    pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf').name

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
      PDF_THREAD_POOL,
      html2pdf,
      data_view['titulo'],
      html_path,
      pdf_path,
      header_path,
      footer_path
    )

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    return FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='reporte-reparaciones.pdf', 
        headers=headers,
        background=background_tasks
      )
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def download_image_by_url(image_url: str):
  try:
    if "/uploads/" not in image_url:
      return JSONResponse(content={"message": "URL no válida"}, status_code=400)
    
    relative_path = image_url.split("/uploads/")[1]
    
    normalized_relative_path = os.path.normpath(relative_path)
    
    full_image_path = os.path.join(upload_directory, normalized_relative_path)
    
    if not os.path.exists(full_image_path):
      return JSONResponse(content={"message": "Imagen no encontrada"}, status_code=404)
    
    filename = os.path.basename(full_image_path)
    
    headers = {
      "Content-Disposition": f"attachment; filename={filename}"
    }
    
    return FileResponse(
      path=full_image_path,
      media_type='image/jpeg',
      filename=filename,
      headers=headers
    )
    
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)

#-----------------------------------------------------------------------------------------------

async def get_pdf_url(entry_id: int):
  db = session()
  try:
    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()
    if not entry:
      return JSONResponse(content={"message": "Record not found"}, status_code=404)
    
    if not entry.DOCQR:
      return JSONResponse(content={"message": "Document not found"}, status_code=404)
    
    pdf_url = f"{route_api}uploads/vehiculos/{entry.DOCQR}"
    
    return JSONResponse(content={"url": pdf_url}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def repair_details(entry_id: int):
  db = session()
  try:
    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == entry_id).first()
    if not entry:
      return JSONResponse(content={"message": "Record not found"}, status_code=404)

    await update_expired_entries(db, entries_list=[entry])

    company_info = db.query(InfoEmpresas).filter(InfoEmpresas.ID == entry.EMPRESA).first()
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == entry.UNIDAD, Vehiculos.EMPRESA == entry.EMPRESA).first()
    owner = db.query(Propietarios).filter(Propietarios.CODIGO == entry.PROPI_IDEN, Propietarios.EMPRESA == entry.EMPRESA).first()
    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == entry.USUARIO).first()

    fotos = []
    for i in range(1, 7): 
      foto_field = f"FOTO{i:02d}"
      foto_value = getattr(entry, foto_field, "")
      if foto_value and foto_value.strip(): 
        foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
        fotos.append(foto_url)

    repair_data = {
      "id": entry.ID,
      "empresa": company_info.NOMBRE if company_info else "",
      "fecha": entry.FECHA.strftime('%d-%m-%Y') if entry.FECHA else None,
      "hora": entry.HORA.strftime('%H:%M') if entry.HORA else None,
      "propietario": (owner.CODIGO + ' - ' + owner.NOMBRE) if owner else entry.PROPI_IDEN,
      "nombre_propietario": entry.NOMPROPI,
      "unidad": entry.UNIDAD,
      "placa": entry.PLACA,
      "cupo": vehicle.NRO_CUPO if vehicle else entry.NRO_CUPO,
      "tipo_reparacion": (entry.TIPOREPAR + ' - ' + entry.NOMTIPOREPAR) if entry.TIPOREPAR else (entry.NOMTIPOREPAR or ""),
      "descripcion": entry.JUSTIFICACION,
      "patio": entry.PATIO + ' - ' + entry.NOMPATIO,
      "usuario": user.NOMBRE if user else entry.NOMUSUARIO,
      "estado": entry.ESTADO,
      "fotos": fotos,
      "qr": 1 if entry.DOCQR and entry.DOCQR.strip() else 0,
      "notasfin": getattr(entry, 'NOTAFIN', "") or ""
    }

    return JSONResponse(content=jsonable_encoder(repair_data), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------  
async def vehicles_info(data: VehicleToRepairInfo, company_code: str):
  db = session()
  try:
    filters = [
      VehiculosReparacion.EMPRESA == company_code
    ]

    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    today = now_in_panama.date()
    yesterday = today - timedelta(days=1)

    has_filters = any([
      data.fechaInicial and data.fechaInicial.strip(),
      data.fechaFinal and data.fechaFinal.strip(),
      data.propietario and data.propietario.strip(),
      data.patio and data.patio.strip(),
      data.vehiculo and data.vehiculo.strip()
    ])

    if data.fechaInicial and data.fechaInicial.strip() and data.fechaFinal and data.fechaFinal.strip():
        filters.append(VehiculosReparacion.FECHA >= data.fechaInicial)
        filters.append(VehiculosReparacion.FECHA <= data.fechaFinal)
    
    if data.propietario and data.propietario.strip():
        filters.append(VehiculosReparacion.PROPI_IDEN == data.propietario)
    
    if data.patio and data.patio.strip():
        filters.append(VehiculosReparacion.PATIO == data.patio)
    
    if data.vehiculo and data.vehiculo.strip():
        filters.append(VehiculosReparacion.UNIDAD == data.vehiculo)

    if not has_filters:
        filters.append(VehiculosReparacion.FECHA >= yesterday)

    entries = db.query(VehiculosReparacion).filter(*filters).order_by(VehiculosReparacion.FECHA.desc(), VehiculosReparacion.HORA.desc()).all()

    if not entries:
      return JSONResponse(content={"message": "No records found"}, status_code=404)

    await update_expired_entries(db, entries_list=entries)

    vehicles = db.query(Vehiculos).filter(Vehiculos.EMPRESA == company_code).all()
    vehicles_dict = {vehicle.NUMERO: vehicle.NRO_CUPO for vehicle in vehicles}

    entries_data = []

    for entry in entries:
      fotos = []
      for i in range(1, 7): 
        foto_field = f"FOTO{i:02d}"
        foto_value = getattr(entry, foto_field, "")
        if foto_value and foto_value.strip(): 
          foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
          fotos.append(foto_url)

      puede_editar = 1 if (entry.ESTADO == "PEN" and data.usuario and entry.USUARIO == data.usuario) else 0

      fecha_formateada = None
      if entry.FECHA:
        if isinstance(entry.FECHA, str):
          try:
            fecha_formateada = datetime.strptime(entry.FECHA, "%Y-%m-%d").strftime('%d-%m-%Y')
          except:
            fecha_formateada = entry.FECHA
        else:
          fecha_formateada = entry.FECHA.strftime('%d-%m-%Y')

      hora_formateada = None
      if entry.HORA:
        if isinstance(entry.HORA, str):
          hora_formateada = entry.HORA[:5]
        else:
          hora_formateada = entry.HORA.strftime('%H:%M')

      entries_data.append({
        "id": entry.ID,
        "fecha_hora": f"{fecha_formateada} {hora_formateada}" if fecha_formateada and hora_formateada else None,
        "unidad": entry.UNIDAD,
        "placa": entry.PLACA,
        "cupo": vehicles_dict.get(entry.UNIDAD, ""),
        "patio": entry.NOMPATIO,
        "justificacion": entry.JUSTIFICACION,
        "propietario": entry.NOMPROPI,
        "usuario": entry.NOMUSUARIO,
        "estado": entry.ESTADO,
        "puede_editar": puede_editar,
        "fotos": fotos
      })

    return JSONResponse(content=jsonable_encoder(entries_data), status_code=200)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def finish_repair(data: FinishRepairRequest):
  db = session()
  try:
    entry = db.query(VehiculosReparacion).filter(VehiculosReparacion.ID == data.entry_id).first()
    if not entry:
      return JSONResponse(content={"message": "Record not found"}, status_code=404)

    if entry.ESTADO != 'FIN':
      return JSONResponse(content={"message": "The record must be in 'FIN' state to be finished"}, status_code=400)

    entry.ESTADO = 'TER'
    entry.NOTAFIN = data.notes
    entry.USUARIOFIN = data.user

    db.commit()

    return JSONResponse(content={"message": "Record finished successfully"}, status_code=200)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()
