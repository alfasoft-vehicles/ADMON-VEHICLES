from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.infoempresas import InfoEmpresas
from config.dbconnection import session
from models.movimien import Movimien
from models.movienca import Movienca
from models.propietarios import Propietarios
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

templateJinja = Jinja2Templates(directory="templates")

partsrelationshipReports_router = APIRouter()

@partsrelationshipReports_router.post("/partsrelationship/{company_code}/", response_class=FileResponse, tags=["Reports"])
async def partsrelationship_report(company_code: str, data: PartsRelationshipReport):
  db = session()
  try:
    if data.primeraFecha > data.ultimaFecha:
      return JSONResponse(content={"error": "La primera fecha no puede ser mayor a la última fecha"}, status_code=400)

    if data.unidad == "" or data.unidad == "TODOS":
      empresa = data.empresa

      conteo_reporte_piezas = db.query(
        Propietarios.EMPRESA.label('codigo_empresa'),
        Movimien.CODIGO.label('codigo'),
        Movimien.NOMBRE.label('nombre'),
        Movimien.PRESENTA.label('presenta'),
        Movimien.PEDIDA.label('pedida'),
        Movimien.DCTO_VALOR.label('dcto_valor'),
        Movimien.IVA_VALOR.label('iva_valor'),
        Movimien.TOTAL.label('total'),
        Movimien.FACTURA.label('factura'),
        Movimien.TIPNOM.label('tipnom'),
        Movimien.UNIDAD.label('unidad'),
        Movimien.FECHA.label('fecha'),
        Propietarios.NOMBRE.label('propietario'),
        Movienca.ORIGEN.label('origen'),
        Movimien.VALOR.label('valor'),
      ) \
      .join(Movienca, (Movimien.FACTURA == Movienca.FACTURA) & 
                      (Movimien.TIPO == Movienca.TIPO)) \
      .join(Propietarios, Propietarios.CODIGO == Movimien.PROPI_IDEN) \
      .filter(
        Movimien.FECHA >= data.primeraFecha,
        Movimien.FECHA <= data.ultimaFecha,
        Movimien.PROPI_IDEN == empresa,
        Movimien.TIPO == '022',
        Movimien.EMPRESA == company_code,
        Propietarios.EMPRESA == company_code,
        Movienca.EMPRESA == company_code
      ) \
      .group_by(
        Movimien.FACTURA,
        Movimien.FECHA,
        Movimien.TIPNOM,
        Movimien.UNIDAD,
        Propietarios.NOMBRE,
        Movienca.ORIGEN,
        Movimien.CODIGO,
        Movimien.NOMBRE,
        Movimien.PRESENTA,
        Movimien.PEDIDA,
        Movimien.VALOR,
        Movimien.DCTO_VALOR,
        Movimien.IVA_VALOR,
        Movimien.TOTAL
      ).all()

    elif data.unidad != "" and data.unidad != "TODOS":
      # empresa = db.query(Propietarios.CODIGO).filter(Propietarios.NOMBRE == data.empresa).all()
      empresa = data.empresa
      conteo_reporte_piezas = db.query(
        Propietarios.EMPRESA.label('codigo_empresa'),
        Movimien.CODIGO.label('codigo'),
        Movimien.NOMBRE.label('nombre'),
        Movimien.PRESENTA.label('presenta'),
        Movimien.PEDIDA.label('pedida'),
        Movimien.DCTO_VALOR.label('dcto_valor'),
        Movimien.IVA_VALOR.label('iva_valor'),
        Movimien.TOTAL.label('total'),
        Movimien.FACTURA.label('factura'),
        Movimien.TIPNOM.label('tipnom'),
        Movimien.UNIDAD.label('unidad'),
        Movimien.FECHA.label('fecha'),
        Propietarios.NOMBRE.label('propietario'),
        Movienca.ORIGEN.label('origen'),
        Movimien.VALOR.label('valor'),
      ) \
      .join(Movienca, (Movimien.FACTURA == Movienca.FACTURA) & 
                      (Movimien.TIPO == Movienca.TIPO)) \
      .join(Propietarios, Propietarios.CODIGO == Movimien.PROPI_IDEN) \
      .filter(
        Movimien.FECHA >= data.primeraFecha,
        Movimien.FECHA <= data.ultimaFecha,
        Movimien.UNIDAD == data.unidad,
        Movimien.PROPI_IDEN == empresa,
        Movimien.TIPO == '022',
        Movimien.EMPRESA == company_code,
        Propietarios.EMPRESA == company_code,
        Movienca.EMPRESA == company_code
      ) \
      .group_by(
        Movimien.FACTURA,
        Movimien.FECHA,
        Movimien.TIPNOM,
        Movimien.UNIDAD,
        Propietarios.NOMBRE,
        Movienca.ORIGEN,
        Movimien.CODIGO,
        Movimien.NOMBRE,
        Movimien.PRESENTA,
        Movimien.PEDIDA,
        Movimien.VALOR,
        Movimien.DCTO_VALOR,
        Movimien.IVA_VALOR,
        Movimien.TOTAL
      ).all()

    if len(conteo_reporte_piezas) == 0:
      return JSONResponse(content={"error": "No se encontraron registros"}, status_code=400)
    
    id_empresa = conteo_reporte_piezas[0].codigo_empresa
  
    # After query execution
    data_view_temp = {}
    for item in conteo_reporte_piezas:
      factura = item.factura
      
      # Initialize factura entry if doesn't exist
      if factura not in data_view_temp:
        data_view_temp[factura] = {
          'UNIDAD': item.unidad,
          'PROPIETARIOS': item.propietario,
          'ORIGEN': 'Arreglo Pago' if item.origen == 1 else 'Garantia' if item.origen == 2 else 'Contado' if item.origen == 3 else 'Preparación' if item.origen == 4 else 'Contrato Viejo' if item.origen == 5 else item.origen,
          'TIPO': 'OTra',
          'FECHA': item.fecha,
          'MOVIMIENTOS': []
        }
      
      if item.pedida != 0:
        # Add movement data
        data_view_temp[factura]['MOVIMIENTOS'].append({
          'CODIGO': item.codigo,
          'NOMBRE': item.nombre,
          'PRESENTA': item.presenta,
          'PEDIDA': item.pedida,
          'VALOR_UNIDAD': round(item.valor, 2),
          'VALOR': round(item.valor * item.pedida, 2),
          'DCTO_VALOR': item.dcto_valor,
          'IVA_VALOR': item.iva_valor,
          'TOTAL': item.total
        })

    if len(data_view_temp) == 0:
      return JSONResponse(content={"error": "No se encontraron registros"}, status_code=400)
    
    # Ordenar facturas por número de unidad
    facturas_ordenadas = sorted(data_view_temp.items(), key=lambda x: x[0])
    
    # Reconstruir el diccionario ordenado
    data_view = {}
    for factura, datos in facturas_ordenadas:
        data_view[factura] = datos
    
    # Calculate totals
    total_cantidad = 0
    total_vlrparcial = 0
    total_descuento= 0
    total_impuesto = 0
    total_valorneto = 0

    for factura in data_view:
      total_cantidad_unidad = 0
      total_vlrparcial_unidad = 0
      total_descuento_unidad = 0
      total_impuesto_unidad = 0
      total_valorneto_unidad = 0
      for movimiento in data_view[factura]['MOVIMIENTOS']:
        total_cantidad_unidad += movimiento['PEDIDA']
        total_vlrparcial_unidad += movimiento['VALOR']
        total_descuento_unidad += movimiento['DCTO_VALOR']
        total_impuesto_unidad += movimiento['IVA_VALOR']
        total_valorneto_unidad += movimiento['TOTAL']
      data_view[factura]['TOTAL_CANTIDAD_UNIDAD'] = total_cantidad_unidad
      data_view[factura]['TOTAL_VLRPARCIAL_UNIDAD'] = total_vlrparcial_unidad
      data_view[factura]['TOTAL_DESCUENTO_UNIDAD'] = total_descuento_unidad
      data_view[factura]['TOTAL_IMPUESTO_UNIDAD'] = total_impuesto_unidad
      data_view[factura]['TOTAL_VALORNETO_UNIDAD'] = total_valorneto_unidad

      total_cantidad += total_cantidad_unidad
      total_vlrparcial += total_vlrparcial_unidad
      total_descuento += total_descuento_unidad
      total_impuesto += total_impuesto_unidad
      total_valorneto += total_valorneto_unidad
    
    data_view['TOTAL_CANTIDAD'] = total_cantidad
    data_view['TOTAL_VLRPARCIAL'] = total_vlrparcial
    data_view['TOTAL_DESCUENTO'] = total_descuento
    data_view['TOTAL_IMPUESTO'] = total_impuesto
    data_view['TOTAL_VALORNETO'] = total_valorneto
    data_view['FECHA_INICIO'] = data.primeraFecha
    data_view['FECHA_FIN'] = data.ultimaFecha

    # Get current date
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    usuario = data.usuario
    titulo = 'Detalle Órdenes de Trabajo'

    info_empresa = db.query(
      InfoEmpresas.NOMBRE,
      InfoEmpresas.NIT,
      InfoEmpresas.LOGO
    ).filter(InfoEmpresas.ID == id_empresa).first()

    info_view = {
      'usuario': usuario,
      'fecha': fecha,
      'hora': hora_actual,
      "nombre_empresa": info_empresa.NOMBRE,
      "nit_empresa": info_empresa.NIT,
      "logo_empresa": info_empresa.LOGO,
      'data': data_view
    }

    headers = {
      "Content-Disposition": "attachment; relacion-piezas.pdf"
    }  

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "RelacionPiezas.html"
    header_file = "header2.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(info_view) 
    output_header = header.render(info_view)
    output_footer = footer.render(info_view)

    html_path = f'./templates/renderform1.html'
    header_path = f'./templates/renderheader1.html'
    footer_path = f'./templates/renderfooter1.html'
    html_file = open(html_path, 'w')
    header_file = open(header_path, 'w')
    html_footer = open(footer_path, 'w')
    html_file.write(output_text)
    header_file.write(output_header)
    html_footer.write(output_footer)
    html_file.close()
    header_file.close()
    html_footer.close()
    pdf_path = 'relacion-piezas.pdf'
    html2pdf(titulo,html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    response = FileResponse(pdf_path, media_type='application/pdf', filename='templates/relacion-piezas.pdf', headers=headers)

    return response
  finally:
    db.close()
