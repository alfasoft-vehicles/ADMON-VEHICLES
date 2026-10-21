from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from config.dbconnection import session
from models.propietarios import Propietarios
from models.conductores import Conductores
from models.vehiculos import Vehiculos
from schemas.documents import Info
from fastapi import BackgroundTasks
from typing import List
from utils.pdf import merge_pdfs
import os
import re
import shutil
from utils.panapass import get_txt_file, search_value_in_txt
from dotenv import load_dotenv

load_dotenv()

docs_path = os.getenv('DOCS_PATH')

async def vehicle_documents(company_code: str, vehicle_number: str):
  try:
    base_path = os.path.join(docs_path, 'vehiculos', company_code, vehicle_number)

    if not os.path.isdir(base_path):
      return JSONResponse(content={"message": "Directorio del vehículo no encontrado."}, status_code=404)

    classified_docs = {} 
    
    for filename in os.listdir(base_path):
      match = re.match(r'^(docu(\d{2}))', filename, re.IGNORECASE)
      if match and filename.lower().endswith('.pdf'):
        doc_id = f"docu{match.group(2)}"
        
        if doc_id not in classified_docs:
          classified_docs[doc_id] = {"main": None, "folios": []}
          
        if filename.lower() == f"{doc_id}.pdf":
          classified_docs[doc_id]["main"] = filename
        else:
          classified_docs[doc_id]["folios"].append(filename)

    response_documents = []
    for i in range(0, 16):
      doc_id = f"docu{str(i).zfill(2)}"
      existe = 0
      folios = 0
      mensaje = ""
      nombre_archivo = None
      
      if doc_id in classified_docs and classified_docs[doc_id]["main"]:
        existe = 1
        nombre_archivo = classified_docs[doc_id]["main"]
        
        num_folios = len(classified_docs[doc_id]["folios"])
        if num_folios > 0:
          folios = 1
          total_docs = num_folios + 1
          mensaje = f"Tiene {total_docs} documentos."

      response_documents.append({
        "nombre_documento": doc_id,
        "nombre_archivo": nombre_archivo, 
        "existe": existe,
        "folios": folios,
        "mensaje": mensaje
      })
      
    return JSONResponse(content=jsonable_encoder(response_documents), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)

# async def vehicle_documents(company_code: str, vehicle_number: str):
#   try:
#     base_path = os.path.join(vehicle_documents_path, company_code, vehicle_number)
#     documents = []

#     if not os.path.exists(base_path):
#       return JSONResponse(content={"message": "Documentos no encontrados para la unidad."}, status_code=404)

#     for i in range(1, 16):
#       doc_id = f"docu{str(i).zfill(2)}"
#       doc_base = f"{doc_id}.pdf"
#       existe = 0
#       folios = 0
#       mensaje = ""

#       if os.path.exists(os.path.join(base_path, doc_base)):
#           existe = 1

#       # Verificar folios: docu011.pdf, docu012.pdf ... docu019.pdf
#       folios_existentes = [
#           f for f in os.listdir(base_path)
#           if f.startswith(doc_id) and f != doc_base and f.endswith(".pdf")
#       ]

#       if folios_existentes:
#         folios = 1
#         mensaje = f"Tiene {len(folios_existentes) + 1} documentos."

#       documents.append({
#         "nombre_documento": doc_id,
#         "existe": existe,
#         "folios": folios,
#         "mensaje": mensaje if folios else ""
#       })

#     return JSONResponse(content=jsonable_encoder(documents), status_code=200)
#   except Exception as e:
#     return JSONResponse(content={"message": str(e)}, status_code=500)
  
#-----------------------------------------------------------------------------------------------

async def send_vehicle_documents(company_code: str, vehicle_number: str, doc_id: str):
  try:
    base_path = os.path.join(docs_path, 'vehiculos', company_code, vehicle_number)

    if not os.path.isdir(base_path): 
      return JSONResponse(content={"message": "Directorio del vehículo no encontrado."}, status_code=404)

    base_id = doc_id.lower().replace(".pdf", "")

    folios = [
        os.path.join(base_path, f) for f in sorted(os.listdir(base_path))
        if f.lower().startswith(base_id) and f.lower().endswith(".pdf")
    ]

    if not folios:
      return JSONResponse(content={"message": "No hay documentos disponibles para enviar."}, status_code=404)
    
    if len(folios) == 1:
      return FileResponse(
        path=folios[0],
        filename=f"{doc_id}",
        media_type='application/pdf'
      )
    
    merged_pdf_path = merge_pdfs(folios)
    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, merged_pdf_path)

    return FileResponse(
      path=merged_pdf_path,
      filename=f"{base_id}_unido.pdf",
      media_type='application/pdf',
      background=background_tasks
    )

  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  
#-----------------------------------------------------------------------------------------------

