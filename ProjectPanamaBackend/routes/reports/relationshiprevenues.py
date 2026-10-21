from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from models.infoempresas import InfoEmpresas
from config.dbconnection import session
from models.cajarecaudos import CajaRecaudos
from models.propietarios import Propietarios
from models.vehiculos import Vehiculos
from schemas.reports import *
from fastapi.encoders import jsonable_encoder
from utils.reports import *
from datetime import datetime
import pytz
import os

from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
import jinja2
from utils.pdf import html2pdf
from collections import defaultdict
import tempfile

templateJinja = Jinja2Templates(directory="templates")

relationshiprevenuesReports_router = APIRouter()

@relationshiprevenuesReports_router.post("/relationshiprevenues/{company_code}", tags=["Reports"])
async def relationshiprevenues_report(company_code: str, data: RelationshipRevenuesReport):
  db = session()
  try:
    if data.primeraFecha > data.ultimaFecha:
      return JSONResponse(content={"message": "La primera fecha no puede ser mayor a la última fecha"}, status_code=400)

    if data.unidad == "" or data.unidad == "TODOS":
      empresa = data.empresa

      conteo_reporte_ingresos = db.query(
        Propietarios.EMPRESA.label('codigo_empresa'),
        CajaRecaudos.EMPRESA.label('num_empresa'),
        CajaRecaudos.RECIBO.label('recibo'),
        CajaRecaudos.FEC_RECIBO.label('fecha_recibo'),
        CajaRecaudos.NUMERO.label('unidad'),
        CajaRecaudos.SDO_RENTA.label('saldo_renta'),
        CajaRecaudos.DEU_RENTA.label('deuda_renta'),
        CajaRecaudos.FON_INSCRI.label('fondo_inscripcion'),
        CajaRecaudos.FON_AHORRO.label('fondo_ahorro'),
        CajaRecaudos.DEU_SINIES.label('deuda_siniestro'),
        CajaRecaudos.FORMAPAGO.label('forma_pago'),
        CajaRecaudos.TOTAL.label('total'),
        Propietarios.NOMBRE.label('empresa'),
        Vehiculos.PAGA_ADMON.label('paga_admon'),
        Vehiculos.GLOBAL_UND.label('global_und'),
        Vehiculos.CUO_ADMON.label('cuota_admon'),
        Vehiculos.CUO_DIARIA.label('cuota_diaria'),
      ) \
      .join(Propietarios, Propietarios.CODIGO == CajaRecaudos.PROPI_IDEN) \
      .join(Vehiculos, Vehiculos.NUMERO == CajaRecaudos.NUMERO) \
      .filter(
        CajaRecaudos.FEC_RECIBO >= data.primeraFecha,
        CajaRecaudos.FEC_RECIBO <= data.ultimaFecha,
        CajaRecaudos.PROPI_IDEN == empresa,
        CajaRecaudos.FORMAPAGO.in_(["1", "2", "3", "4", "5"]),
        CajaRecaudos.EMPRESA == company_code,
        Propietarios.EMPRESA == company_code,
        Vehiculos.EMPRESA == company_code,
        CajaRecaudos.EMPRESA == Propietarios.EMPRESA
      ).all()

    elif data.unidad != "" and data.unidad != "TODOS":
      # empresa = db.query(Propietarios.CODIGO).filter(Propietarios.NOMBRE == data.empresa).all()
      empresa = data.empresa
      conteo_reporte_ingresos = db.query(
          Propietarios.EMPRESA.label('codigo_empresa'),
          CajaRecaudos.EMPRESA.label('num_empresa'),
          CajaRecaudos.RECIBO.label('recibo'),
          CajaRecaudos.FEC_RECIBO.label('fecha_recibo'),
          CajaRecaudos.NUMERO.label('unidad'),
          CajaRecaudos.SDO_RENTA.label('saldo_renta'),
          CajaRecaudos.DEU_RENTA.label('deuda_renta'),
          CajaRecaudos.FON_INSCRI.label('fondo_inscripcion'),
          CajaRecaudos.FON_AHORRO.label('fondo_ahorro'),
          CajaRecaudos.DEU_SINIES.label('deuda_siniestro'),
          CajaRecaudos.FORMAPAGO.label('forma_pago'),
          CajaRecaudos.TOTAL.label('total'),
          Propietarios.NOMBRE.label('empresa'),
          Vehiculos.PAGA_ADMON.label('paga_admon'),
          Vehiculos.GLOBAL_UND.label('global_und'),
          Vehiculos.CUO_ADMON.label('cuota_admon'),
          Vehiculos.CUO_DIARIA.label('cuota_diaria'),
        ) \
        .join(Propietarios, Propietarios.CODIGO == CajaRecaudos.PROPI_IDEN) \
        .join(Vehiculos, Vehiculos.NUMERO == CajaRecaudos.NUMERO) \
        .filter(
          CajaRecaudos.FEC_RECIBO >= data.primeraFecha,
          CajaRecaudos.FEC_RECIBO <= data.ultimaFecha,
          CajaRecaudos.NUMERO == data.unidad,
          CajaRecaudos.FORMAPAGO.in_(["1", "2", "3", "4", "5"]),
          CajaRecaudos.PROPI_IDEN == empresa,
          CajaRecaudos.EMPRESA == company_code,
          Propietarios.EMPRESA == company_code,
          Vehiculos.EMPRESA == company_code,
          CajaRecaudos.EMPRESA == Propietarios.EMPRESA
        ).all()
      
    if len(conteo_reporte_ingresos) == 0:
      return JSONResponse(content={"message": "No se encontraron registros"}, status_code=400)
    
    id_empresa = conteo_reporte_ingresos[0].codigo_empresa

    aggregated_data = {}
    for item in conteo_reporte_ingresos:
      # Condición 1: forma_pago debe ser un string entre "1" y "5"
      forma_pago_valida = isinstance(item.forma_pago, str) and "1" <= item.forma_pago <= "5"
      
      # Condición 2: el item no debe tener todos los valores monetarios en 0
      # Se asume que si un valor es None, no se considera 0 para esta validación,
      # o que los valores ya son numéricos (e.g., 0.0 o Decimal('0')).
      todos_valores_monetarios_cero = (
          item.saldo_renta == 0 and
          item.deuda_renta == 0 and
          item.fondo_inscripcion == 0 and
          item.fondo_ahorro == 0 and
          item.deuda_siniestro == 0 and
          item.total == 0 
      )
      
      # Si la forma de pago no es válida o todos los valores monetarios son cero, saltar este item
      if not forma_pago_valida or todos_valores_monetarios_cero:
        continue

      key = item.recibo
      if key not in aggregated_data:
        aggregated_data[key] = {
          "recibo": item.recibo,
          "fecha_recibo": item.fecha_recibo,
          "unidad": item.unidad,
          "empresa": item.empresa,
          "forma_pago": item.forma_pago,
          "saldo_renta": item.saldo_renta,
          "deuda_renta": item.deuda_renta,
          "fondo_inscripcion": item.fondo_inscripcion,
          "fondo_ahorro": item.fondo_ahorro,
          "deuda_siniestro": item.deuda_siniestro,
          "total": item.total,
          "paga_admon": 0
        }
      else:
      # Verificar y asignar valores no vacíos si el registro existente tiene campos vacíos
        if not aggregated_data[key]["fecha_recibo"] and item.fecha_recibo:
            aggregated_data[key]["fecha_recibo"] = item.fecha_recibo
        if not aggregated_data[key]["unidad"] and item.unidad:
            aggregated_data[key]["unidad"] = item.unidad
        if not aggregated_data[key]["empresa"] and item.empresa:
            aggregated_data[key]["empresa"] = item.empresa
        if not aggregated_data[key]["forma_pago"] and item.forma_pago:
            aggregated_data[key]["forma_pago"] = item.forma_pago
        if not aggregated_data[key]["saldo_renta"] and item.saldo_renta:
            aggregated_data[key]["saldo_renta"] = item.saldo_renta
      
        # Sumar los valores numéricos
        aggregated_data[key]["deuda_renta"] += item.deuda_renta
        aggregated_data[key]["fondo_inscripcion"] += item.fondo_inscripcion
        aggregated_data[key]["fondo_ahorro"] += item.fondo_ahorro
        aggregated_data[key]["deuda_siniestro"] += item.deuda_siniestro

        admon_fee_component = 0
      if item.paga_admon == "1" and item.global_und == "2":
        # TODO: REVISAR REDONDEOS
        # print("deuda_renta", aggregated_data[key]["deuda_renta"], "cuota_admon", item.cuota_admon, "cuota_diaria", item.cuota_diaria)
        admon_fee_component = round((aggregated_data[key]["deuda_renta"] * item.cuota_admon) / item.cuota_diaria, 2)
        # admon_fee_component = int(raw * 100) / 100

        aggregated_data[key]["paga_admon"] = admon_fee_component

    data_reporte = list(aggregated_data.values())

    total_recibos = len(aggregated_data)

    # Filtrar registros que tengan campos string obligatorios vacíos.
    # Se consideran obligatorios: recibo, unidad, empresa y forma_pago.
    registros_filtrados = [
      row for row in data_reporte
      if row["recibo"] and row["unidad"] and row["empresa"] and row["forma_pago"]
    ]

    # Ordenar registros por número de unidad
    registros_ordenados = sorted(registros_filtrados, key=lambda x: x["recibo"])

    # CALCULAR LOS TOTALES a partir de los registros filtrados
    total_deuda_renta = 0
    total_fondo_inscripcion = 0
    total_fondo_ahorro = 0
    total_deuda_siniestro = 0
    total_efectivo = 0
    total_ach = 0
    total_arp = 0 
    total_nequi = 0
    total_yappy = 0
    total_total = 0
    total_admon = 0

    for item in registros_ordenados:
      total_deuda_renta += item["deuda_renta"]
      total_fondo_inscripcion += item["fondo_inscripcion"]
      total_fondo_ahorro += item["fondo_ahorro"]
      total_deuda_siniestro += item["deuda_siniestro"]
      total_total += item["total"]
      total_admon += item["paga_admon"]

      if item["forma_pago"] == "1":
        total_efectivo += item["total"]
      elif item["forma_pago"] == "2":
        total_ach += item["total"]
      elif item["forma_pago"] == "3":
        total_arp += item["total"]
      elif item["forma_pago"] == "4":
        total_nequi += item["total"]
      elif item["forma_pago"] == "5":
        total_yappy += item["total"]

    # Get current date
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    usuario = data.usuario
    titulo = 'Detalle Relación de Ingresos'

    info_empresa = db.query(
      InfoEmpresas.NOMBRE,
      InfoEmpresas.NIT,
      InfoEmpresas.LOGO
    ).filter(InfoEmpresas.ID == id_empresa).first()

    response = {
      "reporte": registros_ordenados,
      "totales": {
        "deuda_renta": total_deuda_renta,
        "fondo_inscripcion": total_fondo_inscripcion,
        "fondo_ahorro": total_fondo_ahorro,
        "deuda_siniestro": total_deuda_siniestro,
        "efectivo": total_efectivo,
        "ach": total_ach,
        "arp": total_arp,
        "nequi": total_nequi,
        "yappy": total_yappy,
        "total": total_total,
        "total_admon": total_admon,
        "total_resta_admon": total_total - total_admon,
        "total_recibos": total_recibos
      },
      "fechas": {
        "primeraFecha": data.primeraFecha,
        "ultimaFecha": data.ultimaFecha
      },
      "usuario": usuario,
      "fecha": fecha,
      "hora": hora_actual,
      "nombre_empresa": info_empresa.NOMBRE,
      "nit_empresa": info_empresa.NIT,
      "logo_empresa": info_empresa.LOGO,
    }

    data_reporte = response

    headers = {
      "Content-Disposition": "attachment; relacion-ingresos.pdf"
    }  

    # return JSONResponse(content=jsonable_encoder(data_reporte)) 

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "RelacionIngresos.html"
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
        filename='relacion-ingresos.pdf', 
        headers=headers,
        background=background_tasks
      )

    return response
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=400)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

