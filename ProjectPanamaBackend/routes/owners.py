from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from config.dbconnection import session
from models.propietarios import Propietarios
from models.vehiculos import Vehiculos
from models.conductores import Conductores
from models.estados import Estados
from utils.reports import *
from schemas.owners import *
from models.centrales import Centrales
from models.cajarecaudos import CajaRecaudos
from models.cajarecaudoscontado  import CajasRecaudosContado
from models.cartera import Cartera
from models.movienca import Movienca
from models.permisosusuario import PermisosUsuario
from middlewares.JWTBearer import JWTBearer
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import pytz
import os

owners_router = APIRouter()

# PETICIÓN DE LISTA DE PROPIETARIOS A LA BASE DE DATOS 
# ---------------------------------------------------------------------------------------------------------------
@owners_router.get("/owners/{company_code}/", tags=["Owners"])
async def get_owners(company_code: str):
  db = session()
  try:
    owners = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(Propietarios.EMPRESA == company_code).all()
    if owners:
      owners_list = [{'id': owner.CODIGO, 'name': owner.NOMBRE} for owner in owners]
      return JSONResponse(content=jsonable_encoder(owners_list))
    return JSONResponse(content={"message": "Owner not found"}, status_code=404)
  except Exception as e:
    return JSONResponse(content={"message": str(e)})
  finally:
    db.close()
# ---------------------------------------------------------------------------------------------------------------

@owners_router.get("/owners/all/{company_code}/", tags=["Owners"])
async def get_all_owners(company_code: str):
  db = session()
  try:
    owners = db.query(
      Propietarios.CODIGO.label('codigo'),
      Propietarios.NOMBRE.label('nombre_propietario'),
      Propietarios.RUC.label('ruc'),
      Propietarios.TELEFONO.label('telefono'),
      Propietarios.CELULAR.label('celular'),
      Propietarios.REPRESENTA.label('representante'),
      Centrales.NOMBRE.label('central'),
      PermisosUsuario.NOMBRE.label('auditor'),
      Propietarios.GRUPO.label('cnt'),
      Propietarios.DESCUENTO.label('dcto'),
      Propietarios.ESTADO.label('estado')
    ).join(
      PermisosUsuario, Propietarios.USUARIO == PermisosUsuario.CODIGO
    ).join(
      Centrales, Propietarios.CENTRAL == Centrales.CODIGO
    ).filter(
      Centrales.EMPRESA == company_code,
      Propietarios.EMPRESA == company_code,
      Propietarios.CODIGO != '',
    ).distinct().all()

    owners_list = []
    for owner in owners:
      if owner.estado == 1:
        estado = 'Activo'
      elif owner.estado == 2:
        estado = 'Suspendido'
      elif owner.estado == 3:
        estado = 'Retirado'
      else:
        estado = 'Desconocido'

      owner_list = {
        'codigo': owner.codigo,
        'nombre_propietario': (owner.nombre_propietario or '').title(),
        'ruc': owner.ruc,
        'telefono': owner.telefono,
        'celular': owner.celular,
        'representante': (owner.representante or '').title(),
        'central': (owner.central or '').title(),
        'auditor': (owner.auditor or '').title(),
        'cnt': owner.cnt,
        'dcto': owner.dcto,
        'estado': estado
      }
      owners_list.append(owner_list)

    # owners_list = [
    #   {
    #     'codigo': owner.codigo,
    #     'nombre_propietario': owner.nombre_propietario,
    #     'ruc': owner.ruc,
    #     'telefono': owner.telefono,
    #     'celular': owner.celular,
    #     'representante': owner.representante,
    #     'central': owner.central,
    #     'auditor': owner.auditor,
    #     'cnt': owner.cnt,
    #     'dcto': owner.dcto,
    #     'estado': owner.estado
    #   }
    #   for owner in owners
    # ]
    return JSONResponse(content=jsonable_encoder(owners_list))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()
# ---------------------------------------------------------------------------------------------------------------

