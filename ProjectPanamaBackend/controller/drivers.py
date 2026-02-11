from fastapi import BackgroundTasks
from fastapi.responses import JSONResponse
from config.dbconnection import session
from sqlalchemy.orm import aliased
from models.conductores import Conductores
from models.ciudades import Ciudades
from models.vehiculos import Vehiculos
from models.cajarecaudos import CajaRecaudos
from models.cajarecaudoscontado import CajasRecaudosContado
from models.cartera import Cartera
from models.movienca import Movienca
from models.permisosusuario import PermisosUsuario
from schemas.drivers import *
from middlewares.JWTBearer import JWTBearer
from fastapi.encoders import jsonable_encoder
from utils.reports import *
from datetime import datetime

import pytz
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
import jinja2
from utils.pdf import html2pdf
import tempfile
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

PDF_THREAD_POOL = ThreadPoolExecutor(max_workers=2)

async def drivers(company_code: str):
  db = session()
  try:
    drivers = db.query(Conductores.CODIGO, Conductores.NOMBRE).filter(Conductores.EMPRESA == company_code).all()

    drivers_list = [
      {
        'codigo': driver.CODIGO,
        'nombre': driver.NOMBRE,
      }
      for driver in drivers
    ]
    return JSONResponse(content=jsonable_encoder(drivers_list))
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def drivers_all(company_code: str):
  db = session()
  try:
    drivers = db.query(
      Conductores.CODIGO, 
      Conductores.UND_NRO, 
      Conductores.UND_PRE, 
      Conductores.NOMBRE, 
      Conductores.CEDULA, 
      Conductores.TELEFONO, 
      Conductores.FEC_INGRES, 
      Conductores.CUO_DIARIA, 
      Conductores.NROENTREGA, 
      Conductores.NROENTPAGO, 
      Conductores.NROENTSDO, 
      Conductores.LICEN_VCE, 
      Conductores.CONTACTO, 
      Conductores.TEL_CONTAC, 
      Conductores.PAR_CONTAC,
      Conductores.CONTACTO1, 
      Conductores.TEL_CONTA1, 
      Conductores.PAR_CONTA1
      ) \
    .filter(
      Conductores.EMPRESA == company_code
      ).all()

    drivers_list = [
      {
        'codigo': driver.CODIGO,
        'unidad': driver.UND_NRO + ' - ' + driver.UND_PRE,
        'nombre': (driver.NOMBRE or '' ).title(),
        'cedula': driver.CEDULA,
        'telefono': driver.TELEFONO,
        'fecha_ingreso': driver.FEC_INGRES,
        'cuota_diaria': driver.CUO_DIARIA,
        'nro_entrega': driver.NROENTREGA,
        'nro_pago': driver.NROENTPAGO,
        'nro_saldo': driver.NROENTSDO,
        'vce_licen': driver.LICEN_VCE,
        'contacto': (driver.CONTACTO + ' - ' + driver.TEL_CONTAC + ' - ' + driver.PAR_CONTAC).title(),
        'contacto1': (driver.CONTACTO1 + ' - ' + driver.TEL_CONTA1 + ' - ' + driver.PAR_CONTA1).title()
      }
      for driver in drivers
    ]
    return JSONResponse(content=jsonable_encoder(drivers_list))
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def drivers_data(company_code: str):
  db = session()
  try:
    drivers = db.query(Conductores.CODIGO, Conductores.UND_NRO, Conductores.NOMBRE,
                       Conductores.CEDULA, Vehiculos.PROPI_IDEN
                      ).outerjoin(
                        Vehiculos, Conductores.CODIGO == Vehiculos.CONDUCTOR
                      ).filter(
                        Conductores.EMPRESA == company_code, 
                        Conductores.CODIGO != ""
                      ).all()
    
    if not drivers:
      return JSONResponse(content={"message": "Drivers not found"}, status_code=404)

    result = []

    for driver in drivers:
      result.append({
        "codigo_conductor": driver.CODIGO,
        "numero_unidad": driver.UND_NRO,
        "nombre_conductor": driver.NOMBRE,
        "cedula": driver.CEDULA,
        "codigo_propietario": driver.PROPI_IDEN or ""
      })

    return JSONResponse(content=jsonable_encoder(result), status_code=200)

  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def conductores_detalles(company_code: str, user_code: str):
  db = session()
  try:
    conductores_detalles = db.query(
      Conductores.ESTADO.label('conductor_estado'),
      Conductores.CODIGO.label('conductor_codigo'),
      Conductores.NOMBRE.label('conductor_nombre'),
      Conductores.CEDULA.label('conductor_cedula'),
      Ciudades.NOMBRE.label('conductor_ciudad'),
      Conductores.DIRECCION.label('conductor_direccion'),
      Conductores.TELEFONO.label('conductor_telefono'),
      Conductores.UND_NRO.label('conductor_und'),
      Conductores.UND_PRE.label('conductor_und_pre'),
    ).join(Ciudades, Conductores.CIUDAD == Ciudades.CODIGO
    ).filter(
      Conductores.EMPRESA == company_code,
      Conductores.UND_NRO != '',
      Conductores.UND_NRO != None
    ).all()
    
    # Convertir los resultados en un formato JSON
    conductores_detalles_list = []
    for resultado in conductores_detalles:
      conductor_detalle = {
        'conductor_estado': resultado.conductor_estado,
        'conductor_codigo': resultado.conductor_codigo,
        'conductor_nombre': resultado.conductor_nombre,
        'conductor_cedula': resultado.conductor_cedula,
        'conductor_ciudad': resultado.conductor_ciudad,
        'conductor_direccion': resultado.conductor_direccion,
        'conductor_telefono': resultado.conductor_telefono,
        'conductor_und': resultado.conductor_und,
        'conductor_und_pre': resultado.conductor_und_pre
      }
      conductores_detalles_list.append(conductor_detalle)

    data = agrupar_conductores_por_estado(conductores_detalles_list)

    user = db.query(PermisosUsuario).filter(PermisosUsuario.CODIGO == user_code).first()
    user = user.NOMBRE if user else ""

    # Datos de la fecha y hora actual
    fecha = datetime.now().strftime("%Y-%m-%d")
    hora_actual = datetime.now().strftime("%H:%M:%S")
    titulo = 'Directorio Conductores'

    # Inicializar el diccionario data_view con información común
    data_view = {
      "fecha": fecha,
      "hora": hora_actual
    }

    for estado, info in data.items():
      if isinstance(info, dict):
        estado_nombre = info.pop('nombre_estado', 'Sin nombre')
        data_view[estado] = {
          "nombre_estado": estado_nombre,
          "conductores": []
        }
        for conductor_codigo, conductor_info in info.items():
          if isinstance(conductor_info, dict):
            conductor = {  
              "codigo_conductor": conductor_info.get("conductor_codigo", ""),
              "nombre": conductor_info.get("conductor_nombre", ""),
              "cedula": conductor_info.get("conductor_cedula", ""),
              "ciudad": conductor_info.get("conductor_ciudad", ""),
              "direccion": conductor_info.get("conductor_direccion", ""),
              "telefono": conductor_info.get("conductor_telefono", ""),
              "unidad_og": conductor_info.get("conductor_und", ""), "unidad_pres":conductor_info.get("conductor_und_pre", ""),
            }
            data_view[estado]["conductores"].append(conductor)

    data_view["usuario"] = user

    headers = {
      "Content-Disposition": "attachment; detalles-conductores.pdf"
    }  

    template_loader = jinja2.FileSystemLoader(searchpath="./templates")
    template_env = jinja2.Environment(loader=template_loader)
    template_file = "DirectorioConductores.html"
    header_file = "header.html"
    footer_file = "footer.html"
    template = template_env.get_template(template_file)
    header = template_env.get_template(header_file)
    footer = template_env.get_template(footer_file)
    output_text = template.render(data_view=data_view)
    output_header = header.render(data_view=data_view)
    output_footer = footer.render(data_view=data_view)

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

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
      PDF_THREAD_POOL,
      html2pdf,
      titulo,
      html_path, 
      pdf_path,
      header_path,
      footer_path
    )

    background_tasks = BackgroundTasks()
    background_tasks.add_task(os.remove, html_path)
    background_tasks.add_task(os.remove, header_path)
    background_tasks.add_task(os.remove, footer_path)
    background_tasks.add_task(os.remove, pdf_path)

    response = FileResponse(
      pdf_path, media_type='application/pdf',
      filename='templates/Conductores-detalles.pdf',
      headers=headers,
      background=background_tasks
    )
    
    return response
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
      db.close()