@relationshiprevenuesReports_router.post("/general-relationshiprevenues/", tags=["Reports"])
async def general_relationshiprevenues_report(data: GeneralRelationshipRevenuesReport, background_tasks: BackgroundTasks):
  db = session()
  try:
    if data.primeraFecha > data.ultimaFecha:
      return JSONResponse(content={"message": "La primera fecha no puede ser mayor a la última fecha"}, status_code=400)

    if not data.empresas or len(data.empresas) == 0:
      return JSONResponse(content={"message": "Debe proporcionar al menos una empresa"}, status_code=400)
    
    conteo_reporte_ingresos = db.query(
      Propietarios.CODIGO.label('codigo_empresa'),
      CajaRecaudos.EMPRESA.label('num_empresa'),
      CajaRecaudos.RECIBO.label('recibo'),
      CajaRecaudos.DEU_RENTA.label('deuda_renta'),
      CajaRecaudos.FON_INSCRI.label('fondo_inscripcion'),
      CajaRecaudos.FON_AHORRO.label('fondo_ahorro'),
      CajaRecaudos.DEU_SINIES.label('deuda_siniestro'),
      CajaRecaudos.FORMAPAGO.label('forma_pago'),
      CajaRecaudos.TOTAL.label('total'),
      Propietarios.NOMBRE.label('empresa'),
      Vehiculos.PAGA_ADMON.label('paga_admon'),
      Vehiculos.GLOBAL_UND.label('global_und'),
      Vehiculos.CUO_ADMON.label('cuota_admon'),
      Vehiculos.CUO_DIARIA.label('cuota_diaria'),
    ) \
    .join(Propietarios, Propietarios.CODIGO == CajaRecaudos.PROPI_IDEN) \
    .join(Vehiculos, Vehiculos.NUMERO == CajaRecaudos.NUMERO) \
    .filter(
      CajaRecaudos.FEC_RECIBO >= data.primeraFecha,
      CajaRecaudos.FEC_RECIBO <= data.ultimaFecha,
      CajaRecaudos.PROPI_IDEN.in_(data.empresas),
      CajaRecaudos.FORMAPAGO.in_(["1", "2", "3", "4", "5"]),
      CajaRecaudos.EMPRESA == data.codigo_empresa,
      CajaRecaudos.EMPRESA == Propietarios.EMPRESA,
      Propietarios.EMPRESA == Vehiculos.EMPRESA
    ).all()
      
    if not conteo_reporte_ingresos:
      return JSONResponse(content={"message": "No se encontraron registros"}, status_code=404)

    recibos_consolidados = {}
    for item in conteo_reporte_ingresos:
      forma_pago_valida = isinstance(item.forma_pago, str) and "1" <= item.forma_pago <= "5"
      todos_valores_monetarios_cero = (item.deuda_renta == 0 and item.fondo_inscripcion == 0 and item.fondo_ahorro == 0 and item.deuda_siniestro == 0 and item.total == 0)
      
      if not forma_pago_valida or todos_valores_monetarios_cero:
        continue

      clave_recibo = (item.codigo_empresa, item.recibo)

      if clave_recibo not in recibos_consolidados:
        recibos_consolidados[clave_recibo] = {
          "codigo_empresa": item.codigo_empresa,
          "empresa": item.empresa,
          "recibo": item.recibo,
          "deuda_renta": 0,
          "fondo_inscripcion": 0,
          "fondo_ahorro": 0,
          "deuda_siniestro": 0,
          "forma_pago": item.forma_pago,
          "total": item.total,
          "paga_admon": item.paga_admon,
          "global_und": item.global_und,
          "cuota_admon": item.cuota_admon,
          "cuota_diaria": item.cuota_diaria,
        }
      
      recibos_consolidados[clave_recibo]["deuda_renta"] += item.deuda_renta
      recibos_consolidados[clave_recibo]["fondo_inscripcion"] += item.fondo_inscripcion
      recibos_consolidados[clave_recibo]["fondo_ahorro"] += item.fondo_ahorro
      recibos_consolidados[clave_recibo]["deuda_siniestro"] += item.deuda_siniestro

    empresas_data = {}
    for recibo in recibos_consolidados.values():
      empresa_codigo = recibo["codigo_empresa"]
      
      if empresa_codigo not in empresas_data:
        empresas_data[empresa_codigo] = {
          "codigo_empresa": empresa_codigo,
          "empresa": recibo["empresa"],
          "deuda_renta": 0, "fondo_inscripcion": 0, "fondo_ahorro": 0,
          "deuda_siniestro": 0, "efectivo": 0, "ach": 0, "arp": 0,
          "nequi": 0, "yappy": 0, "total": 0, "total_admon": 0,
          "total_recibos": 0 
        }

      empresas_data[empresa_codigo]["deuda_renta"] += recibo["deuda_renta"]
      empresas_data[empresa_codigo]["fondo_inscripcion"] += recibo["fondo_inscripcion"]
      empresas_data[empresa_codigo]["fondo_ahorro"] += recibo["fondo_ahorro"]
      empresas_data[empresa_codigo]["deuda_siniestro"] += recibo["deuda_siniestro"]
      empresas_data[empresa_codigo]["total"] += recibo["total"]
      empresas_data[empresa_codigo]["total_recibos"] += 1

      admon_fee_component = 0
      if recibo["paga_admon"] == "1" and recibo["global_und"] == "2" and recibo["cuota_diaria"] and recibo["cuota_diaria"] > 0:
        admon_fee_component = round((recibo["deuda_renta"] * recibo["cuota_admon"]) / recibo["cuota_diaria"], 2)
      
      empresas_data[empresa_codigo]["total_admon"] += admon_fee_component

      if recibo["forma_pago"] == "1":
        empresas_data[empresa_codigo]["efectivo"] += recibo["total"]
      elif recibo["forma_pago"] == "2":
        empresas_data[empresa_codigo]["ach"] += recibo["total"]
      elif recibo["forma_pago"] == "3":
        empresas_data[empresa_codigo]["arp"] += recibo["total"]
      elif recibo["forma_pago"] == "4":
        empresas_data[empresa_codigo]["nequi"] += recibo["total"]
      elif recibo["forma_pago"] == "5":
        empresas_data[empresa_codigo]["yappy"] += recibo["total"]

    empresas_resumen = list(empresas_data.values())
    
    if not empresas_resumen:
      return JSONResponse(content={"message": "No se encontraron datos para resumir tras aplicar los filtros"}, status_code=404)

    for datos in empresas_resumen:
      datos["total_resta_admon"] = datos["total"] - datos["total_admon"]

    empresas_resumen = sorted(empresas_resumen, key=lambda x: x["empresa"])

    totales_generales = {
      "deuda_renta": sum(emp["deuda_renta"] for emp in empresas_resumen),
      "fondo_inscripcion": sum(emp["fondo_inscripcion"] for emp in empresas_resumen),
      "fondo_ahorro": sum(emp["fondo_ahorro"] for emp in empresas_resumen),
      "deuda_siniestro": sum(emp["deuda_siniestro"] for emp in empresas_resumen),
      "efectivo": sum(emp["efectivo"] for emp in empresas_resumen),
      "ach": sum(emp["ach"] for emp in empresas_resumen),
      "arp": sum(emp["arp"] for emp in empresas_resumen),
      "nequi": sum(emp["nequi"] for emp in empresas_resumen),
      "yappy": sum(emp["yappy"] for emp in empresas_resumen),
      "total": sum(emp["total"] for emp in empresas_resumen),
      "total_admon": sum(emp["total_admon"] for emp in empresas_resumen),
      "total_recibos": sum(emp["total_recibos"] for emp in empresas_resumen),
    }
    totales_generales["total_resta_admon"] = totales_generales["total"] - totales_generales["total_admon"]

    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    
    usuario = data.usuario

    info_empresa = db.query(InfoEmpresas.NOMBRE, InfoEmpresas.NIT, InfoEmpresas.LOGO).filter(InfoEmpresas.ID == data.codigo_empresa).first()

    info_view = {
      "empresas": empresas_resumen,
      "totales_generales": totales_generales,
      "fechas": { "primeraFecha": data.primeraFecha, "ultimaFecha": data.ultimaFecha },
      "usuario": usuario,
      "fecha": fecha,
      "hora": hora_actual,
      "titulo": "Resumen de Ingresos por Empresas",
      "nombre_empresa": info_empresa.NOMBRE if info_empresa else "",
      "nit_empresa": info_empresa.NIT if info_empresa else "",
      "logo_empresa": info_empresa.LOGO if info_empresa else ""
    }

    headers = { "Content-Disposition": "attachment; filename=relacion-ingresos-empresas.pdf" }

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template = template_env.get_template("RelacionIngresosGeneral.html")
    header = template_env.get_template("header2.html")
    footer = template_env.get_template("footer1.html")
    output_text = template.render(data=info_view)
    output_header = header.render(info_view)
    output_footer = footer.render(info_view)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8") as html_file:
      html_path = html_file.name
      html_file.write(output_text)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8") as header_file:
      header_path = header_file.name
      header_file.write(output_header)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8") as footer_file:
      footer_path = footer_file.name
      footer_file.write(output_footer)
    
    pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name

    html2pdf(info_view["titulo"], html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    return FileResponse(
        pdf_path, 
        media_type='application/pdf',
        headers=headers,
        filename='relacion-ingresos-empresas.pdf',
        background=background_tasks
      )

  except Exception as e:
    return JSONResponse(content={"message": f"Ocurrió un error inesperado: {str(e)}"}, status_code=500)
  finally:
    db.close()