# PETICIÓN DE UN PROPIETARIO ESPECÍFICO A LA BASE DE DATOS
# ---------------------------------------------------------------------------------------------------------------
@owners_router.get("/owner/{owner_id}/", tags=["Owners"])
async def get_owner(owner_id: int):
  db = session()
  try:
    owner = db.query(
      Propietarios
    ).filter(
      Propietarios.CODIGO == owner_id
    ).first()

    if not owner:
      return JSONResponse(content={"error": "Owner not found"}, status_code=404)

    if owner.ESTADO == 1:
      estado = 'Activo'
    elif owner.ESTADO == 2:
      estado = 'Suspendido'
    elif owner.ESTADO == 3:
      estado = 'Retirado'
    else:
      estado = 'Desconocido'

    owner_dict = {
      'codigo': owner.CODIGO,
      'nombre_propietario': owner.NOMBRE,
      'razon_social': owner.RAZONSOCIA,
      'sexo': owner.REP_SEXO,
      'estado_civil': owner.REP_ESTADO,
      'tipo_documento': owner.REP_TIPDOC,
      'numero_documento': owner.REP_NUMERO,
      'nacionalidad': owner.REP_NACION,
      'ficha': owner.FICHA,
      'documento': owner.DOCUMENTO,
      'representante': owner.REPRESENTA,
      'nombre_abreviado': owner.ABREVIADO,
      'nit': owner.NIT,
      'ruc': owner.RUC,
      'ciudad': owner.CIUDAD,
      'direccion': owner.DIRECCION,
      'telefono': owner.TELEFONO,
      'celular': owner.CELULAR,
      'celular1': owner.CELULAR1,
      'fec_nacimiento': owner.FEC_NACIMI,
      'fec_ingreso': owner.FEC_INGRES,
      'representante': owner.REPRESENTA,
      'contacto': owner.CONTACTO,
      'correo': owner.CORREO,
      'correo1': owner.CORREO1,
      'estado': owner.ESTADO,
      'fec_estado': owner.FEC_ESTADO,
      'central': owner.CENTRAL,
      'grupo': owner.GRUPO,
      'impuesto': owner.IMPUESTO,
      'admon_parado': owner.ADM_PARADO,
      'descuento': owner.DESCUENTO,
      'auditor': owner.USUARIO,  
      'cnt': owner.CONTROL,  
      'estado': estado
    }
    return JSONResponse(content=jsonable_encoder(owner_dict))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.put("/owner/{owner_id}/", response_model=PropietarioUpdate, tags=["Owners"])
def update_propietario(owner_id: str, propietario: PropietarioUpdate):
    db = session()
    try:
      panama_timezone = pytz.timezone('America/Panama')
      now_in_panama = datetime.now(panama_timezone)
      fecha = now_in_panama.strftime("%Y-%m-%d")
      result = db.query(Propietarios).filter(Propietarios.CODIGO == owner_id).first()
      if not result:
        return JSONResponse(status_code=404, content={"message": "Owner not found"})
      result.NOMBRE = propietario.nombre_propietario
      result.ABREVIADO = propietario.nombre_abreviado
      result.REPRESENTA = propietario.representante
      result.RAZONSOCIA = propietario.razon_social
      result.REP_SEXO = propietario.sexo
      result.REP_ESTADO = propietario.estado_civil
      result.REP_TIPDOC = propietario.tipo_documento
      result.REP_NUMERO = propietario.numero_documento
      result.REP_NACION = propietario.nacionalidad
      result.FICHA = propietario.ficha
      result.DOCUMENTO = propietario.documento
      result.USUARIO = propietario.auditor
      result.NIT = propietario.nit
      result.RUC = propietario.ruc
      result.CIUDAD = propietario.ciudad
      result.DIRECCION = propietario.direccion
      result.CENTRAL = propietario.central
      result.TELEFONO = propietario.telefono
      result.CELULAR = propietario.celular
      result.CELULAR1 = propietario.celular1
      result.CORREO = propietario.correo
      result.CORREO1 = propietario.correo1
      result.CONTACTO = propietario.contacto
      result.GRUPO = propietario.grupo
      result.IMPUESTO = propietario.impuesto
      result.ADM_PARADO = propietario.admon_parado
      result.DESCUENTO = propietario.descuento
      result.FEC_INGRES = propietario.fec_ingreso
      result.FEC_NACIMI = propietario.fec_nacimiento
      if propietario.stateEdited:
        if propietario.estado == 'Activo':
          result.ESTADO = 1
        elif propietario.estado == 'Suspendido':
          result.ESTADO = 2
        elif propietario.estado == 'Retirado':
          result.ESTADO = 3
        else:
          result.ESTADO = 0
        result.FEC_ESTADO = fecha
      db.commit()
      return JSONResponse(content={"message": "Owner updated"}, status_code=200)
    except Exception as e:
      db.rollback()
      return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
      db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.post("/owners/", response_model=PropietarioCreate, tags=["Owners"])