async def info(company_code: str, data: Info):
  db = session()
  try:
    if data.driver_number == '':
      vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == data.vehicle_number, Vehiculos.EMPRESA == company_code).first()
      driver = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR, Conductores.EMPRESA == company_code).first()
    else:
      driver = db.query(Conductores).filter(Conductores.CODIGO == data.driver_number, Conductores.EMPRESA == company_code).first()
      vehicle = db.query(Vehiculos).filter(Vehiculos.NUMERO == driver.UND_NRO, Vehiculos.EMPRESA == company_code).first()

    owner = db.query(Propietarios).filter(Propietarios.CODIGO == vehicle.PROPI_IDEN, Propietarios.EMPRESA == company_code).first()

    txt_file_path = get_txt_file(vehicle.EMPRESA)
    if txt_file_path:
      panapass_value = search_value_in_txt('Unidad', data.vehicle_number, 'Saldo Cuenta PanaPass', txt_file_path)
    else:
      panapass_value = ''

    response = {
      "numero_unidad": vehicle.NUMERO if vehicle else '',
      "unidad_prestada": driver.UND_PRE if driver else '',
      "placa_vehiculo": vehicle.PLACA if vehicle else '',
      "nro_cupo": vehicle.NRO_CUPO if vehicle else '',
      "propietario": owner.NOMBRE + ' - ' + owner.CODIGO if owner else '',
      "codigo_conductor": driver.CODIGO if driver else '',
      "nombre_conductor": driver.NOMBRE if driver else '',
      "telefono_conductor": driver.TELEFONO if driver else '',
      "panapass": panapass_value if panapass_value else '',
      "fecha_contrato": vehicle.FEC_CONTRA.strftime('%d/%m/%Y') if vehicle.FEC_CONTRA and hasattr(vehicle.FEC_CONTRA, 'strftime') and vehicle else '',
      "valor_cuota": driver.CUO_DIARIA if driver else '',
      "numero_cuotas": driver.NROENTREGA if driver else '',
      "cuotas_pagas": driver.NROENTPAGO if driver else '',
      "cuotas_pendientes": driver.NROENTSDO if driver else ''
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  
#-----------------------------------------------------------------------------------------------

async def driver_documents(company_code: str, driver_number: str):
  try:
    base_path = os.path.join(docs_path, 'conductores', company_code, driver_number)

    if not os.path.isdir(base_path):
      return JSONResponse(content={"message": "Directorio del conductor no encontrado."}, status_code=404)

    classified_docs = {} 
    
    for filename in os.listdir(base_path):
      match = re.match(r'^(docu(\d{2}))', filename, re.IGNORECASE)
      if match and filename.lower().endswith('.pdf'):
        doc_id = f"docu{match.group(2)}"
        
        if doc_id not in classified_docs:
          classified_docs[doc_id] = {"main": None, "folios": []}
          
        if filename.lower() == f"{doc_id}.pdf":
          classified_docs[doc_id]["main"] = filename
        else:
          classified_docs[doc_id]["folios"].append(filename)

    response_documents = []
    for i in range(0, 10):
      doc_id = f"docu{str(i).zfill(2)}"
      existe = 0
      folios = 0
      mensaje = ""
      nombre_archivo = None
      
      if doc_id in classified_docs and classified_docs[doc_id]["main"]:
        existe = 1
        nombre_archivo = classified_docs[doc_id]["main"]
        
        num_folios = len(classified_docs[doc_id]["folios"])
        if num_folios > 0:
          folios = 1
          total_docs = num_folios + 1
          mensaje = f"Tiene {total_docs} documentos."

      response_documents.append({
        "nombre_documento": doc_id,
        "nombre_archivo": nombre_archivo, 
        "existe": existe,
        "folios": folios,
        "mensaje": mensaje
      })
      
    return JSONResponse(content=jsonable_encoder(response_documents), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)

#-----------------------------------------------------------------------------------------------

async def send_driver_documents(company_code: str, driver_number: str, doc_id: str):
  try:
    base_path = os.path.join(docs_path, 'conductores', company_code, driver_number)

    if not os.path.isdir(base_path):
      return JSONResponse(content={"message": "Directorio del conductor no encontrado."}, status_code=404)

    base_id = doc_id.lower().replace(".pdf", "")

    folios = [
        os.path.join(base_path, f) for f in sorted(os.listdir(base_path))
        if f.lower().startswith(base_id) and f.lower().endswith(".pdf")
    ]

    if not folios:
      return JSONResponse(content={"message": "No hay documentos disponibles para enviar."}, status_code=404)
    
    if len(folios) == 1:
      return FileResponse(
        path=folios[0],
        filename=f"{doc_id}",
        media_type='application/pdf'
      )
    
    merged_pdf_path = merge_pdfs(folios)
    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, merged_pdf_path)

    return FileResponse(
      path=merged_pdf_path,
      filename=f"{base_id}_unido.pdf",
      media_type='application/pdf',
      background=background_tasks
    )

  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
