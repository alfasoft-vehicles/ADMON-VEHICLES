from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_, and_
from config.dbconnection import session
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.estados import Estados
from utils.search import contains, digits_only
import re

MIN_SEARCH_LENGTH = 3

async def search_basic_info(company_code: str, query: str):
  db = session()
  try:
    query = (query or '').strip()

    if len(query) < MIN_SEARCH_LENGTH:
      return JSONResponse(content={"message": f"The search must have at least {MIN_SEARCH_LENGTH} characters"}, status_code=400)

    conditions = [
      contains(Vehiculos.PLACA, query),
      contains(Vehiculos.NUMERO, query),
      contains(Conductores.CEDULA, query),
      contains(Conductores.UND_NRO, query),
      contains(Conductores.TELEFONO, query),
      contains(Conductores.CELULAR, query),
      and_(*[contains(Conductores.NOMBRE, word) for word in query.split()])
    ]

    if re.fullmatch(r'[\d\s\-+()]+', query):
      digits = re.sub(r'\D', '', query)
      if len(digits) >= MIN_SEARCH_LENGTH:
        conditions.append(digits_only(Conductores.TELEFONO).contains(digits, autoescape=True))
        conditions.append(digits_only(Conductores.CELULAR).contains(digits, autoescape=True))

    results = db.query(
      Vehiculos.NUMERO, Vehiculos.PLACA, Estados.NOMBRE.label('ESTADO'),
      Conductores.NOMBRE.label('NOMBRE_CONDUCTOR'), Conductores.CEDULA,
      Conductores.TELEFONO, Conductores.CELULAR
    ).join(
      Conductores, and_(Vehiculos.CONDUCTOR == Conductores.CODIGO, Conductores.EMPRESA == company_code)
    ).outerjoin(
      Estados, and_(Vehiculos.ESTADO == Estados.CODIGO, Estados.EMPRESA == company_code)
    ).filter(
      Vehiculos.EMPRESA == company_code,
      or_(*conditions)
    ).order_by(Vehiculos.NUMERO).all()

    response = [{
      "vehicle_number": result.NUMERO,
      "vehicle_plate": result.PLACA,
      "vehicle_state": result.ESTADO,
      "driver_name": result.NOMBRE_CONDUCTOR,
      "driver_id_card": result.CEDULA,
      "driver_phone": result.TELEFONO,
      "driver_cellphone": result.CELULAR
    } for result in results]

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()