def create_propietario(propietario: PropietarioCreate):
  db = session()
  try:
    panama_timezone = pytz.timezone('America/Panama')
    now_in_panama = datetime.now(panama_timezone)
    fecha = now_in_panama.strftime("%Y-%m-%d")
    new_propietario = Propietarios(
      CODIGO=propietario.codigo,
      NOMBRE=propietario.nombre_propietario,
      ABREVIADO=propietario.nombre_abreviado,
      NIT=propietario.nit,
      CONTROL=propietario.cnt,
      RUC=propietario.ruc,
      RAZONSOCIA=propietario.razon_social,
      CIUDAD=propietario.ciudad,
      DIRECCION=propietario.direccion,
      TELEFONO=propietario.telefono,
      CELULAR=propietario.celular,
      FEC_NACIMI=propietario.fec_nacimiento,
      FEC_INGRES=propietario.fec_ingreso,
      CELULAR1=propietario.celular1,
      REPRESENTA=propietario.representante,
      REP_SEXO=propietario.sexo,
      REP_ESTADO=propietario.estado_civil,
      REP_TIPDOC=propietario.tipo_documento,
      REP_NUMERO=propietario.numero_documento,
      REP_NACION=propietario.nacionalidad,
      FICHA=propietario.ficha,
      DOCUMENTO=propietario.documento,
      CONTACTO=propietario.contacto,
      CORREO=propietario.correo,
      CORREO1=propietario.correo1,
      ESTADO=1 if propietario.estado == 'Activo' else 2 if propietario.estado == 'Suspendido' else 3 if propietario.estado == 'Retirado' else 0,
      FEC_ESTADO=fecha,
      USUARIO=propietario.auditor,
      CENTRAL=propietario.central,
      BANCO1="",
      TIPOCTA1="",
      CUENTA1="",
      BANCO2="",
      TIPOCTA2="",
      CUENTA2="",
      GRUPO=propietario.grupo,
      IMPUESTO=propietario.impuesto,
      DESCUENTO=propietario.descuento,
      ADM_PARADO=propietario.admon_parado,
      FEC_CREADO=fecha,
      USU_CREADO="",
      USU_MODIFI="",
      SEL="S"
    )
    db.add(new_propietario)
    db.commit()
    return JSONResponse(content={"message": "Owner created"}, status_code=201)
  except Exception as e:
    db.rollback()
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.get("/owners_data/{company_code}/", tags=["Owners"])
async def owners_data(company_code: str):
  db = session()
  try:
    owners = db.query(Propietarios).filter(Propietarios.EMPRESA == company_code, Propietarios.CODIGO != "").all()
    if not owners:
      return JSONResponse(content={"message": "Owner not found"}, status_code=404)

    result = []

    for owner in owners:
      owner_data = {
        "codigo_propietario": owner.CODIGO,
        "nombre_propietario": owner.NOMBRE,
        "conductores": [],
        "vehiculos": []
      }

      # Obtener vehículos de ese propietario
      vehicles = db.query(Vehiculos).filter(Vehiculos.PROPI_IDEN == owner.CODIGO, Vehiculos.PLACA != "", Vehiculos.NUMERO != "").all()

      for vehicle in vehicles:
        owner_data["vehiculos"].append({
          "placa_vehiculo": vehicle.PLACA,
          "numero_unidad": vehicle.NUMERO,
          "codigo_conductor": vehicle.CONDUCTOR,
          "marca": vehicle.NOMMARCA,
          "linea": vehicle.LINEA
        })

        # Obtener conductor relacionado al vehículo
        drivers = db.query(Conductores).filter(Conductores.CODIGO == vehicle.CONDUCTOR, Conductores.CODIGO != "").all()

        for driver in drivers:
          if driver and driver.CODIGO not in owner_data["conductores"]:
            owner_data["conductores"].append({
              "codigo_conductor": driver.CODIGO,
              "numero_unidad": driver.UND_NRO,
              "nombre_conductor": driver.NOMBRE,
              "cedula": driver.CEDULA
            })

      result.append(owner_data)

    return JSONResponse(content=jsonable_encoder(result), status_code=200)

  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.get("/owner-vehicles/{owner_id}/", tags=["Owners"])
