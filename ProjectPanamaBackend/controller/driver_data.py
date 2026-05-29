from fastapi.responses import JSONResponse
from config.dbconnection import session
from fastapi.encoders import jsonable_encoder
from schemas.driver_data import DriverData, FingerprintData
from models.conductores import Conductores
from models.vehiculos import Vehiculos
from models.propietarios import Propietarios
from models.centrales import Centrales
from models.estados import Estados
from utils.images import decode_image
import os
from dotenv import load_dotenv

load_dotenv()

upload_directory = os.getenv('DIRECTORY_IMG')
route_api = os.getenv('ROUTE_API')
driver_documents_path = os.getenv('DRIVER_DOCS_PATH')
vehicle_documents_path = os.getenv('VEHICLE_DOCS_PATH')

async def upload_signature(data: DriverData):
  db = session()
  try:
    driver = db.query(Conductores).filter(Conductores.EMPRESA == data.company_code, Conductores.UND_NRO == data.vehicle_number).first()
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)
    
    # base_path = os.path.join(upload_directory, "conductores", data.company_code, driver.CODIGO, "firmas")
    base_path = os.path.join(upload_directory, "conductores", data.company_code, driver.CODIGO)
    os.makedirs(base_path, exist_ok=True)

    # existing_signatures = [f for f in os.listdir(base_path) if f.startswith(f"{driver.CODIGO}_firma")]

    # next_index = len(existing_signatures) + 1

    # final_signature_path = os.path.join(base_path, f"{driver.CODIGO}_firma_{next_index}.png")
    final_signature_path = os.path.join(base_path, f"{driver.CODIGO}_firma.png")
    
    # signature_url = f"{route_api}uploads/conductores/{data.company_code}/{driver.CODIGO}/firmas/{driver.CODIGO}_firma_{next_index}.png"
    signature_url = f"{route_api}uploads/conductores/{data.company_code}/{driver.CODIGO}/{driver.CODIGO}_firma.png"

    image_data = decode_image(data.base64)
    
    with open(final_signature_path, "wb") as f:
      f.write(image_data)

    driver.FIRMA = signature_url
    db.commit()

    return JSONResponse(content={"message": "Signature uploaded successfully, "}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def upload_picture(data: DriverData):
  db = session()
  try:
    driver = db.query(Conductores).filter(Conductores.EMPRESA == data.company_code, Conductores.UND_NRO == data.vehicle_number).first()
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)
    
    base_path = os.path.join(upload_directory, "conductores", data.company_code, driver.CODIGO)
    os.makedirs(base_path, exist_ok=True)

    # existing_pictures = [f for f in os.listdir(base_path) if f.startswith(f"{driver.CODIGO}_foto")]
    # next_index = len(existing_pictures) + 1

    # final_picture_path = os.path.join(base_path, f"{driver.CODIGO}_foto_{next_index}.png")
    final_picture_path = os.path.join(base_path, f"{driver.CODIGO}_foto.png")

    # picture_url = f"{route_api}uploads/conductores/{data.company_code}/{driver.CODIGO}/{driver.CODIGO}_foto_{next_index}.png"
    picture_url = f"{route_api}uploads/conductores/{data.company_code}/{driver.CODIGO}/{driver.CODIGO}_foto.png"

    image_data = decode_image(data.base64)

    with open(final_picture_path, "wb") as f:
      f.write(image_data)

    driver.FOTO = picture_url
    db.commit()

    return JSONResponse(content={"message": "Picture uploaded successfully"}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#----------------------------------------------------------------------------------------------

async def upload_vehicle_photo(data: DriverData):
  db = session()
  try:
    vehicle = db.query(Vehiculos).filter(Vehiculos.EMPRESA == data.company_code, Vehiculos.NUMERO == data.vehicle_number).first()
    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    base_path = os.path.join(upload_directory, "vehiculos", data.company_code, vehicle.NUMERO)
    os.makedirs(base_path, exist_ok=True)

    # existing_pictures = [f for f in os.listdir(base_path) if f.startswith(f"{vehicle.NUMERO}_foto")]
    # next_index = len(existing_pictures) + 1

    # final_picture_path = os.path.join(base_path, f"{vehicle.NUMERO}_foto_{next_index}.png")
    final_picture_path = os.path.join(base_path, f"{vehicle.NUMERO}_foto.png")

    # picture_url = f"{route_api}uploads/vehiculos/{data.company_code}/{vehicle.NUMERO}/{vehicle.NUMERO}_foto_{next_index}.png"
    picture_url = f"{route_api}uploads/vehiculos/{data.company_code}/{vehicle.NUMERO}/{vehicle.NUMERO}_foto.png"

    image_data = decode_image(data.base64)

    with open(final_picture_path, "wb") as f:
      f.write(image_data)

    vehicle.FOTO = picture_url
    db.commit()

    return JSONResponse(content={"message": "Picture uploaded successfully"}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def upload_fingerprint(data: FingerprintData):
  db = session()
  try:
    driver = db.query(Conductores).filter(
      Conductores.EMPRESA == data.company_code,
      Conductores.CEDULA == data.cedula
    ).first()
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)

    base_path = os.path.join(upload_directory, "conductores", data.company_code, driver.CODIGO)
    os.makedirs(base_path, exist_ok=True)

    # ======================================================================
    # GUARDADO DOBLE: se guarda la misma imagen en formato PNG y BMP
    # ======================================================================
    final_fingerprint_png = os.path.join(base_path, f"{driver.CODIGO}_huella.png")
    final_fingerprint_bmp = os.path.join(base_path, f"{driver.CODIGO}_huella.bmp")

    fingerprint_url = f"{route_api}uploads/conductores/{data.company_code}/{driver.CODIGO}/{driver.CODIGO}_huella.png"

    image_data = decode_image(data.base64)

    # Guardar copia en PNG
    with open(final_fingerprint_png, "wb") as f:
      f.write(image_data)

    # Guardar copia en BMP
    with open(final_fingerprint_bmp, "wb") as f:
      f.write(image_data)

    # TODO: Descomentar cuando exista el campo HUELLA en la tabla CONDUCTORES
    # driver.HUELLA = fingerprint_url
    # db.commit()

    return JSONResponse(content={"message": "Fingerprint uploaded successfully"}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def vehicle_driver_data(company_code: str, vehicle_number: str):
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
    
    if not vehicle:
       return JSONResponse(content={"message": "No se encontraron vehículos para la empresa."}, status_code=404)
    
    signature_path = ''
    has_signature = 0

    picture_path = ''
    has_picture = 0
    
    vehicle_photo_path = ''
    has_vehicle_photo = 0

    fingerprint_path = ''
    has_fingerprint = 0

    signature_dir = os.path.join(upload_directory, "conductores", company_code, vehicle.driver_code, "firmas")
    if os.path.exists(signature_dir):
      signatures = [f for f in os.listdir(signature_dir) if f.startswith(f"{vehicle.driver_code}_firma")]
      if signatures:
        signature_path = os.path.join(signature_dir, signatures[-1])
        has_signature = 1

    driver_dir = os.path.join(upload_directory, "conductores", company_code, vehicle.driver_code)
    if os.path.exists(driver_dir):
      pictures = [f for f in os.listdir(driver_dir) if f.startswith(f"{vehicle.driver_code}_foto")]
      if pictures:
        picture_path = os.path.join(driver_dir, pictures[-1])
        has_picture = 1

      fingerprints = [f for f in os.listdir(driver_dir) if f.startswith(f"{vehicle.driver_code}_huella")]
      if fingerprints:
        fingerprint_path = os.path.join(driver_dir, fingerprints[-1])
        has_fingerprint = 1

    vehicle_dir = os.path.join(upload_directory, "vehiculos", company_code, vehicle.NUMERO)
    if os.path.exists(vehicle_dir):
      vehicle_photos = [f for f in os.listdir(vehicle_dir) if f.startswith(f"{vehicle.NUMERO}_foto")]
      if vehicle_photos:
        vehicle_photo_path = os.path.join(vehicle_dir, vehicle_photos[-1])
        has_vehicle_photo = 1

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
      'has_signature': has_signature,
      'has_picture': has_picture,
      'has_vehicle_photo': has_vehicle_photo,
      'has_fingerprint': has_fingerprint,
    }

    return JSONResponse(content=jsonable_encoder(info), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()