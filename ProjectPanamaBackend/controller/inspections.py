from utils.inspections import update_expired_inspections
from fastapi.responses import FileResponse, JSONResponse
from fastapi import UploadFile, File, BackgroundTasks, HTTPException
import jinja2
import asyncio
from concurrent.futures import ThreadPoolExecutor
from config.dbconnection import session
from models.propietarios import Propietarios
from models.conductores import Conductores
from models.vehiculos import Vehiculos
from models.inspecciones import Inspecciones
from models.tiposinspeccion import TiposInspeccion
from models.estados import Estados
from models.permisosusuario import PermisosUsuario
from models.infoempresas import InfoEmpresas
from models.centrales import Centrales
from models.mecanicos import Mecanicos
from schemas.inspections import *
from fastapi.encoders import jsonable_encoder
from fastapi import UploadFile, File, BackgroundTasks
import os
import shutil
from typing import List
from collections import defaultdict
from datetime import datetime
import pytz
from utils.pdf import html2pdf
from utils.text import clean_text
import tempfile
from utils.panapass import get_txt_file, search_value_in_txt
from dotenv import load_dotenv
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.platypus import Frame, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT

load_dotenv()

upload_directory = os.getenv('DIRECTORY_IMG')
route_api = os.getenv('ROUTE_API')
route_app = os.getenv('ROUTE_APP')
path_10  = os.getenv('DROPBOX_INTEGRATION_PATH_10')
path_58  = os.getenv('DROPBOX_INTEGRATION_PATH_58')
qr_path = 'inspections'
PDF_THREAD_POOL = ThreadPoolExecutor(max_workers=2)

async def drivers_data(company_code: str):
  db = session()
  try:
    drivers = db.query(Conductores.CODIGO, Conductores.UND_NRO, Conductores.NOMBRE,
                       Conductores.CEDULA, Vehiculos.PROPI_IDEN
                      ).outerjoin(
                        Vehiculos, Conductores.CODIGO == Vehiculos.CONDUCTOR
                      ).filter(
                        Conductores.EMPRESA == company_code, 
                        Conductores.CODIGO != ""
                      ).all()
    
    if not drivers:
      return JSONResponse(content={"message": "Drivers not found"}, status_code=404)

    result = []

    for driver in drivers:
      result.append({
        "codigo_conductor": driver.CODIGO,
        "numero_unidad": driver.UND_NRO,
        "nombre_conductor": driver.NOMBRE,
        "cedula": driver.CEDULA,
        "codigo_propietario": driver.PROPI_IDEN or ""
      })

    return JSONResponse(content=jsonable_encoder(result), status_code=200)

  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def inspections_info_all(data: InspectionInfo, company_code: str):
  db = session()
  try:
    inspections = db.query(Inspecciones).filter(Inspecciones.EMPRESA == company_code).order_by(Inspecciones.FECHA.desc(), Inspecciones.HORA.desc()).all()

    if not inspections:
      return JSONResponse(content={"message": "No inspections found"}, status_code=404)

    await update_expired_inspections(db, inspections_list=inspections)

    inspections_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == company_code).all()

    inspections_dict = {inspection.CODIGO: inspection.NOMBRE for inspection in inspections_types}

    # Obtener todos los vehículos para obtener el campo cupo
    vehicles = db.query(Vehiculos).filter(Vehiculos.EMPRESA == company_code).all()
    vehicles_dict = {vehicle.NUMERO: vehicle.NRO_CUPO for vehicle in vehicles}

    owners_dict = {owner.CODIGO: owner.NOMBRE for owner in db.query(Propietarios).filter(Propietarios.EMPRESA == company_code).all()}

    inspections_data = []

    for inspection in inspections:
      fotos = []
      for i in range(1, 17): 
        foto_field = f"FOTO{i:02d}"
        foto_value = getattr(inspection, foto_field, "")
        if foto_value and foto_value.strip(): 
          foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
          fotos.append(foto_url)

      firma_url = f"{route_api}uploads/vehiculos/{inspection.FIRMA}" if inspection.FIRMA and inspection.FIRMA.strip() else ''

      puede_editar = 1 if (inspection.ESTADO == "PEN" and data.usuario and inspection.USUARIO == data.usuario) else 0

      user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == inspection.USUARIO).first()
      
      inspections_data.append({
        "id": inspection.ID,
        "fecha_hora": inspection.FECHA.strftime('%d-%m-%Y') + ' ' + inspection.HORA.strftime('%H:%M') if inspection.FECHA and inspection.HORA else None,
        "propietario": inspection.PROPI_IDEN,
        "tipo_inspeccion": inspections_dict.get(inspection.TIPO_INSPEC, ""),
        "id_tipo_inspeccion": inspection.TIPO_INSPEC,
        "descripcion": inspection.DESCRIPCION,
        "unidad": inspection.UNIDAD,
        "placa": inspection.PLACA,
        "cupo": vehicles_dict.get(inspection.UNIDAD, ""),
        "nombre_usuario": user.NOMBRE if user else "",
        "propietario": owners_dict.get(inspection.PROPI_IDEN, ""),
        "estado_inspeccion": inspection.ESTADO,
        "puede_editar": puede_editar,
        "fotos": fotos,
        "firma": [firma_url]
      })

    if not inspections_data:
      return JSONResponse(content={"message": "No inspections found"}, status_code=404)
    return JSONResponse(content=jsonable_encoder(inspections_data), status_code=200)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def inspections_info(data: InspectionInfo, company_code: str):
  db = session()
  try:
    filters = [
      Inspecciones.EMPRESA == company_code
    ]

    if data.fechaInicial != '' and data.fechaFinal != '':
        filters.append(Inspecciones.FECHA >= data.fechaInicial)
        filters.append(Inspecciones.FECHA <= data.fechaFinal)
    
    if data.propietario != '':
        filters.append(Inspecciones.PROPI_IDEN == data.propietario)
    
    if data.vehiculo != '':
        filters.append(Inspecciones.UNIDAD == data.vehiculo)
    
    if data.conductor != '':
        filters.append(Inspecciones.CONDUCTOR == data.conductor)

    inspections = db.query(Inspecciones).filter(*filters).order_by(Inspecciones.FECHA.desc(), Inspecciones.HORA.desc()).all()

    if not inspections:
      return JSONResponse(content={"message": "No inspections found"}, status_code=404)

    await update_expired_inspections(db, inspections_list=inspections)

    inspections_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == company_code).all()

    inspections_dict = {inspection.CODIGO: inspection.NOMBRE for inspection in inspections_types}

    owners_dict = {owner.CODIGO: owner.NOMBRE for owner in db.query(Propietarios).filter(Propietarios.EMPRESA == company_code).all()}

    # Obtener todos los vehículos para obtener el campo cupo
    vehicles = db.query(Vehiculos).filter(Vehiculos.EMPRESA == company_code).all()
    vehicles_dict = {vehicle.NUMERO: vehicle.NRO_CUPO for vehicle in vehicles}

    inspections_data = []

    for inspection in inspections:
      fotos = []
      for i in range(1, 17): 
        foto_field = f"FOTO{i:02d}"
        foto_value = getattr(inspection, foto_field, "")
        if foto_value and foto_value.strip(): 
          foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
          fotos.append(foto_url)

      firma_url = f"{route_api}uploads/vehiculos/{inspection.FIRMA}" if inspection.FIRMA and inspection.FIRMA.strip() else ''
      
      puede_editar = 1 if (inspection.ESTADO == "PEN" and data.usuario and inspection.USUARIO == data.usuario) else 0

      user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == inspection.USUARIO).first()
      
      inspections_data.append({
        "id": inspection.ID,
        "fecha_hora": inspection.FECHA.strftime('%d-%m-%Y') + ' ' + inspection.HORA.strftime('%H:%M') if inspection.FECHA and inspection.HORA else None,
        "propietario": inspection.PROPI_IDEN,
        "tipo_inspeccion": inspections_dict.get(inspection.TIPO_INSPEC, ""),
        "id_tipo_inspeccion": inspection.TIPO_INSPEC,
        "descripcion": inspection.DESCRIPCION,
        "unidad": inspection.UNIDAD,
        "placa": inspection.PLACA,
        "cupo": vehicles_dict.get(inspection.UNIDAD, ""),
        "nombre_usuario": user.NOMBRE if user else "",
        "propietario": owners_dict.get(inspection.PROPI_IDEN, ""),
        "estado_inspeccion": inspection.ESTADO,
        "puede_editar": puede_editar,
        "fotos": fotos,
        "firma": [firma_url]
      })

    if not inspections_data:
      return JSONResponse(content={"message": "No inspections found"}, status_code=404)
    return JSONResponse(content=jsonable_encoder(inspections_data), status_code=200)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------