#-----------------------------------------------------------------------------------------------

async def driver_info(driver_id: int):
  db = session()
  try:
    driver = db.query(
      Conductores.CODIGO,
      Conductores.NOMBRE,
      Conductores.CEDULA,
      Conductores.CIUDAD,
      Conductores.DIRECCION,
      Conductores.TELEFONO,
      Conductores.CELULAR,
      Conductores.FEC_NACIMT,
      Conductores.CORREO,
      Conductores.REPRESENTA,
      Conductores.SEXO,
      Conductores.ESTA_CIVIL,
      Conductores.FEC_INGRES,
      Conductores.FEC_RETIRO,
      Conductores.CONTACTO,
      Conductores.TEL_CONTAC,
      Conductores.PAR_CONTAC,
      Conductores.CONTACTO1,
      Conductores.TEL_CONTA1,
      Conductores.PAR_CONTA1,
      Conductores.CONTACTO2,
      Conductores.TEL_CONTA2,
      Conductores.PAR_CONTA2,
      Conductores.RECOME_NOM,
      Conductores.RECOME_CED,
      Conductores.ESTADO,
      Conductores.FEC_ESTADO,
      Conductores.TIP_CONTRA,
      Conductores.CRUCE_AHOR,
      Conductores.LICEN_NRO,
      Conductores.LICEN_CAT,
      Conductores.LICEN_VCE,
      Conductores.DETALLE,
      Conductores.OBSERVA,
      ).filter(Conductores.CODIGO == driver_id
      ).first()

    driver_dict = {
      'codigo': driver.CODIGO,
      'nombre': driver.NOMBRE,
      'cedula': driver.CEDULA,
      'ciudad': driver.CIUDAD,
      'direccion': driver.DIRECCION,
      'telefono': driver.TELEFONO,
      'celular': driver.CELULAR,
      'fecha_nacimiento': driver.FEC_NACIMT,
      'correo': driver.CORREO,
      'representa': driver.REPRESENTA,
      'sexo': driver.SEXO,
      'estado_civil': driver.ESTA_CIVIL,
      'fecha_ingreso': driver.FEC_INGRES,
      'fecha_retiro': driver.FEC_RETIRO,
      'contacto': driver.CONTACTO,
      'tel_contacto': driver.TEL_CONTAC,
      'par_contacto': driver.PAR_CONTAC,
      'contacto1': driver.CONTACTO1,
      'tel_contacto1': driver.TEL_CONTA1,
      'par_contacto1': driver.PAR_CONTA1,
      'contacto2': driver.CONTACTO2,
      'tel_contacto2': driver.TEL_CONTA2,
      'par_contacto2': driver.PAR_CONTA2,
      'recome_nom': driver.RECOME_NOM,
      'recome_ced': driver.RECOME_CED,
      'estado': driver.ESTADO,
      'fecha_estado': driver.FEC_ESTADO,
      'contrato_auto': driver.TIP_CONTRA,
      'cruce_ahorros': driver.CRUCE_AHOR,
      'licencia_numero': driver.LICEN_NRO,
      'licencia_categoria': driver.LICEN_CAT,
      'licencia_vencimiento': driver.LICEN_VCE,
      'detalle': driver.DETALLE,
      'observaciones': driver.OBSERVA
    }
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)
    return JSONResponse(content=jsonable_encoder(driver_dict))
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def update_driver_info(driver_id: int, driver: ConductorUpdate):
  db = session()
  try:
    print(driver)
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    fecha = now_in_panama.strftime("%Y-%m-%d")
    result = db.query(Conductores).filter(Conductores.CODIGO == driver_id).first()
    if not result:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)
    result.NOMBRE = driver.nombre
    result.CEDULA = driver.cedula
    result.CIUDAD = driver.ciudad
    result.TELEFONO = driver.telefono
    result.CELULAR = driver.celular
    result.CORREO = driver.correo
    result.SEXO = driver.sexo
    result.DIRECCION = driver.direccion
    result.REPRESENTA = driver.representa
    result.ESTA_CIVIL = driver.estado_civil
    result.CONTACTO = driver.contacto
    result.CONTACTO1 = driver.contacto1
    result.CONTACTO2 = driver.contacto2
    result.TEL_CONTAC = driver.tel_contacto
    result.TEL_CONTA1 = driver.tel_contacto1
    result.TEL_CONTA2 = driver.tel_contacto2
    result.PAR_CONTAC = driver.par_contacto
    result.PAR_CONTA1 = driver.par_contacto1
    result.PAR_CONTA2 = driver.par_contacto2
    result.RECOME_NOM = driver.recome_nom
    result.RECOME_CED = driver.recome_ced
    result.CRUCE_AHOR = driver.cruce_ahorros
    result.LICEN_NRO = driver.licencia_numero
    result.LICEN_CAT = driver.licencia_categoria
    result.LICEN_VCE = driver.licencia_vencimiento
    result.DETALLE = driver.detalle
    result.OBSERVA = driver.observaciones
    if driver.stateEdited:
      result.ESTADO = driver.estado
      result.FEC_ESTADO = fecha
    db.commit()
    return JSONResponse(content={"message": "Driver updated successfully"})
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def driver_delete(driver_id: int):
  db = session()
  try:
    MoviencaClient = aliased(Movienca)
    MoviencaConductor = aliased(Movienca)
    driver = db.query(
            CajaRecaudos.CLIENTE.label('cajarecaudos'),
            CajasRecaudosContado.CLIENTE.label('cajarecaudoscontado'),
            Cartera.CLIENTE.label('cartera'),
            MoviencaClient.CLIENTE.label('movienca'),
            MoviencaConductor.CONDUCTOR.label('movienca_conductor')
        ).select_from(Conductores).outerjoin(
            CajaRecaudos, Conductores.CODIGO == CajaRecaudos.CLIENTE
        ).outerjoin(
            CajasRecaudosContado, Conductores.CODIGO == CajasRecaudosContado.CLIENTE
        ).outerjoin(
            Cartera, Conductores.CODIGO == Cartera.CLIENTE
        ).outerjoin(
            MoviencaClient, Conductores.CODIGO == MoviencaClient.CLIENTE
        ).outerjoin(
            MoviencaConductor, Conductores.CODIGO == MoviencaConductor.CONDUCTOR
        ).filter(
            Conductores.CODIGO == driver_id
        ).first()
        
    if not driver:
      return JSONResponse(content={"message": "Driver not found"}, status_code=404)
    driver_conditions = {
      'cajarecaudos': driver.cajarecaudos,
      'cajarecaudoscontado': driver.cajarecaudoscontado,
      'cartera': driver.cartera,
      'movienca': driver.movienca,
      'movienca_conductor': driver.movienca_conductor
    }

    if any(driver_conditions.values()):
      return JSONResponse(content={"message": "driver cant be deleted"})
    # Si no hay registros en otras tablas, eliminar al propietario
    db.query(Conductores).filter(Conductores.CODIGO == driver_id).delete()
    db.commit()
    return JSONResponse(content={"message": "Owner deleted successfully"})
  
  except Exception as e:
    db.rollback() 
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def get_verify_delete(driver_id: int):
  db = session()
  try:
      driver = db.query(
          CajaRecaudos.CLIENTE.label('cajarecaudos'),
          CajasRecaudosContado.CLIENTE.label('cajarecaudoscontado'),
          Cartera.CLIENTE.label('cartera'),
          Movienca.CLIENTE.label('movienca')
        ).select_from(Conductores).outerjoin(
          CajaRecaudos, Conductores.CODIGO == CajaRecaudos.CLIENTE
        ).outerjoin(
          CajasRecaudosContado, Conductores.CODIGO == CajasRecaudosContado.CLIENTE
        ).outerjoin(
          Cartera, Conductores.CODIGO == Cartera.CLIENTE
        ).outerjoin(
          Movienca, Conductores.CODIGO == Movienca.CLIENTE
        ).filter(
          Conductores.CODIGO == driver_id
        ).first()
      
      if not driver:
         return JSONResponse(content={"message": "Driver not found"}, status_code=404)
      driver_conditions = {
          'cajarecaudos': bool(driver.cajarecaudos),
          'cajarecaudoscontado': bool(driver.cajarecaudoscontado),
          'cartera': bool(driver.cartera),
          'movienca': bool(driver.movienca)
      }

      return JSONResponse(content=jsonable_encoder(driver_conditions))
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def owner_codes():
  db = session()
  try:
    owners = db.query(Conductores.CODIGO).all()
    owner_codes = [owner.CODIGO for owner in owners]
    return JSONResponse(content=jsonable_encoder(owner_codes))
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def create_driver_info(driver: ConductorCreate):
  db = session()
  try:
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    fecha = now_in_panama.strftime("%Y-%m-%d")
    new_driver = Conductores(
      CODIGO=driver.codigo,
      NOMBRE=driver.nombre,
      CEDULA=driver.cedula,
      CIUDAD=driver.ciudad,
      TELEFONO=driver.telefono,
      CELULAR=driver.celular,
      CORREO=driver.correo,
      SEXO=driver.sexo,
      FEC_INGRES=driver.fecha_ingreso,
      DIRECCION=driver.direccion,
      FEC_NACIMT=driver.fecha_nacimiento,
      REPRESENTA=driver.representa,
      ESTA_CIVIL=driver.estado_civil,
      CONTACTO=driver.contacto,
      TEL_CONTAC=driver.tel_contacto,
      PAR_CONTAC=driver.par_contacto,
      CONTACTO1=driver.contacto1,
      TEL_CONTA1=driver.tel_contacto1,
      PAR_CONTA1=driver.par_contacto1,
      CONTACTO2=driver.contacto2,
      TEL_CONTA2=driver.tel_contacto2,
      PAR_CONTA2=driver.par_contacto2,
      RECOME_NOM=driver.recome_nom,
      RECOME_CED=driver.recome_ced,
      ESTADO=driver.estado,
      FEC_ESTADO=fecha,
      TIP_CONTRA=driver.contrato_auto,
      CRUCE_AHOR=driver.cruce_ahorros,
      LICEN_NRO=driver.licencia_numero,
      LICEN_CAT=driver.licencia_categoria,
      LICEN_VCE=driver.licencia_vencimiento,
      DETALLE=driver.detalle,
      OBSERVA=driver.observaciones,

      FEC_RETIRO=driver.fecha_retiro,
      FEC_INICIO=driver.fecha_inicio,
      FEC_PRESTA=driver.fecha_prestamo,
      FEC_DEVOLU=driver.fecha_devolucion,
      FEC_SINIES=driver.fecha_siniestro,
      FEC_TARJET=driver.fecha_tarjeta,
      FEC_1PAGO=driver.fecha_1pago,
      FEC_ULTPAG=driver.fecha_ultpago,
      FEC_EXTENC=driver.fecha_extencion,

      FEC_CREADO=fecha
    )
    db.add(new_driver)
    db.commit()
    return JSONResponse(content={"message": "Driver created successfully"}, status_code=201)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()

#-----------------------------------------------------------------------------------------------

async def drivers_count(company_code: str):
  db = session()
  try:
    drivers_count = db.query(Conductores).filter(
      Conductores.EMPRESA == company_code,
      Conductores.CODIGO != '',
      Conductores.CODIGO != None
    ).count()
    
    return JSONResponse(content={"drivers_count": drivers_count}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()