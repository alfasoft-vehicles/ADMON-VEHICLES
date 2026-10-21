from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.mecanicos import Mecanicos
from fastapi.encoders import jsonable_encoder

async def mechanics(company_code: str):
  db = session()
  try:
    mechanics_info = db.query(Mecanicos.CODIGO, Mecanicos.NOMBRE).filter(Mecanicos.EMPRESA == company_code, Mecanicos.CODIGO != '', Mecanicos.CODIGO != None).all()

    if not mechanics_info:
      return JSONResponse(content={"message": "No hay mecánicos"}, status_code=404)

    mechanics_list = [{'code': mechanic.CODIGO, 'name': mechanic.NOMBRE} for mechanic in mechanics_info]
    return JSONResponse(content=jsonable_encoder(mechanics_list), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()