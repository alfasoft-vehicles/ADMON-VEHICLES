from decimal import Decimal
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
from models.condullamadas import Condullamadas
from models.movienca import Movienca
from models.cxctiposrecargos import CXCTiposRecargos
from models.permisosusuario import PermisosUsuario
from schemas.wallet import newSurcharge, Revenue, newRentReceipt
from sqlalchemy import func
from utils.panapass import get_txt_file, search_value_in_txt
from utils.verify_values import verify_value
from datetime import datetime, timedelta
import pytz
import os
from dotenv import load_dotenv

load_dotenv()

upload_directory = os.getenv('DIRECTORY_IMG')
route_api = os.getenv('ROUTE_API')


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
      Vehiculos.CUO_DIARIA, Vehiculos.ESTADO, Vehiculos.LINEA, Vehiculos.MODELO, Vehiculos.PROPI_IDEN, Vehiculos.CONDUCTOR,
      Vehiculos.CON_CUPO, Vehiculos.FEC_ESTADO, Vehiculos.EMPRESA, Vehiculos.KILOMETRAJ, Vehiculos.PANAPASSNU,
      Vehiculos.FORMAPAGO, Conductores.NOMBRE.label('NOMBRE_CONDUCTOR'), Conductores.CEDULA, Conductores.TELEFONO, 
      Conductores.DIRECCION, Conductores.NROENTREGA, Conductores.NROENTPAGO, Conductores.FEC_INICIO)\
    .join(Marcas, Vehiculos.MARCA == Marcas.CODIGO)\
    .join(Centrales, (Vehiculos.CENTRAL == Centrales.CODIGO) & (Centrales.EMPRESA == company_code))\
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

    driver_photo_url = ''
    if information.CONDUCTOR and upload_directory and route_api:
      driver_dir = os.path.join(upload_directory, "conductores", company_code, information.CONDUCTOR)
      if os.path.exists(driver_dir):
        pictures = [f for f in os.listdir(driver_dir) if f.startswith(f"{information.CONDUCTOR}_foto")]
        if pictures:
          picture_filename = pictures[-1]
          driver_photo_url = f"{route_api}uploads/conductores/{company_code}/{information.CONDUCTOR}/{picture_filename}"

    response = {
      'driver_code': information.CONDUCTOR,
      'driver_id_card': information.CEDULA,
      'driver_name': information.NOMBRE_CONDUCTOR,
      'driver_phone': information.TELEFONO,
      'start_date': information.FEC_INICIO,
      'driver_address': information.DIRECCION,
      'driver_photo': driver_photo_url,
      'central': information.CENTRAL,
      'owner': f"{information.PROPI_IDEN} - {information.NOMBRE_PROPI}",
      'license_plate': information.PLACA,
      'vehicle_state': information.NOMBRE_ESTADO,
      'accounts': {
        'total_accounts': int(information.NROENTREGA or 0),
        'delivered_accounts': int(information.NROENTPAGO or 0),
        'pending_accounts': int((information.NROENTREGA or 0) - (information.NROENTPAGO or 0))
      },
      'panapass_number': information.PANAPASSNU,
      'panapass_balance': panapass_value,
      'mileage': information.KILOMETRAJ,
      'vehicle': f"{information.MARCA} {information.LINEA} - {information.MODELO}",
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
      ).order_by(Cartera.FECHA.asc()).all()
    
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

# -----------------------------------------------------------------------------------------------

