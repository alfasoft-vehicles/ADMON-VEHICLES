from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from models.infoempresas import InfoEmpresas
from models.propietarios import Propietarios
from config.dbconnection import session
from sqlalchemy import func, case, or_, and_
from models.vehiculos import Vehiculos
from models.cajarecaudos import CajaRecaudos
from models.reclamoscolisiones import ReclamosColisiones
from models.movimien import Movimien
from models.chapisteriamanoobra import ChapisteriaManoObra
from models.estados import Estados
from schemas.reports import PandGStatusReport
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pytz
import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
import jinja2
from utils.pdf import html2pdf
import tempfile

templateJinja = Jinja2Templates(directory="templates")

pandgstatus_router = APIRouter()

@pandgstatus_router.post("/pandgstatus/{company_code}/", tags=["Reports"])
async def pandgstatus_report(company_code: str, data: PandGStatusReport):
  db = session()
  try:
    if data.primeraFecha > data.ultimaFecha:
      return JSONResponse(status_code=400, content={"message": "La primera fecha no puede ser mayor que la última fecha"})
    
    owners_codes = data.empresa

    # Diccionario para mapear códigos de propietario a nombres
    owners_info = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(
      Propietarios.CODIGO.in_(owners_codes), 
      Propietarios.EMPRESA == company_code
    ).all()

    owners_dict = {owner.CODIGO: owner.NOMBRE for owner in owners_info}
    
    if not owners_dict:
      return JSONResponse(status_code=404, content={"message": "No se encontraron propietarios para las empresas proporcionadas"})
    
    # Consulta de estados
    status_list = db.query(
      Estados.CODIGO,
      Estados.NOMBRE
    ).filter(
      Estados.EMPRESA == company_code
    ).all()
    
    # Crear diccionario de estados (código -> nombre)
    estados_dict = {estado.CODIGO: estado.NOMBRE for estado in status_list}
    
    # Identificar todas las unidades que tuvieron movimientos con los propietarios consultados
    incomes = db.query(
      CajaRecaudos.PROPI_IDEN,
      CajaRecaudos.NUMERO,
      func.coalesce(func.sum(CajaRecaudos.DEU_RENTA), 0).label('total_renta'),
      func.coalesce(func.sum(CajaRecaudos.FON_INSCRI), 0).label('total_gastos'),
      func.coalesce(func.sum(CajaRecaudos.DEU_SINIES), 0).label('total_recaudo')
    ).filter(
      CajaRecaudos.EMPRESA == company_code,
      CajaRecaudos.FEC_RECIBO >= data.primeraFecha,
      CajaRecaudos.FEC_RECIBO <= data.ultimaFecha,
      CajaRecaudos.PROPI_IDEN.in_(owners_codes)
    ).group_by(CajaRecaudos.PROPI_IDEN, CajaRecaudos.NUMERO).all()

    # Consulta de seguros 
    insurances = db.query(
      ReclamosColisiones.PROPI_IDEN,
      ReclamosColisiones.NUMERO,
      func.coalesce(func.sum(ReclamosColisiones.BCO_VALOR), 0).label('total_insurance'),
      func.sum(case((ReclamosColisiones.CERRADO == "F", 1), else_=0)).label('pending')
    ).filter(
      ReclamosColisiones.EMPRESA == company_code,
      or_(
        and_(
          ReclamosColisiones.BCO_FECHA >= data.primeraFecha,
          ReclamosColisiones.BCO_FECHA <= data.ultimaFecha
        ),
        ReclamosColisiones.CERRADO == 'F'
      ),
      ReclamosColisiones.PROPI_IDEN.in_(owners_codes)
    ).group_by(ReclamosColisiones.PROPI_IDEN, ReclamosColisiones.NUMERO).all()

    # Consulta de mano de obra
    labor = db.query(
      ChapisteriaManoObra.PROPI_IDEN,
      ChapisteriaManoObra.NUMERO,
      func.coalesce(func.sum(ChapisteriaManoObra.VLR_MANOBR), 0).label('total_labor')
    ).filter(
      ChapisteriaManoObra.EMPRESA == company_code,
      ChapisteriaManoObra.FECHA >= data.primeraFecha,
      ChapisteriaManoObra.FECHA <= data.ultimaFecha,
      ChapisteriaManoObra.PROPI_IDEN.in_(owners_codes)
    ).group_by(ChapisteriaManoObra.PROPI_IDEN, ChapisteriaManoObra.NUMERO).all()

    # Consulta de movimientos
    movements = db.query(
      Movimien.PROPI_IDEN,
      Movimien.UNIDAD,
      func.coalesce(func.sum(Movimien.VALOR), 0).label('total_movement'),
      func.coalesce(func.sum(case((Movimien.TIPO == '024', Movimien.TOTAL), else_=0)), 0).label('tipo_024'),
      func.coalesce(func.sum(case((Movimien.TIPO == '027', Movimien.TOTAL), else_=0)), 0).label('tipo_027'),
      func.coalesce(func.sum(case((Movimien.TIPO == '026', Movimien.TOTAL), else_=0)), 0).label('tipo_026'),
      func.coalesce(func.sum(case((Movimien.TIPO == '022', Movimien.TOTAL), else_=0)), 0).label('tipo_022'),
      func.coalesce(func.sum(case((Movimien.TIPO == '016', Movimien.TOTAL), else_=0)), 0).label('tipo_016')
    ).filter(
      Movimien.EMPRESA == company_code,
      Movimien.FECHA >= data.primeraFecha,
      Movimien.FECHA <= data.ultimaFecha,
      Movimien.PROPI_IDEN.in_(owners_codes),
      Movimien.TIPO.in_(['024', '027', '026', '022', '016'])
    ).group_by(Movimien.PROPI_IDEN, Movimien.UNIDAD).all()

    # Recopilar todas las unidades únicas que aparecen en los movimientos históricos
    all_units_from_movements = set()
    
    for income in incomes:
      all_units_from_movements.add(income.NUMERO)
    
    for insurance in insurances:
      all_units_from_movements.add(insurance.NUMERO)
    
    for lab in labor:
      all_units_from_movements.add(lab.NUMERO)
    
    for mov in movements:
      all_units_from_movements.add(mov.UNIDAD)
    
    # Buscar información de todas estas unidades
    vehicles = db.query(
      Vehiculos.NUMERO,
      Vehiculos.MODELO,
      Vehiculos.ESTADO,
      Vehiculos.VLR_COMPRA,
      Vehiculos.FEC_CREADO
    ).filter(
      Vehiculos.EMPRESA == company_code,
      Vehiculos.NUMERO.in_(list(all_units_from_movements))
    ).all()
    
    # Crear diccionario de vehículos por unidad
    vehicles_dict = {}
    for vehicle in vehicles:
      unidad = vehicle.NUMERO
      estado_nombre = estados_dict.get(vehicle.ESTADO, "") if vehicle.ESTADO else ""
      vehicles_dict[unidad] = {
        "modelo": vehicle.MODELO or "",
        "estado": estado_nombre.title(),
        "estado_codigo": vehicle.ESTADO or "",
        "valor_compra": vehicle.VLR_COMPRA or "",
        "fecha_creacion": vehicle.FEC_CREADO if vehicle.FEC_CREADO else ""
      }

    # Consolidar la información por unidad
    consolidated_by_owner_unit = {}
    
    # Procesar ingresos
    for income in incomes:
      key = (income.PROPI_IDEN, income.NUMERO)
      #unidad = income.NUMERO
      total_income = income.total_renta + income.total_gastos + income.total_recaudo
      # Usar la unidad como clave
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(income.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": income.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(income.PROPI_IDEN, ""),
          "unidad": income.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["incomes"] += total_income
    
    # Procesar seguros
    for insurance in insurances:
      key = (insurance.PROPI_IDEN, insurance.NUMERO)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(insurance.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": insurance.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(insurance.PROPI_IDEN, ""),
          "unidad": insurance.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["insurances"] += insurance.total_insurance
      if insurance.pending and insurance.pending > 0:
        consolidated_by_owner_unit[key]["pending_insurance"] = "Pen"

    # Procesar mano de obra
    for lab in labor:
      key = (lab.PROPI_IDEN, lab.NUMERO)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(lab.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": lab.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(lab.PROPI_IDEN, ""),
          "unidad": lab.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["total_labor"] += lab.total_labor
    
    # Procesar movimientos
    for mov in movements:
      key = (mov.PROPI_IDEN, mov.UNIDAD)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(mov.UNIDAD, {})
        consolidated_by_owner_unit[key] = {
          "propietario": mov.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(mov.PROPI_IDEN, ""),
          "unidad": mov.UNIDAD,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      # consolidated_by_unit[unidad]["total_movement"] += mov.total_movement
      consolidated_by_owner_unit[key]["gasto_caja"] += mov.tipo_024
      consolidated_by_owner_unit[key]["generales"] += mov.tipo_027
      consolidated_by_owner_unit[key]["026"] += mov.tipo_026
      consolidated_by_owner_unit[key]["022"] += mov.tipo_022
      consolidated_by_owner_unit[key]["016"] += mov.tipo_016
      consolidated_by_owner_unit[key]["almacen"] = consolidated_by_owner_unit[key]["022"] - consolidated_by_owner_unit[key]["016"]
      consolidated_by_owner_unit[key]["chapisteria"] = consolidated_by_owner_unit[key]["026"] + consolidated_by_owner_unit[key]["total_labor"]

    for key, item in consolidated_by_owner_unit.items():
      item["estado_pyg"] = item["incomes"] - item["gasto_caja"] - item["generales"] - item["chapisteria"] - item["almacen"]
    
    # Filtrar unidades sin movimientos
    filtered_units = {}
    for key, item in consolidated_by_owner_unit.items():
      numeric_fields = [
        "incomes", "insurances", "total_labor", "gasto_caja",
        "generales", "otro_gasto", "026", "022", "016", "almacen", "chapisteria"
      ]

      has_movements = any(item.get(field, 0) != 0 for field in numeric_fields)
      has_pending_insurance = item.get("pending_insurance") != ""

      if has_movements or has_pending_insurance:
        filtered_units[key] = item
    
    # Agrupar por propietario
    consolidated_by_owner = {}

    for unidad, item in filtered_units.items():
      owner_code = item["propietario"]
      if owner_code not in consolidated_by_owner:
        consolidated_by_owner[owner_code] = {
          "propietario": owner_code,
          "propietario_nombre": item["propietario_nombre"],
          "unidades": [],
          "totales": {
            "cantidad_unidades": 0,
            "incomes": 0,
            "insurances": 0,
            "total_labor": 0,
            "gasto_caja": 0,
            "generales": 0,
            "otro_gasto": 0,
            "026": 0,
            "022": 0,
            "016": 0,
            "almacen": 0,
            "chapisteria": 0,
            "estado_pyg": 0
          }
        }
      consolidated_by_owner[owner_code]["unidades"].append(item)

      # Sumar totales por propietario
      consolidated_by_owner[owner_code]["totales"]["cantidad_unidades"] += 1
      consolidated_by_owner[owner_code]["totales"]["incomes"] += item["incomes"]
      consolidated_by_owner[owner_code]["totales"]["insurances"] += item["insurances"]
      consolidated_by_owner[owner_code]["totales"]["total_labor"] += item["total_labor"]
      consolidated_by_owner[owner_code]["totales"]["gasto_caja"] += item["gasto_caja"]
      consolidated_by_owner[owner_code]["totales"]["generales"] += item["generales"]
      consolidated_by_owner[owner_code]["totales"]["otro_gasto"] += item["otro_gasto"]
      consolidated_by_owner[owner_code]["totales"]["026"] += item["026"]
      consolidated_by_owner[owner_code]["totales"]["022"] += item["022"]
      consolidated_by_owner[owner_code]["totales"]["016"] += item["016"]
      consolidated_by_owner[owner_code]["totales"]["almacen"] += item["almacen"]
      consolidated_by_owner[owner_code]["totales"]["chapisteria"] += item["chapisteria"]
      consolidated_by_owner[owner_code]["totales"]["estado_pyg"] += item["estado_pyg"]

    # Calcular totales generales
    totales_generales = {
      "cantidad_unidades": 0,
      "incomes": 0,
      "insurances": 0,
      "total_labor": 0,
      "gasto_caja": 0,
      "generales": 0,
      "otro_gasto": 0,
      "026": 0,
      "022": 0,
      "016": 0,
      "almacen": 0,
      "chapisteria": 0,
      "estado_pyg": 0
    }

    # Convertir a lista y formatear valores
    response_by_owner = []

    sorted_owner_codes = sorted(consolidated_by_owner.keys())

    for owner_code in sorted_owner_codes:
      owner_data = consolidated_by_owner[owner_code]
      owner_data["unidades"] = sorted(
        owner_data["unidades"], 
        key=lambda x: x["unidad"]
      )
      # Formatear valores numéricos para las unidades del propietario
      for unidad in owner_data["unidades"]:
        numeric_fields = ["incomes", "insurances", "total_labor", "gasto_caja", "generales", "026", "022", "016", "almacen", "chapisteria"]
        for field in numeric_fields:
          if field in unidad and unidad[field] == 0:
            unidad[field] = ""
          elif field in unidad:
            unidad[field] = round(unidad[field], 2)
      
      # Formatear totales del propietario
      for field in totales_generales:
        if owner_data["totales"][field] == 0:
          owner_data["totales"][field] = ""
        else:
          owner_data["totales"][field] = round(owner_data["totales"][field], 2)
          
        # Sumar a totales generales
        if owner_data["totales"][field] != "":
          totales_generales[field] += owner_data["totales"][field]
      
      # Filtrar propietarios que tengan al menos una unidad con valores
      has_values = any(
          any(unidad.get(field) not in [0, "", None] 
          for field in ["incomes", "insurances", "total_labor", "gasto_caja", "generales", "026", "022", "016", "almacen", "chapisteria"])
          for unidad in owner_data["unidades"]
      )
      
      if has_values:
        response_by_owner.append(owner_data)

    # Formatear totales generales
    for field in totales_generales:
      if totales_generales[field] == 0:
        totales_generales[field] = ""
      else:
        totales_generales[field] = round(totales_generales[field], 2)

    # Get current date
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    titulo = 'Estado de Pérdidas y Ganancias'

    info_empresa = db.query(
      InfoEmpresas.NOMBRE,
      InfoEmpresas.NIT,
      InfoEmpresas.LOGO
    ).filter(InfoEmpresas.ID == company_code).first()
    
    # Construir respuesta final
    response = {
      "propietarios": response_by_owner,
      "totales_generales": totales_generales,
      "fechas": {
        "primeraFecha": data.primeraFecha,
        "ultimaFecha": data.ultimaFecha
      },
      "usuario": data.usuario,
      "fecha": fecha,
      "hora": hora_actual,
      "nombre_empresa": info_empresa.NOMBRE,
      "nit_empresa": info_empresa.NIT,
      "logo_empresa": info_empresa.LOGO,
    }

    headers = {
      "Content-Disposition": "attachment; estado-perdidas-ganancias.pdf"
    }

    data_reporte = response

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "EstadoPyG3.html"
    header_file = "header2.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data=data_reporte) 
    output_header = header.render(data_reporte)
    output_footer = footer.render(data_reporte)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as html_file:
      html_path = html_file.name
      html_file.write(output_text)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as header_file:
      header_path = header_file.name
      header_file.write(output_header)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as footer_file:
      footer_path = footer_file.name
      footer_file.write(output_footer)

    pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name

    html2pdf(titulo, html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    response = FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='templates/estado-perdidas-ganancias.pdf', 
        headers=headers,
        background=background_tasks
      )

    return response

  except Exception as e:
    return JSONResponse(status_code=500, content={"message": str(e)})
  finally:
    db.close()

#---------------------------------------------------------------------------------------------------------------

@pandgstatus_router.post("/pandgstatus-summary/{company_code}/", tags=["Reports"])
async def pandgstatus_report_summary(company_code: str, data: PandGStatusReport):
  db = session()
  try:
    # Aceptar fechas como string y convertir a objetos date para las comparaciones
    for _attr in ("primeraFecha", "ultimaFecha"):
      val = getattr(data, _attr, None)
      if isinstance(val, str):
        for _fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
          try:
            setattr(data, _attr, datetime.strptime(val, _fmt).date())
            break
          except ValueError:
            continue

    if data.primeraFecha > data.ultimaFecha:
      return JSONResponse(status_code=400, content={"message": "La primera fecha no puede ser mayor que la última fecha"})
    
    owners_codes = data.empresa

    # Diccionario para mapear códigos de propietario a nombres
    owners_info = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(
        Propietarios.CODIGO.in_(owners_codes), 
        Propietarios.EMPRESA == company_code
    ).all()

    owners_dict = {owner.CODIGO: owner.NOMBRE for owner in owners_info}
    
    if not owners_dict:
      return JSONResponse(status_code=404, content={"message": "No se encontraron propietarios para las empresas proporcionadas"})
        
      # Consulta de estados
    status_list = db.query(
      Estados.CODIGO,
      Estados.NOMBRE
    ).filter(
      Estados.EMPRESA == company_code
    ).all()
    
    # Crear diccionario de estados (código -> nombre)
    estados_dict = {estado.CODIGO: estado.NOMBRE for estado in status_list}
    
    # Identificar todas las unidades que tuvieron movimientos con los propietarios consultados
    incomes = db.query(
      CajaRecaudos.PROPI_IDEN,
      CajaRecaudos.NUMERO,
      func.coalesce(func.sum(CajaRecaudos.DEU_RENTA), 0).label('total_renta'),
      func.coalesce(func.sum(CajaRecaudos.FON_INSCRI), 0).label('total_gastos'),
      func.coalesce(func.sum(CajaRecaudos.DEU_SINIES), 0).label('total_recaudo')
    ).filter(
      CajaRecaudos.EMPRESA == company_code,
      CajaRecaudos.FEC_RECIBO >= data.primeraFecha,
      CajaRecaudos.FEC_RECIBO <= data.ultimaFecha,
      CajaRecaudos.PROPI_IDEN.in_(owners_codes)
    ).group_by(CajaRecaudos.PROPI_IDEN, CajaRecaudos.NUMERO).all()

    # Consulta de seguros 
    insurances = db.query(
      ReclamosColisiones.PROPI_IDEN,
      ReclamosColisiones.NUMERO,
      func.coalesce(func.sum(ReclamosColisiones.BCO_VALOR), 0).label('total_insurance'),
      func.sum(case((ReclamosColisiones.CERRADO == "F", 1), else_=0)).label('pending')
    ).filter(
      ReclamosColisiones.EMPRESA == company_code,
      or_(
        and_(
          ReclamosColisiones.BCO_FECHA >= data.primeraFecha,
          ReclamosColisiones.BCO_FECHA <= data.ultimaFecha
        ),
        ReclamosColisiones.CERRADO == 'F'
      ),
      ReclamosColisiones.PROPI_IDEN.in_(owners_codes)
    ).group_by(ReclamosColisiones.PROPI_IDEN, ReclamosColisiones.NUMERO).all()

    # Consulta de mano de obra
    labor = db.query(
      ChapisteriaManoObra.PROPI_IDEN,
      ChapisteriaManoObra.NUMERO,
      func.coalesce(func.sum(ChapisteriaManoObra.VLR_MANOBR), 0).label('total_labor')
    ).filter(
      ChapisteriaManoObra.EMPRESA == company_code,
      ChapisteriaManoObra.FECHA >= data.primeraFecha,
      ChapisteriaManoObra.FECHA <= data.ultimaFecha,
      ChapisteriaManoObra.PROPI_IDEN.in_(owners_codes)
    ).group_by(ChapisteriaManoObra.PROPI_IDEN, ChapisteriaManoObra.NUMERO).all()

    # Consulta de movimientos
    movements = db.query(
      Movimien.PROPI_IDEN,
      Movimien.UNIDAD,
      func.coalesce(func.sum(Movimien.VALOR), 0).label('total_movement'),
      func.coalesce(func.sum(case((Movimien.TIPO == '024', Movimien.TOTAL), else_=0)), 0).label('tipo_024'),
      func.coalesce(func.sum(case((Movimien.TIPO == '027', Movimien.TOTAL), else_=0)), 0).label('tipo_027'),
      func.coalesce(func.sum(case((Movimien.TIPO == '026', Movimien.TOTAL), else_=0)), 0).label('tipo_026'),
      func.coalesce(func.sum(case((Movimien.TIPO == '022', Movimien.TOTAL), else_=0)), 0).label('tipo_022'),
      func.coalesce(func.sum(case((Movimien.TIPO == '016', Movimien.TOTAL), else_=0)), 0).label('tipo_016')
    ).filter(
      Movimien.EMPRESA == company_code,
      Movimien.FECHA >= data.primeraFecha,
      Movimien.FECHA <= data.ultimaFecha,
      Movimien.PROPI_IDEN.in_(owners_codes),
      Movimien.TIPO.in_(['024', '027', '026', '022', '016'])
    ).group_by(Movimien.PROPI_IDEN, Movimien.UNIDAD).all()

    # Recopilar todas las unidades únicas que aparecen en los movimientos históricos
    all_units_from_movements = set()
    
    for income in incomes:
      all_units_from_movements.add(income.NUMERO)
    
    for insurance in insurances:
      all_units_from_movements.add(insurance.NUMERO)
    
    for lab in labor:
      all_units_from_movements.add(lab.NUMERO)
    
    for mov in movements:
      all_units_from_movements.add(mov.UNIDAD)
    
    # Buscar información de todas estas unidades
    vehicles = db.query(
      Vehiculos.NUMERO,
      Vehiculos.MODELO,
      Vehiculos.ESTADO,
      Vehiculos.VLR_COMPRA,
      Vehiculos.FEC_CREADO
    ).filter(
      Vehiculos.EMPRESA == company_code,
      Vehiculos.NUMERO.in_(list(all_units_from_movements))
    ).all()
    
    # Crear diccionario de vehículos por unidad
    vehicles_dict = {}
    for vehicle in vehicles:
      unidad = vehicle.NUMERO
      estado_nombre = estados_dict.get(vehicle.ESTADO, "") if vehicle.ESTADO else ""
      vehicles_dict[unidad] = {
        "modelo": vehicle.MODELO or "",
        "estado": estado_nombre.title(),
        "estado_codigo": vehicle.ESTADO or "",
        "valor_compra": vehicle.VLR_COMPRA or "",
        "fecha_creacion": vehicle.FEC_CREADO if vehicle.FEC_CREADO else ""
      }

    # Consolidar la información por unidad
    consolidated_by_owner_unit = {}
    
    # Procesar ingresos
    for income in incomes:
      key = (income.PROPI_IDEN, income.NUMERO)
      #unidad = income.NUMERO
      total_income = income.total_renta + income.total_gastos + income.total_recaudo
      # Usar la unidad como clave
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(income.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": income.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(income.PROPI_IDEN, ""),
          "unidad": income.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["incomes"] += total_income
    
    # Procesar seguros
    for insurance in insurances:
      key = (insurance.PROPI_IDEN, insurance.NUMERO)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(insurance.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": insurance.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(insurance.PROPI_IDEN, ""),
          "unidad": insurance.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["insurances"] += insurance.total_insurance
      if insurance.pending and insurance.pending > 0:
        consolidated_by_owner_unit[key]["pending_insurance"] = "Pen"

    # Procesar mano de obra
    for lab in labor:
      key = (lab.PROPI_IDEN, lab.NUMERO)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(lab.NUMERO, {})
        consolidated_by_owner_unit[key] = {
          "propietario": lab.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(lab.PROPI_IDEN, ""),
          "unidad": lab.NUMERO,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      consolidated_by_owner_unit[key]["total_labor"] += lab.total_labor
    
    # Procesar movimientos
    for mov in movements:
      key = (mov.PROPI_IDEN, mov.UNIDAD)
      if key not in consolidated_by_owner_unit:
        vehicle_info = vehicles_dict.get(mov.UNIDAD, {})
        consolidated_by_owner_unit[key] = {
          "propietario": mov.PROPI_IDEN,
          "propietario_nombre": owners_dict.get(mov.PROPI_IDEN, ""),
          "unidad": mov.UNIDAD,
          "modelo": vehicle_info.get("modelo", ""),
          "estado": vehicle_info.get("estado", ""),
          "estado_codigo": vehicle_info.get("estado_codigo", ""),
          "valor_compra": vehicle_info.get("valor_compra", ""),
          "fecha_creacion": vehicle_info.get("fecha_creacion", ""),
          "incomes": 0,
          "insurances": 0,
          "pending_insurance": "",
          "total_labor": 0,
          "gasto_caja": 0,
          "generales": 0,
          "otro_gasto": 0,
          "026": 0,
          "022": 0,
          "016": 0,
          "almacen": 0,
          "chapisteria": 0,
          "estado_pyg": 0
        }
      # consolidated_by_unit[unidad]["total_movement"] += mov.total_movement
      consolidated_by_owner_unit[key]["gasto_caja"] += mov.tipo_024
      consolidated_by_owner_unit[key]["generales"] += mov.tipo_027
      consolidated_by_owner_unit[key]["026"] += mov.tipo_026
      consolidated_by_owner_unit[key]["022"] += mov.tipo_022
      consolidated_by_owner_unit[key]["016"] += mov.tipo_016
      consolidated_by_owner_unit[key]["almacen"] = consolidated_by_owner_unit[key]["022"] - consolidated_by_owner_unit[key]["016"]
      consolidated_by_owner_unit[key]["chapisteria"] = consolidated_by_owner_unit[key]["026"] + consolidated_by_owner_unit[key]["total_labor"]

    for key, item in consolidated_by_owner_unit.items():
      item["estado_pyg"] = item["incomes"] - item["gasto_caja"] - item["generales"] - item["chapisteria"] - item["almacen"]
    
    # Filtrar unidades sin movimientos
    filtered_units = {}
    for key, item in consolidated_by_owner_unit.items():
      numeric_fields = [
        "incomes", "insurances", "total_labor", "gasto_caja",
        "generales", "otro_gasto", "026", "022", "016", "almacen", "chapisteria"
      ]

      has_movements = any(item.get(field, 0) != 0 for field in numeric_fields)
      has_pending_insurance = item.get("pending_insurance") != ""

      if has_movements or has_pending_insurance:
        filtered_units[key] = item

    # Crear estructura solo con totales por propietario
    summary_by_owner = {}

    for key, item in filtered_units.items():
      owner_code = item["propietario"]
      if owner_code not in summary_by_owner:
        summary_by_owner[owner_code] = {
          "propietario": owner_code,
          "propietario_nombre": item["propietario_nombre"],
          "totales": {
              "cantidad_unidades": 0,
              "cantidad_propietarios": 0,
              "incomes": 0,
              "insurances": 0,
              "total_labor": 0,
              "gasto_caja": 0,
              "generales": 0,
              "otro_gasto": 0,
              "026": 0,
              "022": 0,
              "016": 0,
              "almacen": 0,
              "chapisteria": 0,
              "estado_pyg": 0
          }
        }
      
      # Sumar directamente a los totales del propietario
      summary_by_owner[owner_code]["totales"]["cantidad_unidades"] += 1
      summary_by_owner[owner_code]["totales"]["incomes"] += item["incomes"]
      summary_by_owner[owner_code]["totales"]["insurances"] += item["insurances"]
      summary_by_owner[owner_code]["totales"]["total_labor"] += item["total_labor"]
      summary_by_owner[owner_code]["totales"]["gasto_caja"] += item["gasto_caja"]
      summary_by_owner[owner_code]["totales"]["generales"] += item["generales"]
      summary_by_owner[owner_code]["totales"]["otro_gasto"] += item["otro_gasto"]
      summary_by_owner[owner_code]["totales"]["026"] += item["026"]
      summary_by_owner[owner_code]["totales"]["022"] += item["022"]
      summary_by_owner[owner_code]["totales"]["016"] += item["016"]
      summary_by_owner[owner_code]["totales"]["almacen"] += item["almacen"]
      summary_by_owner[owner_code]["totales"]["chapisteria"] += item["chapisteria"]
      summary_by_owner[owner_code]["totales"]["estado_pyg"] += item["estado_pyg"]

    # Calcular totales generales
    totales_generales = {
        "cantidad_unidades": 0,
        "cantidad_propietarios": 0,
        "incomes": 0,
        "insurances": 0,
        "total_labor": 0,
        "gasto_caja": 0,
        "generales": 0,
        "otro_gasto": 0,
        "026": 0,
        "022": 0,
        "016": 0,
        "almacen": 0,
        "chapisteria": 0,
        "estado_pyg": 0
    }

    # Convertir a lista y formatear valores
    response_summary = []

    sorted_owner_codes = sorted(summary_by_owner.keys())

    for owner_code in sorted_owner_codes:
      owner_data = summary_by_owner[owner_code]
      
      # Formatear totales del propietario
      for field in totales_generales:
        if owner_data["totales"][field] == 0:
          owner_data["totales"][field] = ""
        else:
          owner_data["totales"][field] = round(owner_data["totales"][field], 2)
            
        # Sumar a totales generales
        if owner_data["totales"][field] != "":
          totales_generales[field] += owner_data["totales"][field]
      
      # Solo incluir propietarios que tengan valores
      has_values = any(
        owner_data["totales"].get(field) not in [0, "", None] 
        for field in ["incomes", "insurances", "total_labor", "gasto_caja", "generales", "026", "022", "016", "almacen", "chapisteria"]
      )
      
      if has_values:
        response_summary.append(owner_data)
        totales_generales["cantidad_propietarios"] += 1

    # Formatear totales generales
    for field in totales_generales:
      if totales_generales[field] == 0:
        totales_generales[field] = ""
      else:
        totales_generales[field] = round(totales_generales[field], 2)

    # Get current date
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    titulo = 'Estado de Pérdidas y Ganancias'

    info_empresa = db.query(
      InfoEmpresas.NOMBRE,
      InfoEmpresas.NIT,
      InfoEmpresas.LOGO
    ).filter(InfoEmpresas.ID == company_code).first()

    # Construir respuesta final unidades
    response = {
      "propietarios": response_summary,
      "totales_generales": totales_generales,
      "fechas": {
          "primeraFecha": data.primeraFecha,
          "ultimaFecha": data.ultimaFecha
      },
      "usuario": data.usuario,
      "fecha": fecha,
      "hora": hora_actual,
      "nombre_empresa": info_empresa.NOMBRE,
      "nit_empresa": info_empresa.NIT,
      "logo_empresa": info_empresa.LOGO,
    }

    headers = {
      "Content-Disposition": "attachment; resumen-estado-perdidas-ganancias.pdf"
    }

    data_reporte = response

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "ResumenEstadoPyG.html"
    header_file = "header2.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data=data_reporte) 
    output_header = header.render(data_reporte)
    output_footer = footer.render(data_reporte)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as html_file:
      html_path = html_file.name
      html_file.write(output_text)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as header_file:
      header_path = header_file.name
      header_file.write(output_header)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w") as footer_file:
      footer_path = footer_file.name
      footer_file.write(output_footer)

    pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name

    html2pdf(titulo, html_path, pdf_path, header_path=header_path, footer_path=footer_path, orientation='Landscape')

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    response = FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='templates/resumen-estado-perdidas-ganancias.pdf', 
        headers=headers,
        background=background_tasks
      )

    return response

  except Exception as e:
    return JSONResponse(status_code=500, content={"message": str(e)})
  finally:
    db.close()
