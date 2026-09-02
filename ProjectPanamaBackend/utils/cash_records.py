from models.cajarecaudos import CajaRecaudos
from models.formaspago import FormasPago
from datetime import datetime
import pytz



def create_cash_record(db, data, vehicle, driver, old_mileage, total, entry, receipt_number, user):
  panama_timezone = pytz.timezone('America/Panama')
  now_in_panama = datetime.now(panama_timezone)
  date = now_in_panama.strftime("%Y-%m-%d")
  time = now_in_panama.strftime("%H:%M:%S")
  complete_date = now_in_panama.strftime("%Y-%m-%d %H:%M:%S")
  text_date = now_in_panama.strftime("%Y%m%d")

  payment_methods = db.query(FormasPago).filter(FormasPago.EMPRESA == data.company_code).all()
  payment_methods_map = {method.CODIGO: method.NOMBRE for method in payment_methods}

  cash_record = CajaRecaudos(
    EMPRESA=data.company_code,
    RECIBO=receipt_number,
    FEC_RECIBO=date,
    HOR_RECIBO=time,
    PLACA=vehicle.PLACA,
    NUMERO=vehicle.NUMERO,
    KILO_ANTES=old_mileage,
    KILOMETRAJ=data.mileage,
    CONDUCTOR=driver.CODIGO,
    CEDULA=driver.CEDULA,
    NIT=driver.NIT,
    PROPI_IDEN=vehicle.PROPI_IDEN,
    CTA_GASTO=getattr(entry, 'TIPRECARGO', '') or '',
    ZONA=vehicle.PROPI_IDEN,
    FORMAPAGO=data.payment_method,
    NOMFORMAPA=payment_methods_map.get(data.payment_method, ""),
    TOTAL=total,
    TIPO=entry.TIPO,
    FACTURA=entry.FACTURA,
    USUARIO=user,
    FEC_DOCUM=text_date,
    FEC_CREADO=complete_date
  )

  db.add(cash_record)