async def get_owners_vehicles(owner_id: int):
  db = session()
  try:
    owner = db.query(
      Vehiculos.PLACA.label('placa'),
      Vehiculos.NUMERO.label('numero'),
      Vehiculos.NOMMARCA.label('marca'),
      Vehiculos.LINEA.label('linea'),
      Vehiculos.MODELO.label('modelo'),
      Vehiculos.LICETRANSI.label('licencia_transito'),
      Conductores.NOMBRE.label('conductor'),
      Estados.NOMBRE.label('estado'),
      Centrales.NOMBRE.label('central')
    ).join(
      Conductores, Vehiculos.CONDUCTOR == Conductores.CODIGO
    ).join(
      Estados, Vehiculos.ESTADO == Estados.CODIGO
    ).join(
      Centrales, Vehiculos.CENTRAL == Centrales.CODIGO
    ).filter(
      Vehiculos.PROPI_IDEN == owner_id
    ).all()

    owner_vehicles = []
    for vehicle in owner:
      owner_vehicle = {
        'placa': vehicle.placa,
        'numero': vehicle.numero,
        'marca': vehicle.marca,
        'linea': vehicle.linea,
        'modelo': vehicle.modelo,
        'licencia_transito': vehicle.licencia_transito,
        'conductor': vehicle.conductor,
        'central': vehicle.central,
        'estado': vehicle.estado
      }
      owner_vehicles.append(owner_vehicle)

    return JSONResponse(content=jsonable_encoder(owner_vehicles))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.get("/owner-representative/{owner_id}/", tags=["Owners"])
async def get_owner_rep(owner_id: int):
  db = session()
  try: 
    owner = db.query(
      Propietarios.NOMBRE.label('nombre_propietario'),
      Propietarios.RAZONSOCIA.label('razon_social'),
      Propietarios.REPRESENTA.label('representante'),
      Propietarios.REP_SEXO.label('sexo'),
      Propietarios.REP_ESTADO.label('estado_civil'),
      Propietarios.REP_TIPDOC.label('tipo_documento'),
      Propietarios.REP_NUMERO.label('numero_documento'),
      Propietarios.REP_NACION.label('nacionalidad'),
      Propietarios.FICHA.label('ficha'),
      Propietarios.DOCUMENTO.label('documento'),
    ).filter(
      Propietarios.CODIGO == owner_id
    ).first()

    if not owner:
      return JSONResponse(content={"error": "Owner not found"}, status_code=404)
    
    owner_rep = {
      'nombre_propietario': owner.nombre_propietario,
      'razon_social': owner.razon_social,
      'sexo': owner.sexo,
      'estado_civil': owner.estado_civil,
      'tipo_documento': owner.tipo_documento,
      'numero_documento': owner.numero_documento,
      'nacionalidad': owner.nacionalidad,
      'ficha': owner.ficha,
      'documento': owner.documento,
      'representante': owner.representante
    }

    return JSONResponse(content=jsonable_encoder(owner_rep))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.put("/owner-representative/{owner_id}/", tags=["Owners"])