async def upload_images(inspection_id: int, images: List[UploadFile] = File(...)):
  db = session()
  try:
    inspection = db.query(Inspecciones).filter(Inspecciones.ID == inspection_id).first()
    if not inspection:
      raise HTTPException(status_code=404, detail=f"Inspección con ID {inspection_id} no encontrada.")

    vehicle_number = inspection.UNIDAD
    company_code = inspection.EMPRESA

    available_slots = []
    for i in range(1, 17):
        column_name = f"FOTO{i:02d}"
        if not getattr(inspection, column_name):
            available_slots.append(column_name)

    if not available_slots:
        return JSONResponse(
            content={"message": "No hay espacios disponibles para guardar más fotos."},
            status_code=400
        )
        
    full_inspection_path = os.path.join(upload_directory, "vehiculos" ,company_code, vehicle_number, "inspecciones", str(inspection_id))
    os.makedirs(full_inspection_path, exist_ok=True)

    saved_count = 0
    for slot_name, image in zip(available_slots, images):
        
        _, ext = os.path.splitext(image.filename)
        new_filename = f"{slot_name.lower()}{ext}"
        
        full_file_path = os.path.join(full_inspection_path, new_filename)
        with open(full_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        relative_db_path = os.path.join(company_code, vehicle_number, "inspecciones", str(inspection_id), new_filename)
        normalized_path = relative_db_path.replace("\\", "/") 
        setattr(inspection, slot_name, normalized_path) 
        saved_count += 1

    inspection.ESTADO = "FIN"
    inspection.NRO_FOTOS = saved_count

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
async def upload_signature(inspection_id: int, signature: UploadFile = File(...)):
  db = session()
  try:
    inspection = db.query(Inspecciones).filter(Inspecciones.ID == inspection_id).first()
    if not inspection:
      raise HTTPException(status_code=404, detail=f"Inspección con ID {inspection_id} no encontrada.")

    vehicle_number = inspection.UNIDAD
    company_code = inspection.EMPRESA

    # Verificar si ya existe una firma
    if inspection.FIRMA:
      return JSONResponse(
        content={"message": "Ya existe una firma para esta inspección."},
        status_code=400
      )

    # Crear el directorio para la firma dentro de la carpeta de inspecciones
    full_signature_path = os.path.join(upload_directory, "vehiculos", company_code, vehicle_number, "inspecciones", str(inspection_id))
    os.makedirs(full_signature_path, exist_ok=True)

    # Obtener la extensión del archivo
    _, ext = os.path.splitext(signature.filename)
    new_filename = f"firma{ext}"

    # Guardar el archivo
    full_file_path = os.path.join(full_signature_path, new_filename)
    with open(full_file_path, "wb") as buffer:
      shutil.copyfileobj(signature.file, buffer)

    # Crear la ruta relativa para guardar en la base de datos
    relative_db_path = os.path.join(company_code, vehicle_number, "inspecciones", str(inspection_id), new_filename)
    normalized_path = relative_db_path.replace("\\", "/")
    
    # Actualizar el campo FIRMA en la base de datos
    inspection.FIRMA = normalized_path

    db.commit()

    return JSONResponse(content={"message": "Firma guardada exitosamente.", "path": normalized_path}, status_code=201)

  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------
async def report_inspections(data, company_code: str):
  db = session()
  try:
    filters = [
        Inspecciones.EMPRESA == company_code
    ]

    if data.fechaInicial and data.fechaFinal:
        filters.append(Inspecciones.FECHA >= data.fechaInicial)
        filters.append(Inspecciones.FECHA <= data.fechaFinal)

    # Filtrar inspecciones por propietario, conductor y vehículo
    if data.propietario != '':
        filters.append(Inspecciones.PROPI_IDEN == data.propietario)
    
    if data.vehiculo != '':
        filters.append(Inspecciones.UNIDAD == data.vehiculo)
    
    if data.conductor != '':
        filters.append(Inspecciones.CONDUCTOR == data.conductor)

    inspections = db.query(Inspecciones).filter(*filters).order_by(Inspecciones.FECHA.desc(), Inspecciones.HORA.desc()).all()

    if not inspections:
      return JSONResponse(content={"message": "No inspections found"}, status_code=404)

    await update_expired_inspections(db, inspections_list=inspections)

    filtered_inspections = []
    for inspection in inspections:
      if inspection.ESTADO == "PEN":
        if data.usuario and inspection.USUARIO == data.usuario:
          filtered_inspections.append(inspection)
      else:
        filtered_inspections.append(inspection)

    inspections = filtered_inspections

    inspections_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == company_code).all()

    inspections_dict = {inspection.CODIGO: inspection.NOMBRE for inspection in inspections_types}

    owners_dict = defaultdict(list)

    for inspection in inspections:
      inspections_data ={
        "id": inspection.ID,
        "fecha_hora": inspection.FECHA.strftime('%d-%m-%Y') + ' ' + inspection.HORA.strftime('%H:%M') if inspection.FECHA and inspection.HORA else None,
        "fecha_obj": inspection.FECHA,  # Guardar objeto fecha para ordenar
        "hora_obj": inspection.HORA,    # Guardar objeto hora para ordenar
        "tipo_inspeccion": inspections_dict.get(inspection.TIPO_INSPEC, "").title(),
        "descripcion": inspection.DESCRIPCION,
        "unidad": inspection.UNIDAD,
        "placa": inspection.PLACA,
        "kilometraje": inspection.KILOMETRAJ if inspection.KILOMETRAJ else "",
        "nombre_usuario": inspection.NOMUSUARIO if inspection.NOMUSUARIO else "",
        "propietario": inspection.PROPI_IDEN,
        "estado_inspeccion": "FINALIZADA" if inspection.ESTADO == "FIN" else ("PENDIENTE" if inspection.ESTADO == "PEN" else ("SUSPENDIDA" if inspection.ESTADO == "SUS" else inspection.ESTADO)),
        "acciones": ""
      }
      owners_dict[inspection.PROPI_IDEN].append(inspections_data)

    # Ordenar las inspecciones de cada propietario por fecha y hora descendente
    for owner_code in owners_dict:
      owners_dict[owner_code].sort(
        key=lambda x: (x['fecha_obj'] or datetime.min.date(), x['hora_obj'] or datetime.min.time()),
        reverse=True
      )
      # Eliminar los objetos temporales de fecha y hora
      for insp in owners_dict[owner_code]:
        del insp['fecha_obj']
        del insp['hora_obj']

    result = []
    for owner_code, inspections in owners_dict.items():
      owner = db.query(Propietarios).filter(Propietarios.CODIGO == owner_code).first()
      if owner:
        result.append({
          "codigo_propietario": owner.CODIGO,
          "nombre_propietario": owner.NOMBRE,
          "cantidad_inspecciones": len(inspections),
          "inspecciones": inspections
        })

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.usuario).first()
    user = user.NOMBRE if user else ""

    #Total de inspecciones sumando la cantidad de inspecciones por propietario
    total_inspecciones = sum(len(inspections) for inspections in owners_dict.values())

    # Datos de la fecha y hora actual
    # Define la zona horaria de Ciudad de Panamá
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")

    titulo = 'Reporte de inspecciones'
    data_view = {
      'inspections': result,
      'fechas': {
            "fecha_inicial": datetime.strptime(data.fechaInicial, "%Y-%m-%d").strftime("%d/%m/%Y") if data.fechaInicial else "",
            "fecha_final": datetime.strptime(data.fechaFinal, "%Y-%m-%d").strftime("%d/%m/%Y") if data.fechaFinal else ""
        },
      'total_inspecciones': total_inspecciones,
      'fecha': fecha,
      'hora': hora_actual,
      'usuario': user if user else "",
      'titulo': titulo
    }

    headers = {
      "Content-Disposition": "attachment; filename=reporte-inspecciones.pdf"
    }

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    header_file = "header.html"
    footer_file = "footer.html"
    template = template_env.get_template("ReporteInspecciones.html")
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
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

    # Ejecutar la conversión PDF en un thread separado para no bloquear el event loop
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
      PDF_THREAD_POOL,
      html2pdf,
      titulo,
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

    response = FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='templates/reporte-inspecciones.pdf', 
        headers=headers,
        background=background_tasks
      )

    return response
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def inspection_types(company_code: str):
  db = session()
  try:
    inspection_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == company_code).all()

    if not inspection_types:
      return JSONResponse(content={"message": "Inspection types not found"}, status_code=404)

    result = [{"id": inspection_type.CODIGO, "nombre": inspection_type.NOMBRE, "tipo": inspection_type.TIPO} for inspection_type in inspection_types]

    return JSONResponse(content=jsonable_encoder(result), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def new_inspection_data(company_code: str, vehicle_number: str):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == vehicle_number, Vehiculos.EMPRESA == company_code).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)
    
    driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR).first()

    states = db.query(Estados).filter(Estados.EMPRESA == company_code).all()
    state_vehicle = next((state.NOMBRE for state in states if state.CODIGO == vehicle.ESTADO), '')
    
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%H:%M:%S")

    print(hora_actual)

    # Obtener el archivo de texto para la empresa
    txt_file_path = get_txt_file(vehicle.EMPRESA)
    if txt_file_path:
      panapass_value = search_value_in_txt('Unidad', vehicle_number, 'Saldo Cuenta PanaPass', txt_file_path)
    else:
      panapass_value = ''

    id_owner = vehicle.PROPI_IDEN if vehicle.PROPI_IDEN else ''
    if id_owner:
      owner = db.query(Propietarios).filter(Propietarios.CODIGO == id_owner, Propietarios.EMPRESA == company_code).first()
      if owner:
        owner_vehicle = owner.CODIGO + ' - ' + owner.NOMBRE
      else:
        owner_vehicle = ''

    vehicle_info = {
      'numero': vehicle_number,
      'marca': vehicle.NOMMARCA + ' ' + vehicle.LINEA,
      'modelo': vehicle.MODELO,
      'placa': vehicle.PLACA,
      'estado_vehiculo': state_vehicle,
      'propietario': owner_vehicle,
      'cupo': vehicle.NRO_CUPO if vehicle.NRO_CUPO else '',
      'conductor_nombre': driver.NOMBRE if driver else '',
      'conductor_codigo': vehicle.CONDUCTOR if vehicle.CONDUCTOR else '',
      'conductor_celular': driver.TELEFONO if driver else '',
      'kilometraje': vehicle.KILOMETRAJ if vehicle.KILOMETRAJ else '',
      'fecha_inspeccion': fecha,
      'hora_inspeccion': hora_actual,
      'panapass': panapass_value if panapass_value else ''
    }
    
    return JSONResponse(content=jsonable_encoder(vehicle_info), status_code=200)
    
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()
    
