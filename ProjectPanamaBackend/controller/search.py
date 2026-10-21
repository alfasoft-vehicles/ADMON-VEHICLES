from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_, and_
from config.dbconnection import session
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.estados import Estados
from models.propietarios import Propietarios
from utils.search import contains, digits_only
import re

MIN_SEARCH_LENGTH = 3

def safe_int(value) -> int:
  try:
    if value is None:
      return 0
    return int(float(value))
  except (ValueError, TypeError):
    return 0

def safe_float(value) -> float:
  try:
    if value is None:
      return 0.0
    return float(value)
  except (ValueError, TypeError):
    return 0.0

async def search_basic_info(company_code: str, query: str):
  db = session()
  try:
    query = (query or '').strip()

    if len(query) < MIN_SEARCH_LENGTH:
      return JSONResponse(
        content={"message": f"La búsqueda debe tener al menos {MIN_SEARCH_LENGTH} caracteres"},
        status_code=400
      )

    conditions = [
      contains(Vehiculos.PLACA, query),
      contains(Vehiculos.NUMERO, query),
      contains(Vehiculos.NRO_CUPO, query),
      contains(Conductores.CODIGO, query),
      contains(Conductores.CEDULA, query),
      contains(Conductores.UND_NRO, query),
      contains(Conductores.TELEFONO, query),
      contains(Conductores.CELULAR, query),
      contains(Propietarios.NOMBRE, query),
    ]

    words = query.split()
    if words:
      conditions.append(and_(*[contains(Conductores.NOMBRE, word) for word in words]))

    if re.fullmatch(r'[\d\s\-+()]+', query):
      digits = re.sub(r'\D', '', query)
      if len(digits) >= MIN_SEARCH_LENGTH:
        conditions.append(digits_only(Conductores.TELEFONO).contains(digits, autoescape=True))
        conditions.append(digits_only(Conductores.CELULAR).contains(digits, autoescape=True))

    results = db.query(
      Vehiculos.NUMERO, Vehiculos.PLACA, Estados.NOMBRE.label('ESTADO'),
      Conductores.CODIGO.label('CODIGO_CONDUCTOR'),
      Conductores.NOMBRE.label('NOMBRE_CONDUCTOR'), Conductores.CEDULA,
      Conductores.TELEFONO, Conductores.CELULAR,
      Vehiculos.NRO_CUPO, Vehiculos.CUO_DIARIA,
      Vehiculos.NROENTREGA, Conductores.NROENTPAGO,
      Propietarios.NOMBRE.label('NOMBRE_PROPIETARIO')
    ).join(
      Conductores, and_(Vehiculos.CONDUCTOR == Conductores.CODIGO, Conductores.EMPRESA == company_code)
    ).outerjoin(
      Estados, and_(Vehiculos.ESTADO == Estados.CODIGO, Estados.EMPRESA == company_code)
    ).outerjoin(
      Propietarios, and_(Vehiculos.PROPI_IDEN == Propietarios.CODIGO, Propietarios.EMPRESA == company_code)
    ).filter(
      Vehiculos.EMPRESA == company_code,
      or_(*conditions)
    ).order_by(Vehiculos.NUMERO).all()

    response = []
    for result in results:
      total_acc = safe_int(result.NROENTREGA)
      paid_acc = safe_int(result.NROENTPAGO)
      pending_acc = max(0, total_acc - paid_acc)
      owner_name = (result.NOMBRE_PROPIETARIO or '').strip()

      response.append({
        "vehicle_number": (result.NUMERO or '').strip(),
        "vehicle_plate": (result.PLACA or '').strip(),
        "vehicle_state": (result.ESTADO or 'Activo').strip(),
        "driver_code": (result.CODIGO_CONDUCTOR or '').strip(),
        "driver_name": (result.NOMBRE_CONDUCTOR or '').strip(),
        "driver_id_card": (result.CEDULA or '').strip(),
        "driver_phone": (result.TELEFONO or '').strip(),
        "driver_cellphone": (result.CELULAR or '').strip(),
        "cupo_number": (result.NRO_CUPO or '').strip(),
        "owner_name": owner_name,
        "company_name": owner_name,
        "daily_fee": safe_float(result.CUO_DIARIA),
        "total_accounts": total_acc,
        "paid_accounts": paid_acc,
        "pending_accounts": pending_acc
      })

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()