async def update_owner_representative(owner_id: int, propietario: RepresentantePropietario):
  db = session()
  try:
    result = db.query(Propietarios).filter(Propietarios.CODIGO == owner_id).first()
    if not result:
      return JSONResponse(status_code=404, content={"message": "Owner not found"})
    result.RAZONSOCIA = propietario.razon_social
    result.REPRESENTA = propietario.representante
    result.REP_SEXO = propietario.sexo
    result.REP_ESTADO = propietario.estado_civil
    result.REP_TIPDOC = propietario.tipo_documento
    result.REP_NUMERO = propietario.numero_documento
    result.REP_NACION = propietario.nacionalidad
    result.FICHA = propietario.ficha
    result.DOCUMENTO = propietario.documento
    db.commit()
    return JSONResponse(content={"message": "Owner representative updated"}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"error": str(e)}, status_code=500)
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.get("/owner-codes/", tags=["Owners"])
async def get_owner_codes():
  db = session()
  try:
    owners = db.query(Propietarios.CODIGO).all()
    owner_codes = [owner.CODIGO for owner in owners]
    return JSONResponse(content=jsonable_encoder(owner_codes))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.delete("/owner/{owner_id}/", tags=["Owners"])
async def verify_owner_delete(owner_id: int):
  db = session()
  try:
    owner = db.query(
            Vehiculos.PROPI_IDEN.label('vehiculo'),
            CajaRecaudos.PROPI_IDEN.label('cajarecaudos'),
            CajasRecaudosContado.PROPI_IDEN.label('cajarecaudoscontado'),
            Cartera.PROPI_IDEN.label('cartera'),
            Movienca.PROPI_IDEN.label('movienca')
        ).select_from(Propietarios).outerjoin(
            Vehiculos, Propietarios.CODIGO == Vehiculos.PROPI_IDEN
        ).outerjoin(
            CajaRecaudos, Propietarios.CODIGO == CajaRecaudos.PROPI_IDEN
        ).outerjoin(
            CajasRecaudosContado, Propietarios.CODIGO == CajasRecaudosContado.PROPI_IDEN
        ).outerjoin(
            Cartera, Propietarios.CODIGO == Cartera.PROPI_IDEN
        ).outerjoin(
            Movienca, Propietarios.CODIGO == Movienca.PROPI_IDEN
        ).filter(
            Propietarios.CODIGO == owner_id
        ).first()
    
    if not owner:
      return JSONResponse(content={"error": "Owner not found"}, status_code=404)
    owner_conditions = {
      'vehiculo': owner.vehiculo,
      'cajarecaudos': owner.cajarecaudos,
      'cajarecaudoscontado': owner.cajarecaudoscontado,
      'cartera': owner.cartera,
      'movienca': owner.movienca
    }

    if any(owner_conditions.values()):
      return JSONResponse(content={"message": "Owner cant be deleted"})
    # Si no hay registros en otras tablas, eliminar al propietario
    db.query(Propietarios).filter(Propietarios.CODIGO == owner_id).delete()
    db.commit()
    return JSONResponse(content={"message": "Owner deleted successfully"})
  
  except Exception as e:
    db.rollback() 
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.get("/verify-owner-delete/{owner_id}/", tags=["Owners"])
async def verify_owner_delete(owner_id: int):
  db = session()
  try:
    owner = db.query(
            Vehiculos.PROPI_IDEN.label('vehiculo'),
            CajaRecaudos.PROPI_IDEN.label('cajarecaudos'),
            CajasRecaudosContado.PROPI_IDEN.label('cajarecaudoscontado'),
            Cartera.PROPI_IDEN.label('cartera'),
            Movienca.PROPI_IDEN.label('movienca')
        ).select_from(Propietarios).outerjoin(
            Vehiculos, Propietarios.CODIGO == Vehiculos.PROPI_IDEN
        ).outerjoin(
            CajaRecaudos, Propietarios.CODIGO == CajaRecaudos.PROPI_IDEN
        ).outerjoin(
            CajasRecaudosContado, Propietarios.CODIGO == CajasRecaudosContado.PROPI_IDEN
        ).outerjoin(
            Cartera, Propietarios.CODIGO == Cartera.PROPI_IDEN
        ).outerjoin(
            Movienca, Propietarios.CODIGO == Movienca.PROPI_IDEN
        ).filter(
            Propietarios.CODIGO == owner_id
        ).first()
    
    if not owner:
        return JSONResponse(content={"error": "Owner not found"}, status_code=404)
    owner_conditions = {
        'vehiculo': bool(owner.vehiculo),
        'cajarecaudos': bool(owner.cajarecaudos),
        'cajarecaudoscontado': bool(owner.cajarecaudoscontado),
        'cartera': bool(owner.cartera),
        'movienca': bool(owner.movienca)
    }

    return JSONResponse(content=jsonable_encoder(owner_conditions))
  except Exception as e:
    return JSONResponse(content={"error": str(e)})
  finally:
    db.close()