#-----------------------------------------------------------------------------------------------

async def create_inspection(data: NewInspection):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == data.vehicle_number, Vehiculos.EMPRESA == data.company_code).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehiculo no encontrado"}, status_code=404)

    driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR).first()
    if not driver:
      return JSONResponse(content={"message": "Conductor no encontrado"}, status_code=404)

    owner = db.query(Propietarios).filter(Propietarios.CODIGO == vehicle.PROPI_IDEN, Propietarios.EMPRESA == data.company_code).first()
    if not owner:
      return JSONResponse(content={"message": "Propietario no encontrado"}, status_code=404)
    
    inspection_type = db.query(TiposInspeccion).filter(TiposInspeccion.CODIGO == data.inspection_type, TiposInspeccion.EMPRESA == data.company_code).first()
    if not inspection_type:
      return JSONResponse(content={"message": "Tipo de inspección no encontrado"}, status_code=404)
    
    mechanic = db.query(Mecanicos).filter(Mecanicos.CODIGO == data.mechanic_code, Mecanicos.EMPRESA == data.company_code).first()
    if not mechanic:
      return JSONResponse(content={"message": "Mecánico no encontrado"}, status_code=404)
    
    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.user, PermisosUsuario.EMPRESA == data.company_code).first()
    
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)

    fecha_obj = datetime.strptime(data.inspection_date, "%d/%m/%Y").date()

    new_inspection = Inspecciones(
      EMPRESA=data.company_code,
      UNIDAD=vehicle.NUMERO,
      PLACA=vehicle.PLACA,
      NRO_CUPO=vehicle.NRO_CUPO,
      PROPI_IDEN=vehicle.PROPI_IDEN,
      NOMPROPI=owner.NOMBRE,
      CONDUCTOR=vehicle.CONDUCTOR,
      CEDULA=driver.CEDULA,
      NOMCONDU=driver.NOMBRE,
      TIPO_INSPEC=inspection_type.CODIGO,
      NOMINSPEC=inspection_type.NOMBRE,
      MECANICO=mechanic.CODIGO,
      NOM_MECANICO=mechanic.NOMBRE,
      KILOMETRAJ=data.mileage,
      DESCRIPCION=data.description,
      OBSERVA=data.nota,
      FECHA=fecha_obj,
      HORA=data.inspection_time,
      ALFOMBRA=data.alfombra,
      ANTENA=data.antena,
      CARATRADIO=data.caratula_radio,
      COMBUSTIBLE=data.combustible,
      COPASRINES=data.copas_rines,
      EXTINGUIDOR=data.extinguidor,
      FORMACOLIS=data.formato_colisiones_menores,
      GATO=data.gato,
      GPS=data.gps,
      LAMPARAS=data.lamparas,
      LLANTAREPU=data.llanta_repuesto,
      LUZDELANTE=data.luces_delanteras,
      LUZTRACERA=data.luces_traseras,
      PAGOMUNICI=data.pago_municipio,
      PANAPASS=data.panapass,
      PIPA=data.pipa,
      PLACAMUNIC=data.placa_municipal,
      POLISEGURO=data.poliza_seguros,
      REGISVEHIC=data.registro_vehiculo,
      RETROVISOR=data.retrovisor,
      REVISADO=data.revisado,
      TAPICERIA=data.tapiceria,
      TRIANGULO=data.triangulo,
      VIDRIOS=data.vidrios,
      USUARIO=data.user if data.user else "",
      NOMUSUARIO=user.NOMBRE if user else "",
      FEC_CREADO=now_in_panama.strftime("%Y-%m-%d %H:%M:%S")
    )

    if data.mileage and (vehicle.KILOMETRAJ is None or data.mileage > vehicle.KILOMETRAJ):
        vehicle.KILO_ANTES = vehicle.KILOMETRAJ
        vehicle.KILOMETRAJ = data.mileage
        db.add(vehicle)

    db.add(new_inspection)
    db.commit()

    base_path = None

    if vehicle.EMPRESA == '10':
      base_path = path_10
    elif vehicle.EMPRESA == '58':
      base_path = path_58

    if base_path:
      panama_timezone = pytz.timezone('America/Panama')
      now_in_panama = datetime.now(panama_timezone)

      text_file = os.path.join(base_path, f"inspeccion_{vehicle.NUMERO}.txt")
      print(text_file)
      with open(text_file, 'w') as file:
        file.write(f"{vehicle.NUMERO},,{vehicle.CONDUCTOR},,,{data.mileage},{data.description},,{now_in_panama.strftime('%Y-%m-%d')},{clean_text(data.user)}")

    return JSONResponse(content={"id": new_inspection.ID}, status_code=201)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def update_inspection(data: UpdateInspection):
  db = session()
  try:
    inspection = db.query(Inspecciones).filter(Inspecciones.ID == data.inspection_id).first()
    
    if not inspection:
      return JSONResponse(content={"message": "Inspección no encontrada"}, status_code=404)
    
    # Verificar que la inspección esté en estado PENDIENTE
    if inspection.ESTADO != "PEN":
      return JSONResponse(content={"message": "Solo se pueden editar inspecciones PENDIENTES"}, status_code=400)
    
    # Verificar que el usuario sea el creador de la inspección
    if inspection.USUARIO != data.user:
      return JSONResponse(content={"message": "No tienes permiso para editar esta inspección"}, status_code=403)
    
    mechanic = db.query(Mecanicos).filter(Mecanicos.CODIGO == data.mechanic_code, Mecanicos.EMPRESA == inspection.EMPRESA).first()
    if not mechanic:
      return JSONResponse(content={"message": "Mecánico no encontrado"}, status_code=404)
    
    # Actualizar los campos de la inspección
    inspection.MECANICO = mechanic.CODIGO
    inspection.NOM_MECANICO = mechanic.NOMBRE
    inspection.KILOMETRAJ = data.mileage
    inspection.TIPO_INSPEC = data.inspection_type
    inspection.ALFOMBRA = bool(data.alfombra)
    inspection.COPASRINES = bool(data.copas_rines)
    inspection.EXTINGUIDOR = bool(data.extinguidor)
    inspection.ANTENA = bool(data.antena)
    inspection.LAMPARAS = bool(data.lamparas)
    inspection.TRIANGULO = bool(data.triangulo)
    inspection.GATO = bool(data.gato)
    inspection.PIPA = bool(data.pipa)
    inspection.PLACAMUNIC = bool(data.placa_municipal)
    inspection.CARATRADIO = bool(data.caratula_radio)
    inspection.REGISVEHIC = bool(data.registro_vehiculo)
    inspection.REVISADO = bool(data.revisado)
    inspection.PAGOMUNICI = bool(data.pago_municipio)
    inspection.FORMACOLIS = bool(data.formato_colisiones_menores)
    inspection.POLISEGURO = bool(data.poliza_seguros)
    inspection.LUZDELANTE = bool(data.luces_delanteras)
    inspection.LUZTRACERA = bool(data.luces_traseras)
    inspection.VIDRIOS = bool(data.vidrios)
    inspection.RETROVISOR = bool(data.retrovisor)
    inspection.TAPICERIA = bool(data.tapiceria)
    inspection.GPS = bool(data.gps)
    inspection.LLANTAREPU = bool(data.llanta_repuesto)
    inspection.COMBUSTIBLE = data.combustible
    inspection.PANAPASS = data.panapass
    inspection.DESCRIPCION = data.description
    inspection.OBSERVA = data.nota
    
    # Actualizar kilometraje del vehículo si es mayor
    vehicle = db.query(Vehiculos).filter(
      Vehiculos.NUMERO == inspection.UNIDAD,
      Vehiculos.EMPRESA == inspection.EMPRESA
    ).first()
    
    if vehicle and data.mileage and (vehicle.KILOMETRAJ is None or data.mileage > vehicle.KILOMETRAJ):
      vehicle.KILO_ANTES = vehicle.KILOMETRAJ
      vehicle.KILOMETRAJ = data.mileage
      db.add(vehicle)
    
    db.commit()
    db.refresh(inspection)
    
    return JSONResponse(content={
      "message": "Inspección actualizada exitosamente",
      "id": inspection.ID
    }, status_code=200)
    
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def download_image_by_url(image_url: str):
  try:
    if "/uploads/" not in image_url:
      return JSONResponse(content={"message": "URL no válida"}, status_code=400)
    
    relative_path = image_url.split("/uploads/")[1]
    
    full_image_path = os.path.join(upload_directory, "vehiculos", relative_path)
    
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

