from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.estados import Estados
from models.vehiculos import Vehiculos
from models.propietarios import Propietarios
from models.conductores import Conductores
from models.infoempresas import InfoEmpresas
from schemas.reports import *
from fastapi.encoders import jsonable_encoder
from utils.reports import *
from datetime import datetime
import pytz

from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
import jinja2
from utils.pdf import html2pdf
import os
import tempfile

templateJinja = Jinja2Templates(directory="templates")

statevehiclefleetReports_router = APIRouter()

@statevehiclefleetReports_router.post('/estado-vehiculos-resumen/', response_class=FileResponse)
async def get_conteo_vehiculos_estados(info: userInfo):
  db = session()
  try:
    conteo_vehiculos_estados = db.query(Estados.CODIGO, Estados.NOMBRE, Vehiculos.NUMERO) \
    .join(Vehiculos, Estados.CODIGO == Vehiculos.ESTADO) \
    .all()
    vehiculos_estados_list = [{'codigo': vehiculo.CODIGO, 'nombre': vehiculo.NOMBRE, 'numero': vehiculo.NUMERO} for vehiculo in conteo_vehiculos_estados]
    data = fun_conteo_vehiculos_estados(vehiculos_estados_list)
    data = data.get("conteo_placas")
    # Datos de la fecha y hora actual
    # Define la zona horaria de Ciudad de Panamá
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")
    usuario = info.user
    titulo = 'Informe Por Estados General'

    # Inicializar el diccionario data_view con información común
    data_view = {
        "fecha": fecha,
        "hora": hora_actual
    }

    # Activos
    data_view["cant_activo"] = data.get("ACTIVOS", 0)
    data_view["cant_backup"] = data.get("BACUPK", 0)
    data_view["cant_activo_backup"] = data.get("ACTIVOS", 0) + data.get("BACUPK", 0)
    data_view["cant_chap_parado"] = data.get("CHAPISTERIA PARADO", 0)
    data_view["cant_chap_trabajando"] = data.get("CHAPISTERIA TRABAJANDO", 0)
    data_view["cant_custodia"] = data.get("CUSTODIA", 0)
    data_view["cant_detenido"] = data.get("DETENIDO", 0)
    data_view["cant_esp_operador"] = data.get("ESPERANDO OPERADOR", 0)
    data_view["cant_mecanica_mantenimiento"] = data.get("MECANICA MANTENIMIENTO", 0)
    data_view["cant_mecanica_parado"] = data.get("MECANICA PARADOS", 0)
    data_view["cant_otros"] = data.get("OTROS", 0)
    data_view["cant_vehiculos_pendientes_arraijan"] = data.get("VEHICULOS PENDIENTES ARRAIJAN", 0)
    data_view["cant_carro_preparacion"] = data.get("CARRO EN PREPARACION", 0)
    # Otros Estados
    data_view["cant_traspasados"] = data.get("» CARROS TRASPASADOS", 0)
    data_view["cant_fin_contrato"] = data.get("» CULMINACION DE CONTRATO", 0)
    data_view["cant_en_tramite"] = data.get("» EN TRAMITE", 0)
    data_view["cant_fuera_circulacion"] = data.get("» Fuera de Circulacion", 0)
    data_view["cant_inactivos"] = data.get("» INACTIVOS", 0)
    data_view["cant_perdida_total"] = data.get("» PERDIDA TOTAL", 0)
    data_view["cant_retirado_empresa"] = data.get("» RETIRADO DE LA EMPRESA", 0)
    data_view["cant_sin_calificar"] = data.get("» SIN CLASIFICAR", 0)
    data_view["cant_vendidos"] = data.get("» VENDIDO", 0)
    data_view["cant_para_venta"] = data.get("» Vehiculos Para la Venta", 0)
    # Totales

    data_view["total_activos"] = data.get("ACTIVOS", 0) + data.get("BACUPK", 0) + data.get("CHAPISTERIA PARADO", 0) + data.get("CHAPISTERIA TRABAJANDO", 0) + data.get("CUSTODIA", 0) + data.get("DETENIDO", 0) + data.get("ESPERANDO OPERADOR", 0) + data.get("MECANICA MANTENIMIENTO", 0) + data.get("MECANICA PARADOS", 0) + data.get("OTROS", 0) + data.get("VEHICULOS PENDIENTES ARRAIJAN", 0) + data.get("CARRO EN PREPARACION", 0)

    data_view["total_parados"] = data.get("» CARROS TRASPASADOS", 0) + data.get("» CULMINACION DE CONTRATO", 0) + data.get("» EN TRAMITE", 0) + data.get("» Fuera de Circulacion", 0) + data.get("» INACTIVOS", 0) + data.get("» PERDIDA TOTAL", 0) + data.get("» RETIRADO DE LA EMPRESA", 0) + data.get("» SIN CLASIFICAR", 0) + data.get("» VENDIDO", 0) + data.get("» Vehiculos Para la Venta", 0)

    data_view["total_vehiculos"] = data_view["total_activos"] + data_view["total_parados"]

    data_view["promedio_activos"] = round((data_view["cant_activo_backup"] / data_view["total_activos"] * 100), 2)

    data_view["promedio_parados"] = round((100 - data_view["promedio_activos"]), 2)

    headers = {
        "Content-Disposition": "attachment; estado-vehiculos-resumen.pdf"
    }  

    data_view["usuario"] = usuario

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "form1.html"
    header_file = "header1.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data_view) 
    output_header = header.render(data_view)
    output_footer = footer.render(data_view)

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
    pdf_path = 'estado-vehiculos-resumen.pdf'
    html2pdf(titulo,html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    response =  FileResponse(pdf_path, media_type='application/pdf', filename='templates/estado-vehiculos-resumen.pdf', headers=headers)
    #response = JSONResponse(content=jsonable_encoder(data))

    return response
  finally:
    db.close()

#-----------------------------------------------------------------------------------------

@statevehiclefleetReports_router.post('/estado-vehiculos-resumen-empresa/{id}/{company_code}/', response_class=FileResponse)
async def get_conteo_propietarios_vehiculos_estados(id: str, company_code: str, info: userInfo):
    db = session()
    try:
        conteo_propietarios_vehiculos_estados = db.query(
            Propietarios.EMPRESA.label('empresa_codigo'),
            Propietarios.CODIGO.label('propietario_codigo'), 
            Propietarios.NOMBRE.label('propietario_nombre'),
            Estados.CODIGO.label('estado_codigo'),
            Estados.NOMBRE.label('estado_nombre'), 
            Vehiculos.NUMERO.label('vehiculo_numero')
        ) \
        .join(Vehiculos, Estados.CODIGO == Vehiculos.ESTADO) \
        .join(Propietarios, Vehiculos.PROPI_IDEN == Propietarios.CODIGO) \
        .filter(Propietarios.CODIGO == id) \
        .filter(Propietarios.EMPRESA == company_code) \
        .filter(Vehiculos.EMPRESA == company_code) \
        .filter(Estados.EMPRESA == company_code) \
        .distinct() \
        .all()

        id_empresa = conteo_propietarios_vehiculos_estados[0].empresa_codigo

        vehiculos_estados_propietarios_list = [] 
        for resultado in conteo_propietarios_vehiculos_estados:
            propietarios_vehiculos_estados = {
                'propietario_codigo': resultado.propietario_codigo,
                'propietario_nombre': resultado.propietario_nombre,
                'estado_codigo': resultado.estado_codigo,
                'estado_nombre': resultado.estado_nombre,
                'vehiculo_numero': resultado.vehiculo_numero
            }
            vehiculos_estados_propietarios_list.append(propietarios_vehiculos_estados)

        data = obtener_conteo_por_propietario(vehiculos_estados_propietarios_list)
        data = data.get("conteo_por_empresa")
        data = data.get(str(id))  # Usa el id directamente

        # print(data)

        info_empresa = db.query(
            InfoEmpresas.NOMBRE, 
            InfoEmpresas.NIT,
            InfoEmpresas.LOGO
        ) \
        .filter(InfoEmpresas.ID == id_empresa) \
        .first()

        # Datos de la fecha y hora actual
        # Define la zona horaria de Ciudad de Panamá
        panama_timezone = pytz.timezone('America/Panama')
        # Obtén la hora actual en la zona horaria de Ciudad de Panamá
        now_in_panama = datetime.now(panama_timezone)
        # Formatea la fecha y la hora según lo requerido
        fecha = now_in_panama.strftime("%d/%m/%Y")
        hora_actual = now_in_panama.strftime("%I:%M:%S %p")
        usuario = info.user
        titulo = 'Informe Por Estados General'

        # Inicializar el diccionario data_view con información común
        data_view = {
            "fecha": fecha,
            "hora": hora_actual,
            "nombre_empresa": info_empresa.NOMBRE,
            "nit_empresa": info_empresa.NIT,
            "logo_empresa": info_empresa.LOGO,
            "codigo_empresa": id
        }
        
        data_view["empresa"] = data.get("nombre_empresa", 0)
        data_view["cant_activo"] = data.get("ACTIVOS", 0)
        data_view["cant_backup"] = data.get("BACUPK", 0)
        data_view["cant_activo_backup"] = data.get("ACTIVOS", 0) + data.get("BACUPK", 0)
        data_view["cant_chap_parado"] = data.get("CHAPISTERIA PARADO", 0)
        data_view["cant_chap_trabajando"] = data.get("CHAPISTERIA TRABAJANDO", 0)
        data_view["cant_custodia"] = data.get("CUSTODIA", 0)
        data_view["cant_detenido"] = data.get("DETENIDO", 0)
        data_view["cant_esp_operador"] = data.get("ESPERANDO OPERADOR", 0)
        data_view["cant_mecanica_mantenimiento"] = data.get("MECANICA MANTENIMIENTO", 0)
        data_view["cant_mecanica_parado"] = data.get("MECANICA PARADOS", 0)
        data_view["cant_otros"] = data.get("OTROS", 0)
        data_view["cant_vehiculos_pendientes_arraijan"] = data.get("VEHICULOS PENDIENTES ARRAIJAN", 0)
        data_view["cant_carro_preparacion"] = data.get("CARRO EN PREPARACION", 0)
        data_view["cant_traspasados"] = data.get("» CARROS TRASPASADOS", 0)
        data_view["cant_fin_contrato"] = data.get("» CULMINACION DE CONTRATO", 0)
        data_view["cant_en_tramite"] = data.get("» EN TRAMITE", 0)
        data_view["cant_fuera_circulacion"] = data.get("» Fuera de Circulacion", 0)
        data_view["cant_inactivos"] = data.get("» INACTIVOS", 0)
        data_view["cant_perdida_total"] = data.get("» PERDIDA TOTAL", 0)
        data_view["cant_retirado_empresa"] = data.get("» RETIRADO DE LA EMPRESA", 0)
        data_view["cant_sin_calificar"] = data.get("» SIN CLASIFICAR", 0)
        data_view["cant_vendidos"] = data.get("» VENDIDO", 0)
        data_view["cant_para_venta"] = data.get("» Vehiculos Para la Venta", 0)
        data_view["total_activos"] = data.get("ACTIVOS", 0) + data.get("BACUPK", 0) + data.get("CHAPISTERIA PARADO", 0) + data.get("CHAPISTERIA TRABAJANDO", 0) + data.get("CUSTODIA", 0) + data.get("DETENIDO", 0) + data.get("ESPERANDO OPERADOR", 0) + data.get("MECANICA MANTENIMIENTO", 0) + data.get("MECANICA PARADOS", 0) + data.get("OTROS", 0) + data.get("VEHICULOS PENDIENTES ARRAIJAN", 0) + data.get("CARRO EN PREPARACION", 0)
        data_view["total_parados"] = data.get("» CARROS TRASPASADOS", 0) + data.get("» CULMINACION DE CONTRATO", 0) + data.get("» EN TRAMITE", 0) + data.get("» Fuera de Circulacion", 0) + data.get("» INACTIVOS", 0) + data.get("» PERDIDA TOTAL", 0) + data.get("» RETIRADO DE LA EMPRESA", 0) + data.get("» SIN CLASIFICAR", 0) + data.get("» VENDIDO", 0) + data.get("» Vehiculos Para la Venta", 0)
        data_view["total_vehiculos"] = data_view["total_activos"] + data_view["total_parados"]
        if data_view["total_activos"] == 0:
            data_view["promedio_activos"] = 0
        else:
           data_view["promedio_activos"] = round((data_view["cant_activo_backup"] / data_view["total_activos"] * 100), 2)
        data_view["promedio_parados"] = round((100 - data_view["promedio_activos"]), 2) 

        titulo = 'Informe Por Estados General'

        data_view["usuario"] = usuario

        headers = {
            "Content-Disposition": "attachment; estado-vehiculos-resumen-empresa.pdf"
        }  

        template_loader = jinja2.FileSystemLoader(searchpath="./templates")
        template_env = jinja2.Environment(loader=template_loader)
        template_file = "form1.html"
        header_file = "header2.html"
        footer_file = "footer1.html"
        template = template_env.get_template(template_file)
        header = template_env.get_template(header_file)
        footer = template_env.get_template(footer_file)
        output_text = template.render(data_view) 
        output_header = header.render(data_view)
        output_footer = footer.render(data_view)

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
            pdf_path, media_type='application/pdf', 
            filename='templates/estado-vehiculos-resumen-empresa.pdf', 
            headers=headers,
            background=background_tasks
        )

        return response
    finally:
        db.close()