#----------------------------------------------------------------------------------------------------------------

@owners_router.post("/companies_owners/", tags=["Owners"])
async def get_companies_owners(owner: Owner):
  db = session()
  try:
    user_admin = os.getenv('USER_ADMIN')
    if owner.propietario:
      
      if owner.propietario == user_admin:
        owners = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).all()
        owners_list = [{'id': owner.CODIGO, 'name': owner.NOMBRE} for owner in owners]

      else:
        company_code = db.query(PermisosUsuario.EMPRESA).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        companies = db.query(PermisosUsuario.EMPRESAS).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        companies_list = companies.EMPRESAS.strip('[]').split()
        owners = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(Propietarios.CODIGO.in_(companies_list)).filter(Propietarios.EMPRESA == company_code[0]).all()
        owners_list = [{'id': owner.CODIGO, 'name': owner.NOMBRE} for owner in owners]

      return JSONResponse(content=jsonable_encoder(owners_list), status_code=200)

    return JSONResponse(content={"error": "Propietario no encontrado"}, status_code=404)
  except Exception as e:
    return JSONResponse(content={"error": str(e)}, status_code=500)
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

@owners_router.post("/companies_per_owners/", tags=["Owners"])
async def get_companies_per_owners(owner: Owner):
  db = session()
  try:
    user_admin = os.getenv('USER_ADMIN')
    if owner.propietario:
      
      if owner.propietario == user_admin:
        owners = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).all()
        owners_list = [{'id': owner.CODIGO, 'name': owner.NOMBRE} for owner in owners]

      else:
        company_code = db.query(PermisosUsuario.EMPRESA).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        companies = db.query(PermisosUsuario.EMPRESA).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        owners = db.query(Propietarios.CODIGO, Propietarios.NOMBRE).filter(Propietarios.EMPRESA == companies[0]).filter(Propietarios.EMPRESA == company_code[0]).all()
        owners_list = [{'id': owner.CODIGO, 'name': owner.NOMBRE} for owner in owners]
  
      return JSONResponse(content=jsonable_encoder(owners_list), status_code=200)

    return JSONResponse(content={"error": "Propietario no encontrado"}, status_code=404)
  except Exception as e:
    return JSONResponse(content={"error": str(e)}, status_code=500)
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

@owners_router.post("/vehicles_owners/", tags=["Owners"])
async def get_vehicles_owners(owner: Owner):
  db = session()
  try:
    user_admin = os.getenv('USER_ADMIN')
    if owner.propietario:

      if owner.propietario == user_admin:
        vehicles = db.query(Vehiculos.PLACA, Vehiculos.NUMERO, Vehiculos.NOMMARCA, Vehiculos.CONSECUTIV).all()
        vehicles_list = [{'placa': vehicle.PLACA, 'numero': vehicle.NUMERO, 'marca': vehicle.NOMMARCA, 'consecutivo': vehicle.CONSECUTIV} for vehicle in vehicles]
      
      else:
        companies = db.query(PermisosUsuario.EMPRESAS).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        companies_list = companies.EMPRESAS.strip('[]').split()
        vehicles = db.query(Vehiculos.PLACA, Vehiculos.NUMERO, Vehiculos.NOMMARCA, Vehiculos.CONSECUTIV).filter(Vehiculos.PROPI_IDEN.in_(companies_list)).all()

        vehicles_list = [{'placa': vehicle.PLACA, 'numero': vehicle.NUMERO, 'marca': vehicle.NOMMARCA, 'consecutivo': vehicle.CONSECUTIV} for vehicle in vehicles]
      
      return JSONResponse(content=jsonable_encoder(vehicles_list), status_code=200)
    
    return JSONResponse(content={"error": "Propietario no encontrado"}, status_code=404)
  
  except Exception as e:
    return JSONResponse(content={"error": str(e)}, status_code=500)
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