async def inspection_details(inspection_id: int):
  db = session()
  try:
    inspection = db.query(Inspecciones).filter(Inspecciones.ID == inspection_id).first()
    if not inspection:
      return JSONResponse(content={"message": "Inspection not found"}, status_code=404)

    await update_expired_inspections(db, inspections_list=[inspection])

    inspections_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == inspection.EMPRESA).all()
    inspections_dict = {insp.CODIGO: insp.NOMBRE for insp in inspections_types}

    company_info = db.query(InfoEmpresas).filter(InfoEmpresas.ID == inspection.EMPRESA).first()

    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == inspection.UNIDAD, Vehiculos.EMPRESA == inspection.EMPRESA).first()

    states = db.query(Estados).filter(Estados.EMPRESA == inspection.EMPRESA).all()
    state_vehicle = next((state.CODIGO + ' - ' + state.NOMBRE for state in states if state.CODIGO == vehicle.ESTADO), '') if vehicle else ''

    owners = db.query(Propietarios).filter(Propietarios.CODIGO == inspection.PROPI_IDEN, Propietarios.EMPRESA == inspection.EMPRESA).first()
    owner_name = owners.CODIGO + ' - ' + owners.NOMBRE if owners else ''

    fotos = []
    for i in range(1, 17): 
      foto_field = f"FOTO{i:02d}"
      foto_value = getattr(inspection, foto_field, "")
      if foto_value and foto_value.strip(): 
        foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
        fotos.append(foto_url)

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == inspection.USUARIO).first()
    
    inspection_data = {
      "id": inspection.ID,
      "empresa": company_info.NOMBRE if company_info else "",
      "fecha": inspection.FECHA.strftime('%d-%m-%Y') if inspection.FECHA else None,
      "hora": inspection.HORA.strftime('%H:%M') if inspection.HORA else None,
      "propietario": owner_name,
      "nombre_propietario": inspection.NOMPROPI,
      "conductor": inspection.CONDUCTOR,
      "nombre_conductor": inspection.NOMCONDU,
      "cedula_conductor": inspection.CEDULA,
      "estado_vehiculo": state_vehicle,
      "tipo_inspeccion": inspections_dict.get(inspection.TIPO_INSPEC, ""),
      "descripcion": inspection.DESCRIPCION,
      "unidad": inspection.UNIDAD,
      "placa": inspection.PLACA,
      "cupo": vehicle.NRO_CUPO if vehicle and vehicle.NRO_CUPO else "",
      "kilometraje": inspection.KILOMETRAJ if inspection.KILOMETRAJ else "",
      "mecanico": inspection.MECANICO + ' - ' + inspection.NOM_MECANICO if inspection.MECANICO and inspection.NOM_MECANICO else "",
      "panapass": inspection.PANAPASS if inspection.PANAPASS else "",
      "combustible": inspection.COMBUSTIBLE if inspection.COMBUSTIBLE else "",
      "observaciones": inspection.OBSERVA if inspection.OBSERVA else "",
      "estado_inspeccion": inspection.ESTADO,
      "alfombra": inspection.ALFOMBRA,
      "antena": inspection.ANTENA,
      "caratradio": inspection.CARATRADIO,
      "copasrines": inspection.COPASRINES,
      "extinguidor": inspection.EXTINGUIDOR,
      "formatocolis": inspection.FORMACOLIS,
      "gato": inspection.GATO,
      "gps": inspection.GPS,
      "lamparas": inspection.LAMPARAS,
      "llantarepu": inspection.LLANTAREPU,
      "luzdelante": inspection.LUZDELANTE,
      "luztracera": inspection.LUZTRACERA,
      "pagomunici": inspection.PAGOMUNICI,
      "pipa": inspection.PIPA,
      "placamunic": inspection.PLACAMUNIC,
      "poliseguro": inspection.POLISEGURO,
      "regisvehic": inspection.REGISVEHIC,
      "retrovisor": inspection.RETROVISOR,
      "revisado": inspection.REVISADO,
      "tapiceria": inspection.TAPICERIA,
      "triangulo": inspection.TRIANGULO,
      "vidrios": inspection.VIDRIOS,
      "usuario": user.NOMBRE if user else "",
      "fotos": fotos,
      "firma": 1 if inspection.FIRMA and inspection.FIRMA.strip() else 0
    }

    return JSONResponse(content=jsonable_encoder(inspection_data), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------
async def generate_inspection_pdf(data: ReportInspection, company_code: str):
  db = session()
  try:
    inspection = db.query(Inspecciones).filter(Inspecciones.ID == data.inspection_id, Inspecciones.EMPRESA == company_code).first()
    if not inspection:
      return JSONResponse(content={"message": "Inspection not found"}, status_code=404)
    
    inspections_types = db.query(TiposInspeccion).filter(TiposInspeccion.EMPRESA == inspection.EMPRESA).all()
    inspections_dict = {insp.CODIGO: insp.NOMBRE for insp in inspections_types}

    company_info = db.query(InfoEmpresas).filter(InfoEmpresas.ID == inspection.EMPRESA).first()

    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == inspection.UNIDAD, Vehiculos.EMPRESA == inspection.EMPRESA).first()

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == inspection.USUARIO).first()

    fotos = []
    for i in range(1, 17): 
      foto_field = f"FOTO{i:02d}"
      foto_value = getattr(inspection, foto_field, "")
      if foto_value and foto_value.strip(): 
        foto_url = f"{route_api}uploads/vehiculos/{foto_value}"
        fotos.append(foto_url)

    firma_url = f"{route_api}uploads/vehiculos/{inspection.FIRMA}" if inspection.FIRMA and inspection.FIRMA.strip() else ''
    
    inspection_data = {
      "id": inspection.ID,
      "empresa": company_info.NOMBRE if company_info else "",
      "fecha": inspection.FECHA.strftime('%d-%m-%Y') if inspection.FECHA else None,
      "hora": inspection.HORA.strftime('%H:%M') if inspection.HORA else None,
      "propietario": inspection.PROPI_IDEN,
      "nombre_propietario": inspection.NOMPROPI,
      "conductor": inspection.CONDUCTOR,
      "nombre_conductor": inspection.NOMCONDU,
      "cedula_conductor": inspection.CEDULA,
      "tipo_inspeccion": inspections_dict.get(inspection.TIPO_INSPEC, ""),
      "descripcion": inspection.DESCRIPCION,
      "unidad": inspection.UNIDAD,
      "placa": inspection.PLACA,
      "cupo": vehicle.NRO_CUPO if vehicle and vehicle.NRO_CUPO else "",
      "mecanico": inspection.NOM_MECANICO if inspection.NOM_MECANICO else "",
      "kilometraje": inspection.KILOMETRAJ if inspection.KILOMETRAJ else "",
      "combustible": inspection.COMBUSTIBLE if inspection.COMBUSTIBLE else "",
      "panapass": inspection.PANAPASS if inspection.PANAPASS else "",
      "observaciones": inspection.OBSERVA if inspection.OBSERVA else "",
      "estado_inspeccion": inspection.ESTADO,
      "alfombra": inspection.ALFOMBRA,
      "antena": inspection.ANTENA,
      "caratradio": inspection.CARATRADIO,
      "copasrines": inspection.COPASRINES,
      "extinguidor": inspection.EXTINGUIDOR,
      "formatocolis": inspection.FORMACOLIS,
      "gato": inspection.GATO,
      "gps": inspection.GPS,
      "lamparas": inspection.LAMPARAS,
      "llantarepu": inspection.LLANTAREPU,
      "luzdelante": inspection.LUZDELANTE,
      "luztracera": inspection.LUZTRACERA,
      "pagomunici": inspection.PAGOMUNICI,
      "pipa": inspection.PIPA,
      "placamunic": inspection.PLACAMUNIC,
      "poliseguro": inspection.POLISEGURO,
      "regisvehic": inspection.REGISVEHIC,
      "retrovisor": inspection.RETROVISOR,
      "revisado": inspection.REVISADO,
      "tapiceria": inspection.TAPICERIA,
      "triangulo": inspection.TRIANGULO,
      "vidrios": inspection.VIDRIOS,
      "usuario": user.NOMBRE if user else "",
      "fotos": fotos,
      "firma": firma_url
    }

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.user).first()
    user = user.NOMBRE if user else ""

    # Datos de la fecha y hora actual
    # Define la zona horaria de Ciudad de Panamá
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")

    titulo = 'Inspección de vehículo'
    data_view = {
      'inspection': inspection_data,
      'fecha': fecha,
      'hora': hora_actual,
      'usuario': user if user else "",
      'titulo': titulo
    }

    headers = {
      "Content-Disposition": "attachment; filename=inspeccion.pdf"
    }

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    header_file = "header.html"
    footer_file = "footer.html"
    template = template_env.get_template("Inspecciones.html")
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
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

    # Ejecutar la conversión PDF en un thread separado para no bloquear el event loop
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
      PDF_THREAD_POOL,
      html2pdf,
      titulo,
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

    response = FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='templates/inspeccion.pdf', 
        headers=headers,
        background=background_tasks
      )

    return response
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------
async def vehicle_info(company_code: str, vehicle_number: str):
  db = session()
  try:
    vehicle = db.query(
    Vehiculos.NUMERO,
    Vehiculos.NOMMARCA,
    Vehiculos.PLACA,
    Vehiculos.NRO_CUPO,
    Vehiculos.NROENTREGA,
    Vehiculos.CUO_DIARIA,
    Vehiculos.VLR_DEPOSI,
    Vehiculos.CON_CUPO,
    Vehiculos.CONDUCTOR,
    Conductores.CODIGO.label('driver_code'),
    Conductores.NOMBRE.label('driver_name'),
    Conductores.CEDULA.label('driver_id'),
    Conductores.TELEFONO.label('driver_phone'),
    Conductores.DIRECCION.label('driver_address'),
    Propietarios.NOMBRE.label('owner_name'),
    Centrales.NOMBRE.label('central_name'),
    Estados.NOMBRE.label('state_name')
      ).join(Conductores, (Conductores.CODIGO == Vehiculos.CONDUCTOR) & (Conductores.EMPRESA == Vehiculos.EMPRESA)
      ).join(Propietarios, (Propietarios.CODIGO == Vehiculos.PROPI_IDEN) & (Propietarios.EMPRESA == Vehiculos.EMPRESA)
      ).join(Centrales, (Centrales.CODIGO == Vehiculos.CENTRAL) & (Centrales.EMPRESA == Vehiculos.EMPRESA)
      ).join(Estados, (Estados.CODIGO == Vehiculos.ESTADO) & (Estados.EMPRESA == Vehiculos.EMPRESA)
      ).filter(Vehiculos.EMPRESA == company_code, Vehiculos.NUMERO == vehicle_number
      ).first()
    
    inspections = db.query(Inspecciones).filter(Inspecciones.UNIDAD == vehicle_number, Inspecciones.EMPRESA == company_code).all()
    
    if not vehicle:
       return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    info = {
      'vehicle_number': vehicle.NUMERO,
      'model': vehicle.NOMMARCA,
      'plate': vehicle.PLACA,
      'quota': vehicle.NRO_CUPO,
      'central': vehicle.central_name,
      'owner_name': vehicle.owner_name,
      'nro_delivery': vehicle.NROENTREGA,
      'daily_quota': vehicle.CUO_DIARIA,
      'deposit_value': vehicle.VLR_DEPOSI,
      'state_name': vehicle.state_name,
      'has_quota': 'Con Cupo' if vehicle.CON_CUPO == '1' else '',
      'driver_code': vehicle.driver_code,
      'driver_name': vehicle.driver_name,
      'driver_id': vehicle.driver_id,
      'driver_phone': vehicle.driver_phone,
      'driver_address': vehicle.driver_address,
      'inspections': len(inspections) if inspections else 0
    }
    
    return JSONResponse(content=jsonable_encoder(info), status_code=200)
    
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------
async def generate_qr(company_code: str, vehicle_number: str):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == vehicle_number, Vehiculos.EMPRESA == company_code).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)
    
    owner = db.query(Propietarios).filter(Propietarios.CODIGO == vehicle.PROPI_IDEN, Propietarios.EMPRESA == company_code).first()
    owner_name = owner.NOMBRE if owner else ''

    full_url = f"{route_app}{qr_path}/{vehicle_number}"
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_qr:
      qr = qrcode.make(full_url)
      qr.save(tmp_qr.name)
      tmp_qr_path = tmp_qr.name

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
      tmp_pdf_path = tmp_pdf.name
      
      sticker_width = 50 * mm
      sticker_height = 30 * mm
      
      pdf = canvas.Canvas(tmp_pdf_path, pagesize=(sticker_width, sticker_height))

      qr_size = 24 * mm 
      x_qr = 2 * mm
      y_qr = (sticker_height - qr_size) / 2  

      pdf.drawInlineImage(tmp_qr_path, x_qr, y_qr, qr_size, qr_size)

      text_x = x_qr + qr_size + (2 * mm) 
      text_width = sticker_width - text_x - 2 * mm
      text_height = 20 * mm
      vertical_offset = 3 * mm
      text_y = (sticker_height - text_height) / 2 - vertical_offset
      
      frame = Frame(text_x, text_y, text_width, text_height, 
                    topPadding=0, bottomPadding=0, leftPadding=0, rightPadding=0,
                    showBoundary=0)

      owner_style = ParagraphStyle(
        'owner_style',
        fontName='Helvetica',
        fontSize=6,
        leading=7,
        alignment=TA_LEFT,
        spaceAfter=3
      )
      owner_p = Paragraph(owner_name, owner_style)

      vehicle_style = ParagraphStyle(
        'vehicle_style',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        alignment=TA_LEFT
      )
      vehicle_p = Paragraph(vehicle_number, vehicle_style)

      frame.addFromList([owner_p, vehicle_p], pdf)
      pdf.showPage()
      pdf.save()

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, tmp_pdf_path)
    background_tasks.add_task(os.remove, tmp_qr_path)

    return FileResponse(
      tmp_pdf_path,
      media_type='application/pdf',
      filename='qr_code.pdf',
      background=background_tasks
    )
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)