#-----------------------------------------------------------------------------------------


@statevehiclefleetReports_router.post('/informe-estados-detallado/', response_class=FileResponse)
async def get_conteo_vehiculos_estados_numeros(info: userInfo):
  db = session()
  try:
    conteo_propietarios_vehiculos_estados = db.query(
        Estados.CODIGO.label('estado_codigo'),
        Estados.NOMBRE.label('estado_nombre'),
        Vehiculos.NUMERO.label('vehiculo_numero')
    ).join(Vehiculos, Estados.CODIGO == Vehiculos.ESTADO).all()

    vehiculos_estados_list = []
    for resultado in conteo_propietarios_vehiculos_estados:
        vehiculos_estados = {
            'estado_codigo': resultado.estado_codigo,
            'estado_nombre': resultado.estado_nombre,
            'vehiculo_numero': resultado.vehiculo_numero
        }
        vehiculos_estados_list.append(vehiculos_estados)
    data = obtener_numeros_por_estado(vehiculos_estados_list)
    data = data.get("numeros_por_estado")
    # Datos de la fecha y hora actual
    # Define la zona horaria de Ciudad de Panamá
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")

    # Inicializar el diccionario data_view con información común
    data_view = {
        "fecha": fecha,
        "hora": hora_actual
    }

    # Ordenar las listas de vehículos por número de unidad antes de asignarlas
    # Activos
    activos_ordenados = sorted(data.get("ACTIVOS", []))
    backup_ordenados = sorted(data.get("BACUPK", []))
    chap_parado_ordenados = sorted(data.get("CHAPISTERIA PARADO", []))
    chap_trabajando_ordenados = sorted(data.get("CHAPISTERIA TRABAJANDO", []))
    custodia_ordenados = sorted(data.get("CUSTODIA", []))
    detenido_ordenados = sorted(data.get("DETENIDO", []))
    esp_operador_ordenados = sorted(data.get("ESPERANDO OPERADOR", []))
    mecanica_mantenimiento_ordenados = sorted(data.get("MECANICA MANTENIMIENTO", []))
    mecanica_parado_ordenados = sorted(data.get("MECANICA PARADOS", []))
    otros_ordenados = sorted(data.get("OTROS", []))
    vehiculos_pendientes_arraijan_ordenados = sorted(data.get("VEHICULOS PENDIENTES ARRAIJAN", []))
    vehiculos_preparacion_ordenados = sorted(data.get("CARRO EN PREPARACION", []))
    
    # Otros Estados
    traspasados_ordenados = sorted(data.get("» CARROS TRASPASADOS", []))
    fin_contrato_ordenados = sorted(data.get("» CULMINACION DE CONTRATO", []))
    en_tramite_ordenados = sorted(data.get("» EN TRAMITE", []))
    fuera_circulacion_ordenados = sorted(data.get("» Fuera de Circulacion", []))
    inactivos_ordenados = sorted(data.get("» INACTIVOS", []))
    perdida_total_ordenados = sorted(data.get("» PERDIDA TOTAL", []))
    retirado_empresa_ordenados = sorted(data.get("» RETIRADO DE LA EMPRESA", []))
    sin_calificar_ordenados = sorted(data.get("» SIN CLASIFICAR", []))
    vendidos_ordenados = sorted(data.get("» VENDIDO", []))
    para_venta_ordenados = sorted(data.get("» Vehiculos Para la Venta", []))

    # Asignar las listas ordenadas al diccionario data_view
    data_view["cant_activo"] = len(activos_ordenados)
    data_view["activos"] = activos_ordenados
    data_view["cant_backup"] = len(backup_ordenados)
    data_view["backup"] = backup_ordenados
    data_view["cant_activo_backup"] = len(activos_ordenados) + len(backup_ordenados)
    data_view["cant_chap_parado"] = len(chap_parado_ordenados)
    data_view["chap_parado"] = chap_parado_ordenados
    data_view["cant_chap_trabajando"] = len(chap_trabajando_ordenados)
    data_view["chap_trabajando"] = chap_trabajando_ordenados
    data_view["cant_custodia"] = len(custodia_ordenados)
    data_view["custodia"] = custodia_ordenados
    data_view["cant_detenido"] = len(detenido_ordenados)
    data_view["detenido"] = detenido_ordenados
    data_view["cant_esp_operador"] = len(esp_operador_ordenados)
    data_view["esp_operador"] = esp_operador_ordenados
    data_view["cant_mecanica_mantenimiento"] = len(mecanica_mantenimiento_ordenados)
    data_view["mecanica_mantenimiento"] = mecanica_mantenimiento_ordenados
    data_view["cant_mecanica_parado"] = len(mecanica_parado_ordenados)
    data_view["mecanica_parado"] = mecanica_parado_ordenados
    data_view["cant_otros"] = len(otros_ordenados)
    data_view["otros"] = otros_ordenados
    data_view["cant_vehiculos_pendientes_arraijan"] = len(vehiculos_pendientes_arraijan_ordenados)
    data_view["vehiculos_pendientes_arraijan"] = vehiculos_pendientes_arraijan_ordenados
    data_view["cant_carro_preparacion"] = len(vehiculos_preparacion_ordenados)
    data_view["carro_preparacion"] = vehiculos_preparacion_ordenados
    
    # Otros Estados
    data_view["cant_traspasados"] = len(traspasados_ordenados)
    data_view["traspasados"] = traspasados_ordenados
    data_view["cant_fin_contrato"] = len(fin_contrato_ordenados)
    data_view["fin_contrato"] = fin_contrato_ordenados
    data_view["cant_en_tramite"] = len(en_tramite_ordenados)
    data_view["en_tramite"] = en_tramite_ordenados
    data_view["cant_fuera_circulacion"] = len(fuera_circulacion_ordenados)
    data_view["fuera_circulacion"] = fuera_circulacion_ordenados
    data_view["cant_inactivos"] = len(inactivos_ordenados)
    data_view["inactivos"] = inactivos_ordenados
    data_view["cant_perdida_total"] = len(perdida_total_ordenados)
    data_view["perdida_total"] = perdida_total_ordenados
    data_view["cant_retirado_empresa"] = len(retirado_empresa_ordenados)
    data_view["retirado_empresa"] = retirado_empresa_ordenados
    data_view["cant_sin_calificar"] = len(sin_calificar_ordenados)
    data_view["sin_calificar"] = sin_calificar_ordenados
    data_view["cant_vendidos"] = len(vendidos_ordenados)
    data_view["vendidos"] = vendidos_ordenados
    data_view["cant_para_venta"] = len(para_venta_ordenados)
    data_view["para_venta"] = para_venta_ordenados
    
    # Totales
    data_view["total_activos"] = len(activos_ordenados) + len(backup_ordenados) + len(chap_parado_ordenados) + len(chap_trabajando_ordenados) + len(custodia_ordenados) + len(detenido_ordenados) + len(esp_operador_ordenados) + len(mecanica_mantenimiento_ordenados) + len(mecanica_parado_ordenados) + len(otros_ordenados) + len(vehiculos_pendientes_arraijan_ordenados) + len(vehiculos_preparacion_ordenados)

    data_view["total_parados"] = len(traspasados_ordenados) + len(fin_contrato_ordenados) + len(en_tramite_ordenados) + len(fuera_circulacion_ordenados) + len(inactivos_ordenados) + len(perdida_total_ordenados) + len(retirado_empresa_ordenados) + len(sin_calificar_ordenados) + len(vendidos_ordenados) + len(para_venta_ordenados)

    data_view["total_vehiculos"] = data_view["total_activos"] + data_view["total_parados"]

    if data_view["total_activos"] == 0:
            data_view["promedio_activos"] = 0
    else:
        data_view["promedio_activos"] = round((data_view["cant_activo_backup"] / data_view["total_activos"] * 100), 2)
    data_view["promedio_parados"] = round((100 - data_view["promedio_activos"]), 2)

    headers = {
        "Content-Disposition": "attachment; estado-vehiculos-numeros.pdf"
    }  

    titulo = 'Informe Por Estados Detallado'
    usuario = info.user

    data_view["usuario"] = usuario

    headers = {
        "Content-Disposition": "attachment; informe-estados-detallado.pdf"
    }  

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "form2.html"
    header_file = "header1.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data_view) 
    output_header = header.render(data_view)
    output_footer = footer.render(data_view)

    html_path = f'./templates/renderform2.html'
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
    pdf_path = 'informe-estados-detallado.pdf'
    html2pdf(titulo,html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    response =  FileResponse(pdf_path, media_type='application/pdf', filename='templates/informe-estados-detallado.pdf', headers=headers)

    return response
    #return JSONResponse(content=jsonable_encoder(data))
  finally:
    db.close()

# -----------------------------------------------------------------------------------------

@statevehiclefleetReports_router.post('/informe-estados-detallado-empresa/{id}/{company_code}/', response_class=FileResponse)
async def get_conteo_propietarios_vehiculos_estados_numeros(id: str, company_code: str, info: userInfo):
  db = session()
  try:
    conteo_propietarios_vehiculos_estados = db.query(
        Propietarios.EMPRESA.label('empresa_codigo'),
        Propietarios.CODIGO.label('propietario_codigo'),
        Propietarios.NOMBRE.label('propietario_nombre'),
        Estados.CODIGO.label('estado_codigo'),
        Estados.NOMBRE.label('estado_nombre'),
        Vehiculos.NUMERO.label('vehiculo_numero')
    ).join(Vehiculos, Estados.CODIGO == Vehiculos.ESTADO).join(Propietarios, Vehiculos.PROPI_IDEN == Propietarios.CODIGO).filter(Propietarios.CODIGO == id).filter(Propietarios.EMPRESA == company_code) \
    .filter(Vehiculos.EMPRESA == company_code) \
    .filter(Estados.EMPRESA == company_code) \
    .distinct().all()

    id_empresa = conteo_propietarios_vehiculos_estados[0].empresa_codigo

    vehiculos_estados_propietarios_list = []
    for resultado in conteo_propietarios_vehiculos_estados:
        propietarios_vehiculos_estados = {
            'propietario_codigo': resultado.propietario_codigo,
            'propietario_nombre': resultado.propietario_nombre,
            'estado_codigo': resultado.estado_codigo,
            'estado_nombre': resultado.estado_nombre,
            'vehiculo_numero': resultado.vehiculo_numero
        }
        vehiculos_estados_propietarios_list.append(propietarios_vehiculos_estados)
    data = obtener_numeros_por_propietario(vehiculos_estados_propietarios_list)
    data = data.get("numeros_por_propietario")
    data = data.get(id.zfill(2))
    
    info_empresa = db.query(
        InfoEmpresas.NOMBRE,
        InfoEmpresas.NIT,
        InfoEmpresas.LOGO
    ).filter(InfoEmpresas.ID == id_empresa).first()

    # Datos de la fecha y hora actual
    # Define la zona horaria de Ciudad de Panamá
    panama_timezone = pytz.timezone('America/Panama')
    # Obtén la hora actual en la zona horaria de Ciudad de Panamá
    now_in_panama = datetime.now(panama_timezone)
    # Formatea la fecha y la hora según lo requerido
    fecha = now_in_panama.strftime("%d/%m/%Y")
    hora_actual = now_in_panama.strftime("%I:%M:%S %p")

    # Inicializar el diccionario data_view con información común
    data_view = {
        "fecha": fecha,
        "hora": hora_actual, 
        "nombre_empresa": info_empresa.NOMBRE,
        "nit_empresa": info_empresa.NIT,
        "logo_empresa": info_empresa.LOGO,
        "codigo_empresa": id
    }
    data_view["empresa"] = data.get("nombre_empresa", 0)

    # Ordenar las listas de vehículos por número de unidad antes de asignarlas
    # Activos
    activos_ordenados = sorted(data.get("ACTIVOS", []))
    backup_ordenados = sorted(data.get("BACUPK", []))
    chap_parado_ordenados = sorted(data.get("CHAPISTERIA PARADO", []))
    chap_trabajando_ordenados = sorted(data.get("CHAPISTERIA TRABAJANDO", []))
    custodia_ordenados = sorted(data.get("CUSTODIA", []))
    detenido_ordenados = sorted(data.get("DETENIDO", []))
    esp_operador_ordenados = sorted(data.get("ESPERANDO OPERADOR", []))
    mecanica_mantenimiento_ordenados = sorted(data.get("MECANICA MANTENIMIENTO", []))
    mecanica_parado_ordenados = sorted(data.get("MECANICA PARADOS", []))
    otros_ordenados = sorted(data.get("OTROS", []))
    vehiculos_pendientes_arraijan_ordenados = sorted(data.get("VEHICULOS PENDIENTES ARRAIJAN", []))
    vehiculos_preparacion_ordenados = sorted(data.get("CARRO EN PREPARACION", []))
    
    # Otros Estados
    traspasados_ordenados = sorted(data.get("» CARROS TRASPASADOS", []))
    fin_contrato_ordenados = sorted(data.get("» CULMINACION DE CONTRATO", []))
    en_tramite_ordenados = sorted(data.get("» EN TRAMITE", []))
    fuera_circulacion_ordenados = sorted(data.get("» Fuera de Circulacion", []))
    inactivos_ordenados = sorted(data.get("» INACTIVOS", []))
    perdida_total_ordenados = sorted(data.get("» PERDIDA TOTAL", []))
    retirado_empresa_ordenados = sorted(data.get("» RETIRADO DE LA EMPRESA", []))
    sin_calificar_ordenados = sorted(data.get("» SIN CLASIFICAR", []))
    vendidos_ordenados = sorted(data.get("» VENDIDO", []))
    para_venta_ordenados = sorted(data.get("» Vehiculos Para la Venta", []))
    
    # Asignar las listas ordenadas al diccionario data_view
    data_view["cant_activo"] = len(activos_ordenados)
    data_view["activos"] = activos_ordenados
    data_view["cant_backup"] = len(backup_ordenados)
    data_view["backup"] = backup_ordenados
    data_view["cant_activo_backup"] = len(activos_ordenados) + len(backup_ordenados)
    data_view["cant_chap_parado"] = len(chap_parado_ordenados)
    data_view["chap_parado"] = chap_parado_ordenados
    data_view["cant_chap_trabajando"] = len(chap_trabajando_ordenados)
    data_view["chap_trabajando"] = chap_trabajando_ordenados
    data_view["cant_custodia"] = len(custodia_ordenados)
    data_view["custodia"] = custodia_ordenados
    data_view["cant_detenido"] = len(detenido_ordenados)
    data_view["detenido"] = detenido_ordenados
    data_view["cant_esp_operador"] = len(esp_operador_ordenados)
    data_view["esp_operador"] = esp_operador_ordenados
    data_view["cant_mecanica_mantenimiento"] = len(mecanica_mantenimiento_ordenados)
    data_view["mecanica_mantenimiento"] = mecanica_mantenimiento_ordenados
    data_view["cant_mecanica_parado"] = len(mecanica_parado_ordenados)
    data_view["mecanica_parado"] = mecanica_parado_ordenados
    data_view["cant_otros"] = len(otros_ordenados)
    data_view["otros"] = otros_ordenados
    data_view["cant_vehiculos_pendientes_arraijan"] = len(vehiculos_pendientes_arraijan_ordenados)
    data_view["vehiculos_pendientes_arraijan"] = vehiculos_pendientes_arraijan_ordenados
    data_view["cant_carro_preparacion"] = len(vehiculos_preparacion_ordenados)
    data_view["carro_preparacion"] = vehiculos_preparacion_ordenados
    
    # Otros Estados
    data_view["cant_traspasados"] = len(traspasados_ordenados)
    data_view["traspasados"] = traspasados_ordenados
    data_view["cant_fin_contrato"] = len(fin_contrato_ordenados)
    data_view["fin_contrato"] = fin_contrato_ordenados
    data_view["cant_en_tramite"] = len(en_tramite_ordenados)
    data_view["en_tramite"] = en_tramite_ordenados
    data_view["cant_fuera_circulacion"] = len(fuera_circulacion_ordenados)
    data_view["fuera_circulacion"] = fuera_circulacion_ordenados
    data_view["cant_inactivos"] = len(inactivos_ordenados)
    data_view["inactivos"] = inactivos_ordenados
    data_view["cant_perdida_total"] = len(perdida_total_ordenados)
    data_view["perdida_total"] = perdida_total_ordenados
    data_view["cant_retirado_empresa"] = len(retirado_empresa_ordenados)
    data_view["retirado_empresa"] = retirado_empresa_ordenados
    data_view["cant_sin_calificar"] = len(sin_calificar_ordenados)
    data_view["sin_calificar"] = sin_calificar_ordenados
    data_view["cant_vendidos"] = len(vendidos_ordenados)
    data_view["vendidos"] = vendidos_ordenados
    data_view["cant_para_venta"] = len(para_venta_ordenados)
    data_view["para_venta"] = para_venta_ordenados
    
    # Totales
    data_view["total_activos"] = len(activos_ordenados) + len(backup_ordenados) + len(chap_parado_ordenados) + len(chap_trabajando_ordenados) + len(custodia_ordenados) + len(detenido_ordenados) + len(esp_operador_ordenados) + len(mecanica_mantenimiento_ordenados) + len(mecanica_parado_ordenados) + len(otros_ordenados) + len(vehiculos_pendientes_arraijan_ordenados) + len(vehiculos_preparacion_ordenados)

    data_view["total_parados"] = len(traspasados_ordenados) + len(fin_contrato_ordenados) + len(en_tramite_ordenados) + len(fuera_circulacion_ordenados) + len(inactivos_ordenados) + len(perdida_total_ordenados) + len(retirado_empresa_ordenados) + len(sin_calificar_ordenados) + len(vendidos_ordenados) + len(para_venta_ordenados)

    data_view["total_vehiculos"] = data_view["total_activos"] + data_view["total_parados"]

    if data_view["total_activos"] == 0:
            data_view["promedio_activos"] = 0
    else:
        data_view["promedio_activos"] = round((data_view["cant_activo_backup"] / data_view["total_activos"] * 100), 2)
    data_view["promedio_parados"] = round((100 - data_view["promedio_activos"]), 2)

    titulo = 'Informe Por Estados Detallado'
    usuario = info.user

    data_view["usuario"] = usuario

    headers = {
        "Content-Disposition": "attachment; informe-estados-detallado-empresa.pdf"
    }  

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "form2.html"
    header_file = "header2.html"
    footer_file = "footer1.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data_view) 
    output_header = header.render(data_view)
    output_footer = footer.render(data_view)

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

    html2pdf(titulo,html_path, pdf_path, header_path=header_path, footer_path=footer_path)

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    response =  FileResponse(
        pdf_path, 
        media_type='application/pdf', 
        filename='templates/informe-estados-detallado-empresa.pdf', 
        headers=headers,
        background=background_tasks
    )

    return response
    #return JSONResponse(content=jsonable_encoder(data))
  finally:
    db.close()

#-----------------------------------------------------------------------------------------

@statevehiclefleetReports_router.post('/relacion-vehiculos-propietario/', response_class=FileResponse)
async def get_vehiculos_detalles(infoReports: infoReports):
    db = session()
    try:
        vehiculos = db.query(
            Vehiculos.NUMERO,
            Vehiculos.PLACA, 
            Vehiculos.NOMMARCA,
            Vehiculos.MODELO,
            Vehiculos.LINEA,
            Vehiculos.NRO_CUPO,
            Vehiculos.MOTORNRO,
            Vehiculos.CHASISNRO,
            Vehiculos.ESTADO,
            Vehiculos.CONDUCTOR,
            Vehiculos.PROPI_IDEN
        ).filter(
            Vehiculos.ESTADO.in_(infoReports.estados),
            Vehiculos.PROPI_IDEN.in_(infoReports.empresas),
            Vehiculos.EMPRESA == infoReports.empresa
        ).all()
        
        estado_ids = list(set([v.ESTADO for v in vehiculos]))
        conductor_ids = list(set([v.CONDUCTOR for v in vehiculos]))
        propietario_ids = list(set([v.PROPI_IDEN for v in vehiculos]))
        
        estados_dict = {e.CODIGO: e.NOMBRE for e in db.query(Estados.CODIGO, Estados.NOMBRE).filter(Estados.CODIGO.in_(estado_ids), Estados.EMPRESA == infoReports.empresa).all()}
        
        conductores_dict = {c.CODIGO: {
            'nombre': c.NOMBRE,
            'cedula': c.CEDULA,
            'telefono': c.TELEFONO,
            'nro_entrega': c.NROENTREGA,
            'cuo_diaria': c.CUO_DIARIA,
            'nro_ent_sdo': c.NROENTSDO
        } for c in db.query(
            Conductores.CODIGO,
            Conductores.NOMBRE,
            Conductores.CEDULA,
            Conductores.TELEFONO,
            Conductores.NROENTREGA,
            Conductores.CUO_DIARIA,
            Conductores.NROENTSDO
        ).filter(Conductores.CODIGO.in_(conductor_ids), Conductores.EMPRESA == infoReports.empresa).all()}
        
        propietarios_dict = {p.CODIGO: p.NOMBRE for p in db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(Propietarios.CODIGO.in_(propietario_ids), Propietarios.EMPRESA == infoReports.empresa).all()}
        
        vehiculos_detalles_list = []
        for vehiculo in vehiculos:
            conductor_info = conductores_dict.get(vehiculo.CONDUCTOR, {})
            vehiculo_detalle = {
                'propietario_codigo': vehiculo.PROPI_IDEN,
                'propietario_nombre': propietarios_dict.get(vehiculo.PROPI_IDEN, ''),
                'estado_codigo': vehiculo.ESTADO,
                'estado_nombre': estados_dict.get(vehiculo.ESTADO, ''),
                'vehiculo_numero': vehiculo.NUMERO,
                'vehiculo_placa': vehiculo.PLACA,
                'vehiculo_marca': vehiculo.NOMMARCA,
                'vehiculo_modelo': vehiculo.MODELO,
                'vehiculo_linea': vehiculo.LINEA,
                'vehiculo_nro_cupo': vehiculo.NRO_CUPO,
                'vehiculo_motor': vehiculo.MOTORNRO,
                'vehiculo_chasis': vehiculo.CHASISNRO,
                'conductor_nro_entrega': conductor_info.get('nro_entrega', ''),
                'conductor_cuo_diaria': conductor_info.get('cuo_diaria', 0),
                'conductor_nro_ent_sdo': conductor_info.get('nro_ent_sdo', ''),
                'conductor_codigo': vehiculo.CONDUCTOR,
                'conductor_nombre': conductor_info.get('nombre', ''),
                'conductor_cedula': conductor_info.get('cedula', ''),
                'conductor_telefono': conductor_info.get('telefono', '')
            }
            vehiculos_detalles_list.append(vehiculo_detalle)

        codigos_estados_deseados = infoReports.estados

        data = obtener_conductores_por_propietario(vehiculos_detalles_list, codigos_estados_deseados)

        claves_deseadas = infoReports.empresas

        datos = {clave: data.get(clave, {}) for clave in claves_deseadas}

        # Datos de la fecha y hora actual
        # Define la zona horaria de Ciudad de Panamá
        panama_timezone = pytz.timezone('America/Panama')
        # Obtén la hora actual en la zona horaria de Ciudad de Panamá
        now_in_panama = datetime.now(panama_timezone)
        # Formatea la fecha y la hora según lo requerido
        fecha = now_in_panama.strftime("%d/%m/%Y")
        hora_actual = now_in_panama.strftime("%I:%M:%S %p")
        usuario = infoReports.usuario
        titulo = 'Relación Vehículos por Propietario'

        info_empresa = db.query(InfoEmpresas.NOMBRE, InfoEmpresas.NIT, InfoEmpresas.LOGO).filter(InfoEmpresas.ID == infoReports.empresa).first()

        data_view = {
            "fecha": fecha,
            "hora": hora_actual,
            "nombre_empresa": info_empresa.NOMBRE,
            "nit_empresa": info_empresa.NIT,
            "logo_empresa": info_empresa.LOGO,
        }

        # Iterar sobre las empresas y vehículos
        total = 0
        for empresa, info in datos.items():
            if isinstance(info, dict):
                # Agregar información de la empresa
                data_view[empresa] = {
                    "codigo_empresa": info.get("propietario_codigo", 0),
                    "nombre_empresa": info.get("propietario_nombre", 0),
                    "empty": info.get("empty", 0),
                    "estados": {}  # Aquí almacenaremos los vehículos organizados por estado
                }
                for estado, estado_info in info.get("estados", {}).items():
                    if isinstance(estado_info, dict):
                        data_view[empresa]["estados"][estado] = []  # Lista para almacenar vehículos por estado
                        consecutivo = 1
                        for vehiculo, vehiculo_info in estado_info.items():
                            if isinstance(vehiculo_info, dict):
                                # Agregar información del vehículo
                                data_view[empresa]["estados"][estado].append({
                                    "consecutivo": consecutivo,
                                    "unidad": vehiculo_info.get("vehiculo_numero", 0),
                                    "placa": vehiculo_info.get("vehiculo_placa", 0),
                                    "marca": vehiculo_info.get("vehiculo_marca", 0),
                                    "modelo": vehiculo_info.get("vehiculo_modelo", 0),
                                    "linea": vehiculo_info.get("vehiculo_linea", 0),
                                    "nro_cupo": vehiculo_info.get("vehiculo_nro_cupo", 0),
                                    "motor": vehiculo_info.get("vehiculo_motor", 0),
                                    "chasis": vehiculo_info.get("vehiculo_chasis", 0),
                                    "nro_entrega": vehiculo_info.get("conductor_nro_entrega", 0),
                                    "cuota_diaria": vehiculo_info.get("conductor_cuo_diaria", 0),
                                    "nro_ent_sdo": vehiculo_info.get("conductor_nro_ent_sdo", 0),
                                    "codigo_conductor": vehiculo_info.get("conductor_codigo", 0),
                                    "nombre": vehiculo_info.get("conductor_nombre", 0),
                                    "cedula": vehiculo_info.get("conductor_cedula", 0),
                                    "telefono": vehiculo_info.get("conductor_telefono", 0),
                                })
                                consecutivo += 1
                                total += 1
                                
        data_view["total"] = total
        data_view["usuario"] = usuario

        headers = {
            "Content-Disposition": "attachment; relacion-vehiculos-propietario.pdf"
        }  

        template_loader = jinja2.FileSystemLoader(searchpath="./templates")
        template_env = jinja2.Environment(loader=template_loader)
        template_file = "RelacionVehiculos.html"
        header_file = "header2.html"
        footer_file = "footer1.html"
        template = template_env.get_template(template_file)
        header = template_env.get_template(header_file)
        footer = template_env.get_template(footer_file)
        output_text = template.render(data_view=data_view)
        output_header = header.render(data_view)
        output_footer = footer.render(data_view)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as html_file:
            html_path = html_file.name
            html_file.write(output_text)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as header_file:
            header_path = header_file.name
            header_file.write(output_header)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.html', mode='w') as footer_file:
            footer_path = footer_file.name
            footer_file.write(output_footer)
        pdf_path = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf').name

        html2pdf(titulo, html_path, pdf_path, header_path=header_path, footer_path=footer_path)

        background_tasks = BackgroundTasks()
        background_tasks.add_task(os.remove, html_path)
        background_tasks.add_task(os.remove, header_path)
        background_tasks.add_task(os.remove, footer_path)
        background_tasks.add_task(os.remove, pdf_path)

        response = FileResponse(
            pdf_path, media_type='application/pdf', 
            filename='templates/relacion-vehiculos-propietario.pdf', 
            headers=headers,
            background=background_tasks
        ) 
        
        return response
    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
    finally:
        db.close()

#-----------------------------------------------------------------------------------------