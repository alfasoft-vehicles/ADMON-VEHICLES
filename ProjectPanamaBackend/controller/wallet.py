from anyio import current_time
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from config.dbconnection import session
from models.cartera import Cartera
from models.conductores import Conductores
from models.vehiculos import Vehiculos
from models.propietarios import Propietarios
from models.marcas import Marcas
from models.estados import Estados
from models.centrales import Centrales
from models.parametros import Parametros
from sqlalchemy import func
from utils.panapass import get_txt_file, search_value_in_txt
from datetime import datetime
import pytz

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

#-----------------------------------------------------------------------------------------------

async def vehicle_and_driver_info(company_code: str, vehicle_number: str):
  db = session()
  try:
    information = db.query(
      Marcas.NOMBRE.label('MARCA'), Centrales.NOMBRE.label('CENTRAL'), Estados.NOMBRE.label('NOMBRE_ESTADO'), 
      Propietarios.NOMBRE.label('NOMBRE_PROPI'), Vehiculos.PLACA, Vehiculos.NRO_CUPO, Vehiculos.NROENTREGA, 
      Vehiculos.CUO_DIARIA, Vehiculos.ESTADO, Vehiculos.MODELO, Vehiculos.PROPI_IDEN, Vehiculos.CONDUCTOR,
      Vehiculos.CON_CUPO, Vehiculos.FEC_ESTADO, Vehiculos.EMPRESA, Vehiculos.KILOMETRAJ, Vehiculos.PANAPASSNU,
      Vehiculos.FORMAPAGO, Conductores.NOMBRE.label('NOMBRE_CONDUCTOR'), Conductores.CEDULA, Conductores.TELEFONO, 
      Conductores.DIRECCION, Conductores.NROENTREGA, Conductores.NROENTPAGO, Conductores.NROENTSDO, Conductores.FEC_INICIO)\
    .join(Marcas, Vehiculos.MARCA == Marcas.CODIGO)\
    .join(Centrales, Vehiculos.CENTRAL == Centrales.CODIGO)\
    .join(Estados, Vehiculos.ESTADO == Estados.CODIGO)\
    .join(Propietarios, Vehiculos.PROPI_IDEN == Propietarios.CODIGO)\
    .outerjoin(Conductores, Vehiculos.CONDUCTOR == Conductores.CODIGO
    ).filter(
      Vehiculos.EMPRESA == company_code,
      Vehiculos.NUMERO == vehicle_number
    ).first()

    if not information:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)
    
    txt_file_path = get_txt_file(company_code)
    if txt_file_path:
      panapass_value = search_value_in_txt('Unidad', vehicle_number, 'Saldo Cuenta PanaPass', txt_file_path)
    else:
      panapass_value = ''

    payment_form = 'Diario' if information.FORMAPAGO == '1' else 'Semanal' if information.FORMAPAGO == '2' else 'Quincenal' if information.FORMAPAGO == '3' else 'Mensual' if information.FORMAPAGO == '4' else ''
    
    response = {
      'driver_code': information.CONDUCTOR,
      'driver_id_card': information.CEDULA,
      'driver_name': information.NOMBRE_CONDUCTOR,
      'driver_phone': information.TELEFONO,
      'start_date': information.FEC_INICIO,
      'driver_address': information.DIRECCION,
      'central': information.CENTRAL,
      'owner': f"{information.PROPI_IDEN} - {information.NOMBRE_PROPI}",
      'license_plate': information.PLACA,
      'vehicle_state': information.NOMBRE_ESTADO,
      'accounts': {
        'total_accounts': information.NROENTREGA,
        'delivered_accounts': information.NROENTPAGO,
        'pending_accounts': information.NROENTSDO
      },
      'panapass_number': information.PANAPASSNU,
      'panapass_balance': panapass_value,
      'mileage': information.KILOMETRAJ,
      'vehicle': f"{information.MARCA} - {information.MODELO}",
      'payment_form': payment_form
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def receipts_list(company_code: str, vehicle_number: str, driver_number: str):
  db = session()
  try:
    receipts = db.query(
        Cartera.FECHA,
        Cartera.TIPO,
        Cartera.FACTURA,
        Cartera.SALDO
      ).filter( Cartera.EMPRESA == company_code, Cartera.UNIDAD == vehicle_number,
                Cartera.CLIENTE == driver_number, Cartera.TIPO == '10',  Cartera.SALDO != None,
                Cartera.SALDO != 0
      ).order_by(Cartera.FECHA.desc()).all()
    
    if not receipts:
      return JSONResponse(content={
        "total_balance": 0,
        "receipts": []
      }, status_code=200)
    
    list = []
    total_balance = 0

    for receipt in receipts:
      balance = receipt.SALDO or 0
      total_balance += balance
      
      list.append({
        "date": receipt.FECHA,
        "type": "10 - RtaDiaria",
        "invoice": receipt.FACTURA,
        "amount": balance
      })

    response = {
      "total_balance": total_balance,
      "receipts": list
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def closing_date(company_code: str):
  db = session()
  try:
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    current_time = now_in_panama.strftime("%H:%M:%S")

    date = db.query(Parametros.FEC_CIERRE).filter(Parametros.EMPRESA == company_code).first()

    if not date or not date.FEC_CIERRE:
      return JSONResponse(content={"message": "No closing date found"}, status_code=404)

    response = {
      "date": date.FEC_CIERRE,
      "time": current_time
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()