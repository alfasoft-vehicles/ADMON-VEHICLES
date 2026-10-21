from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from config.dbconnection import session
from models.cxctiposrecargos import CXCTiposRecargos

async def surcharges_types(company_code: str):
  db = session()
  try:
    surcharges = db.query(CXCTiposRecargos.CODIGO, CXCTiposRecargos.NOMBRE).filter(CXCTiposRecargos.EMPRESA == company_code).all()

    surcharges = [{'code': surcharge.CODIGO, 'name': surcharge.NOMBRE} for surcharge in surcharges]

    return JSONResponse(content=jsonable_encoder(surcharges))
  except Exception as e:
    return JSONResponse(content=jsonable_encoder({'error': str(e)}))
  finally:
    db.close()