@owners_router.post("/vehicles_per_owners/", tags=["Owners"])
async def get_vehicles_owners(owner: Owner):
  db = session()
  try:
    user_admin = os.getenv('USER_ADMIN')
    vehicles_by_company = {}
    if owner.propietario:
      if owner.propietario == user_admin:
        # Para el usuario admin, se obtienen todos los vehículos
        # Se realiza join con Propietarios para obtener el nombre de la empresa
        vehicles = db.query(
          Vehiculos.PLACA,
          Vehiculos.NUMERO,
          Vehiculos.NOMMARCA,
          Vehiculos.CONSECUTIV,
          Vehiculos.PROPI_IDEN,
          Propietarios.NOMBRE.label('empresa')
        ).join(Propietarios, Propietarios.CODIGO == Vehiculos.PROPI_IDEN).all()
      else:
        company_code = db.query(PermisosUsuario.EMPRESA).filter(PermisosUsuario.CODIGO == owner.propietario).first()
        # Para un usuario no admin, se filtran las empresas asignadas
        companies = db.query(PermisosUsuario.EMPRESAS)\
                      .filter(PermisosUsuario.CODIGO == owner.propietario)\
                      .first()
        # Se asume que companies.EMPRESAS es un string tipo "[50 51 57 60 63]"
        companies_list = companies.EMPRESAS.strip('[]').split()
        vehicles = db.query(
          Vehiculos.PLACA,
          Vehiculos.NUMERO,
          Vehiculos.NOMMARCA,
          Vehiculos.CONSECUTIV,
          Vehiculos.PROPI_IDEN,
          Propietarios.NOMBRE.label('empresa')
        ).join(Propietarios, Propietarios.CODIGO == Vehiculos.PROPI_IDEN)\
         .filter(Vehiculos.PROPI_IDEN.in_(companies_list), Vehiculos.EMPRESA == company_code[0], Propietarios.EMPRESA == company_code[0]).all()
      
      # Agrupar vehículos por el nombre (empresa)
      for vehicle in vehicles:
        company_key = f"{vehicle.empresa} - {vehicle.PROPI_IDEN}"
        if company_key not in vehicles_by_company:
          vehicles_by_company[company_key] = []
        vehicles_by_company[company_key].append({
          'placa': vehicle.PLACA,
          'numero': vehicle.NUMERO,
          'marca': vehicle.NOMMARCA,
          'consecutivo': vehicle.CONSECUTIV
        })

        sorted_vehicles_by_company = dict(sorted(vehicles_by_company.items()))
      
      return JSONResponse(content=jsonable_encoder(sorted_vehicles_by_company), status_code=200)
    
    return JSONResponse(content={"error": "Propietario no encontrado"}, status_code=404)
  
  except Exception as e:
    return JSONResponse(content={"error": str(e)}, status_code=500)
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

@owners_router.get("/owners-count/{company_code}/", tags=["Owners"])
async def get_owners_count(company_code: str):
  db = session()
  try:
    count = db.query(Propietarios).filter(
      Propietarios.EMPRESA == company_code,
      Propietarios.CODIGO != '',
      Propietarios.CODIGO != None
    ).count()

    return JSONResponse(content={"owners_count": count}, status_code=200)
  except Exception as e:
    return JSONResponse(content={"message": str(e)}, status_code=500)
  finally:
    db.close()