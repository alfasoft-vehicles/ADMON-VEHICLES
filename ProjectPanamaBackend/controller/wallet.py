from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from config.dbconnection import session
from models.cartera import Cartera
from sqlalchemy import func

async def vehicle_wallet_info(company_code: str, vehicle_number: str, driver_number: str):
  db = session()
  try:
    debts = (db.query(Cartera.TIPO, func.sum(Cartera.SALDO).label('total_saldo')).filter(
                Cartera.EMPRESA == company_code,
                Cartera.UNIDAD == vehicle_number,
                Cartera.CLIENTE == driver_number,
                Cartera.TIPO.in_(['01', '02', '10', '11', '12'])
              ).group_by(Cartera.TIPO).all())
    
    debt_map = {debt.TIPO: debt.total_saldo or 0 for debt in debts}

    registration = debt_map.get('01', 0)
    savings = debt_map.get('02', 0)

    daily_rent = debt_map.get('10', 0)
    accidents = debt_map.get('11', 0)
    other_debts = debt_map.get('12', 0)

    response = {
      "funds": {
        "registration": registration,
        "savings": savings,
      },
      "debts": {
        "daily_rent": daily_rent,
        "accidents": accidents,
        "other_debts": other_debts,
      }
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()