async def wallet_messages(company_code: str, vehicle_number: str):
  db = session()
  try:
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    current_date = now_in_panama.date()

    messages = db.query(Condullamadas.DETALLE).distinct().filter(
      Condullamadas.EMPRESA == company_code,
      Condullamadas.UNIDAD == vehicle_number,
      Condullamadas.DESDE <= current_date,
      Condullamadas.HASTA >= current_date
    ).all()

    response = {
      "messages": [message.DETALLE for message in messages]
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def wallet_notifications(company_code: str, vehicle_number: str):
  db = session()
  try:
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    current_date = now_in_panama.date()

    maintenance = db.query(Movienca.FECHA).filter(
      Movienca.EMPRESA == company_code,
      Movienca.UNIDAD == vehicle_number,
      Movienca.TIPO == '022',
      Movienca.MANTENIMIE == '1',
    ).order_by(Movienca.FECHA.desc()).first()

    maintenance_message = None

    if maintenance and maintenance.FECHA:
      next_maintenance_date = maintenance.FECHA + timedelta(days=30) 
      day_name = next_maintenance_date.strftime('%A').upper()
      next_maintenance = f"{day_name} {next_maintenance_date.strftime('%d/%m/%Y')}"

      maintenance_message = f"Próximo mantenimiento {next_maintenance}, le faltan {(next_maintenance_date - current_date).days} días"

    response = {
      "maintenance_message": maintenance_message
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def create_surcharge(data: newSurcharge):
  db = session()
  try:
    results = []

    id_surcharges = [surcharge.id for surcharge in data.surcharges_list]

    surcharges_types = db.query(CXCTiposRecargos).filter(
      CXCTiposRecargos.EMPRESA == data.company_code,
      CXCTiposRecargos.CODIGO.in_(id_surcharges)
    ).all()

    surcharges_types_map = {surcharge.CODIGO: surcharge.NOMBRE for surcharge in surcharges_types}

    driver = db.query(Conductores).filter(
      Conductores.EMPRESA == data.company_code,
      Conductores.CODIGO == data.driver_number
    ).first()

    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)

    vehicle = db.query(Vehiculos).filter(
      Vehiculos.EMPRESA == data.company_code,
      Vehiculos.NUMERO == data.vehicle_number
    ).first()

    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.user).first()
    user = user.CODIGO if user else ""

    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    date = now_in_panama.strftime("%Y-%m-%d")
    text_date = now_in_panama.strftime("%Y%m%d")

    for surcharge in data.surcharges_list:
      value = Decimal(surcharge.value)

      current_entry = db.query(Cartera).filter(
        Cartera.EMPRESA == data.company_code,
        Cartera.CLIENTE == data.driver_number,
        Cartera.UNIDAD == data.vehicle_number,
        Cartera.TIPO == '12',
        Cartera.TIPRECARGO == surcharge.id,
        Cartera.FACTURA == '12-' + data.driver_number
      ).first()

      print(f"Processing surcharge {surcharge.id} for driver {data.driver_number}: current_entry = {current_entry}, value = {value}")

      if current_entry:
        print(f"Updating existing surcharge entry: current balance = {current_entry.SALDO}, adding value = {value}")
        current_entry.SALDO = (current_entry.SALDO or 0) + value

        results.append({
          "id": surcharge.id,
          "action": 'updated',
          "new_balance": current_entry.SALDO
        })
        print(f"Updated surcharge entry: new balance = {current_entry.SALDO}")

      else:
        new_entry = Cartera(
          EMPRESA=data.company_code,
          FACTURA='12-' + data.driver_number,
          TIPO='12',
          # NOMTIPO='',
          TIPRECARGO=surcharge.id,
          NOMTIPRECAR=surcharges_types_map.get(surcharge.id, ''),
          CLIENTE=data.driver_number,
          CEDULA=driver.CEDULA,
          PLACA=vehicle.PLACA,
          UNIDAD=vehicle.NUMERO,
          PROPI_IDEN=vehicle.PROPI_IDEN,
          FEC_ENTREG=date,
          VALOR=value,
          FECHA=date,
          FEC_FACTU=date,
          DOC_FACTU='12-' + data.driver_number,
          # DETALLE='',
          SALDO=value,
          FEC_DOCUM=text_date,
          FEC_CREADO=date,
          USU_CREADO=user
        )
        db.add(new_entry)

        results.append({
          "id": surcharge.id,
          "action": 'added',
          "new_balance": value
        })
    
    db.commit()

    return JSONResponse(content=jsonable_encoder(results), status_code=201)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def surcharges_list(company_code: str, vehicle_number: str, driver_number: str):
  db = session()
  try:
    surcharges = db.query(
      Cartera.TIPRECARGO.label('id'),
      Cartera.NOMTIPRECAR.label('name'),
      func.sum(Cartera.SALDO).label('balance')
    ).filter(
      Cartera.EMPRESA == company_code,
      Cartera.UNIDAD == vehicle_number,
      Cartera.CLIENTE == driver_number,
      Cartera.TIPO == '12',
      Cartera.TIPRECARGO.isnot(None),
      Cartera.TIPRECARGO != '',
      Cartera.SALDO.isnot(None),
      Cartera.SALDO != 0
    ).group_by(
      Cartera.TIPRECARGO,
      Cartera.NOMTIPRECAR
    ).all()

    results = [{
      'id': surcharge.id,
      'name': surcharge.name,
      'balance': surcharge.balance or 0
    } for surcharge in surcharges]

    return JSONResponse(content=jsonable_encoder(results), status_code=200)
  except Exception as e:
    return JSONResponse(content=jsonable_encoder({'error': str(e)}), status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def verify_revenue_data(data: Revenue):
  db = session()
  try:
    driver = db.query(Conductores).filter(
      Conductores.EMPRESA == data.company_code,
      Conductores.CODIGO == data.driver_number
    ).first()

    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)

    vehicle = db.query(Vehiculos).filter(
      Vehiculos.EMPRESA == data.company_code,
      Vehiculos.NUMERO == data.vehicle_number
    ).first()

    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    rent_due = db.query(func.sum(Cartera.SALDO).label('total')).filter(
      Cartera.EMPRESA == data.company_code,
      Cartera.UNIDAD == data.vehicle_number,
      Cartera.CLIENTE == data.driver_number,
      Cartera.TIPO == '10',
      Cartera.SALDO != None,
      Cartera.SALDO != 0
    ).all()

    valid = True
    comments = []

    if not verify_value(data.payment_method):
      valid = False
      comments.append("Debe seleccionar un método de pago.")
    if not verify_value(data.mileage, 0):
      valid = False
      comments.append("El kilometraje debe ser mayor que 0.")
    if not verify_value(data.mileage, vehicle.KILOMETRAJ):
      print(f"Verifying mileage: new mileage = {data.mileage}, current mileage = {vehicle.KILOMETRAJ}")
      valid = False
      comments.append(f"El nuevo kilometraje debe ser mayor que el actual. {vehicle.KILOMETRAJ}")
      print("Tipo de dato de vehicle.KILOMETRAJ:", type(vehicle.KILOMETRAJ))
    if data.daily_rent and not verify_value(data.daily_rent, 0):
      valid = False
      comments.append("El valor de renta diaria debe ser mayor que 0.")
    if data.accidents and not verify_value(data.accidents, 0):
      valid = False
      comments.append("El valor de siniestros debe ser mayor que 0.")
    if data.registration and not verify_value(data.registration, 0):
      valid = False
      comments.append("El valor de inscripción debe ser mayor que 0.")
    if data.savings and not verify_value(data.savings, 0):
      valid = False
      comments.append("El valor de ahorros debe ser mayor que 0.")

    for surcharge in data.surcharges_list or []:
      if not verify_value(surcharge.value, 0):
        valid = False
        comments.append(f"El recargo con id {surcharge.id} debe tener un valor mayor que 0.")

    valid_rent = True
    comments_rent = []

    if data.daily_rent and data.daily_rent > rent_due[0].total:
      valid_rent = False
      comments_rent.append("¿Crear Cuentas de Diario al Conductor (Anticipo de Cuenta)?")

    response = {
      "valid": valid,
      "comments": comments,
      "valid_rent": valid_rent,
      "comments_rent": comments_rent
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

# -----------------------------------------------------------------------------------------------

async def create_rent_receipt(data: newRentReceipt):
  db = session()
  try:
    driver = db.query(Conductores).filter(
      Conductores.EMPRESA == data.company_code,
      Conductores.CODIGO == data.driver_number
    ).first()

    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)

    vehicle = db.query(Vehiculos).filter(
      Vehiculos.EMPRESA == data.company_code,
      Vehiculos.NUMERO == data.vehicle_number
    ).first()

    if not vehicle:
      return JSONResponse(content={"message": "Vehicle not found"}, status_code=404)

    rent_due = db.query(func.coalesce(func.sum(Cartera.SALDO), 0)).filter(
      Cartera.EMPRESA == data.company_code,
      Cartera.UNIDAD == data.vehicle_number,
      Cartera.CLIENTE == data.driver_number,
      Cartera.TIPO == '10',
      Cartera.SALDO != None,
      Cartera.SALDO != 0
    ).scalar()

    rent_due = rent_due if rent_due is not None else 0

    if data.amount <= rent_due:
      return JSONResponse(content={"message": "The amount must be greater than the total rent due."}, status_code=400)

    excess_amount = Decimal(data.amount) - rent_due

    daily_rent = vehicle.CUO_DIARIA or 0

    if daily_rent <= 0:
      return JSONResponse(content={"message": "Daily rent amount is not set for the vehicle."}, status_code=400)

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == data.user).first()
    user = user.CODIGO if user else ""

    last_receipt = db.query(Cartera).filter(
      Cartera.EMPRESA == data.company_code,
      Cartera.UNIDAD == data.vehicle_number,
      Cartera.CLIENTE == data.driver_number,
      Cartera.TIPO == '10'
    ).order_by(Cartera.FECHA.desc()).first()

    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    date = now_in_panama.strftime("%Y-%m-%d")
    text_date = now_in_panama.strftime("%Y%m%d")

    if last_receipt and last_receipt.FECHA:
      last_receipt_date = last_receipt.FECHA
      if isinstance(last_receipt_date, str):
        last_receipt_date = datetime.strptime(last_receipt_date, "%Y-%m-%d").date()
      receipt_date = last_receipt_date + timedelta(days=1)
    else:
      receipt_date = now_in_panama.date()

    receipts = []
    remaining_amount = excess_amount

    while remaining_amount > 0:
      receipt_amount = min(daily_rent, remaining_amount)
      date = receipt_date.strftime("%Y-%m-%d")
      text_date = receipt_date.strftime("%Y%m%d")
      bill = f"{text_date[2:]}-{data.driver_number}"
      new_entry = Cartera(
        EMPRESA=data.company_code,
        FACTURA=bill,
        TIPO='10',
        CLIENTE=data.driver_number,
        CEDULA=driver.CEDULA,
        ZONA=vehicle.PROPI_IDEN,
        PLACA=vehicle.PLACA,
        UNIDAD=vehicle.NUMERO,
        PROPI_IDEN=vehicle.PROPI_IDEN,
        FEC_ENTREG=date,
        VALOR=receipt_amount,
        FECHA=date,
        FEC_FACTU=date,
        DOC_FACTU=bill,
        SALDO=receipt_amount,
        FEC_CUADRE=date,
        FEC_DOC=text_date,
        FEC_DOCUM=text_date,
        FEC_CREADO=now_in_panama.strftime("%Y-%m-%d"),
        USU_CREADO=user
      )
      db.add(new_entry)

      receipts.append({
        "date": date,
        "type": "10 - RtaDiaria",
        "invoice": bill,
        "amount": receipt_amount
      })

      remaining_amount -= receipt_amount
      receipt_date += timedelta(days=1)

    db.commit()

    response = {
      "message": "Rent receipts created successfully",
      "rent_due": rent_due,
      "excess_amount": excess_amount,
      "receipts": receipts
    }

    return JSONResponse(content=jsonable_encoder(response), status_code=201)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()