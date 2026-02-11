from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from config.dbconnection import session
from models.permisosusuario import PermisosUsuario
from security.jwt_handler import encode_jwt, decode_jwt
from schemas.users import userLogin
from dotenv import load_dotenv
import os

load_dotenv()

# ---------------------------------------------------------------------------------------------------------------

async def get_user():
  db = session()
  try:
    users = db.query(PermisosUsuario.CODIGO, PermisosUsuario.NOMBRE) \
    .all()
    users_list = [{'codigo': user.CODIGO, 'nombre': user.NOMBRE} for user in users]
    return JSONResponse(content=jsonable_encoder(users_list))
  except Exception as e:
    return JSONResponse(content=jsonable_encoder({'error': str(e)}))
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

async def get_user2():
  db = session()
  try:
    users = db.query(PermisosUsuario.CODIGO, PermisosUsuario.NOMBRE, PermisosUsuario.ESTADO, PermisosUsuario.OPCION01, PermisosUsuario.OPCION02, PermisosUsuario.OPCION03, PermisosUsuario.OPCION04, PermisosUsuario.OPCION05, PermisosUsuario.OPCION06, PermisosUsuario.OPCION07, PermisosUsuario.OPCION08, PermisosUsuario.OPCION09, PermisosUsuario.OPCION10, PermisosUsuario.OPCION11, PermisosUsuario.OPCION12, PermisosUsuario.OPCION13, PermisosUsuario.TAREA01, PermisosUsuario.TAREA02, PermisosUsuario.TAREA03, PermisosUsuario.TAREA04, PermisosUsuario.PASSSWORD).all()
    users_list = [{'codigo': user.CODIGO, 'nombre': user.NOMBRE, 'estado': user.ESTADO, 'opcion01': user.OPCION01, 'opcion02': user.OPCION02, 'opcion03': user.OPCION03, 'opcion04': user.OPCION04, 'opcion05': user.OPCION05, 'opcion06': user.OPCION06, 'opcion07': user.OPCION07, 'opcion08': user.OPCION08, 'opcion09': user.OPCION09, 'opcion10': user.OPCION10, 'tarea01': user.TAREA01, 'tarea02': user.TAREA02, 'tarea03': user.TAREA03, 'tarea04': user.TAREA04, 'password': user.PASSSWORD} for user in users]

    return JSONResponse(content=jsonable_encoder(users_list))
  except Exception as e:
    return JSONResponse(content=jsonable_encoder({'error': str(e)}))
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

async def process_login(data: userLogin):
  db = session()
  user_admin = os.getenv('USER_ADMIN')
  password_admin = os.getenv('PASSWORD_ADMIN')
  try:
    
    if data.user == user_admin and data.password == password_admin:
      user_data_cookie = {
        "codigo": user_admin,
      }
      user_data_localStorage = {
        "id": user_admin,
        "nombre": "Administrador",
        "opcion01": "T",
        "opcion02": "T",
        "opcion03": "T",
        "opcion04": "T",
        "opcion05": "T",
        "opcion06": "T",
        "opcion07": "T",
        "opcion08": "T",
        "opcion09": "T",
        "opcion10": "T",
        "opcion11": "T",
        "opcion12": "T",
        "opcion13": "T",
        "opcion14": "T",
        "opcion15": "T",
        "opcion16": "T",
        "opcion17": "T",
        "opcion18": "T",
        "tarea01": "T",
        "tarea02": "T",
        "tarea03": "T",
        "tarea04": "T",
        "tarea05": "T",
        "tarea09": "T",
        "foto": "../../../../assets/img/taxi.jpg",
        "empresa": "A"
      }
      token_cookie = encode_jwt(user_data_cookie)
      token_localStorage = encode_jwt(user_data_localStorage)
      
      return {'token_cookie': token_cookie, 'token_localStorage': token_localStorage, 'status_code':200}
    
    user = db.query(PermisosUsuario.CODIGO, 
                    PermisosUsuario.NOMBRE, 
                    PermisosUsuario.PASSSWORD, 
                    PermisosUsuario.ESTADO, 
                    PermisosUsuario.OPCION01, 
                    PermisosUsuario.OPCION02, 
                    PermisosUsuario.OPCION03, 
                    PermisosUsuario.OPCION04, 
                    PermisosUsuario.OPCION05, 
                    PermisosUsuario.OPCION06, 
                    PermisosUsuario.OPCION07, 
                    PermisosUsuario.OPCION08, 
                    PermisosUsuario.OPCION09, 
                    PermisosUsuario.OPCION10, 
                    PermisosUsuario.OPCION11, 
                    PermisosUsuario.OPCION12, 
                    PermisosUsuario.OPCION13, 
                    PermisosUsuario.OPCION14, 
                    PermisosUsuario.OPCION15, 
                    PermisosUsuario.OPCION16,
                    PermisosUsuario.OPCION17,
                    PermisosUsuario.OPCION18,
                    PermisosUsuario.TAREA01, 
                    PermisosUsuario.TAREA02, 
                    PermisosUsuario.TAREA03, 
                    PermisosUsuario.TAREA04, 
                    PermisosUsuario.TAREA05, 
                    PermisosUsuario.TAREA09, 
                    PermisosUsuario.FOTO,
                    PermisosUsuario.EMPRESA
                    ) \
    .filter(
      PermisosUsuario.CODIGO == data.user
      ) \
    .first()
    if user is None:
      return {'error': 'Usuario no encontrado', 'status_code': 404}
    if user.PASSSWORD != data.password:
      return {'error': 'Contraseña incorrecta', 'status_code': 401}
    if user.ESTADO == 0:
      return {'error': 'Usuario inactivo', 'status_code': 403}
    user_data_cookie = {
      "codigo": user.CODIGO,
    }
    user_data_localStorage = {
      "id": user.CODIGO,
      "nombre": user.NOMBRE,
      "opcion01": user.OPCION01,
      "opcion02": user.OPCION02,
      "opcion03": user.OPCION03,
      "opcion04": user.OPCION04,
      "opcion05": user.OPCION05,
      "opcion06": user.OPCION06,
      "opcion07": user.OPCION07,
      "opcion08": user.OPCION08,
      "opcion09": user.OPCION09,
      "opcion10": user.OPCION10,
      "opcion11": user.OPCION11,
      "opcion12": user.OPCION12,
      "opcion13": user.OPCION13,
      "opcion14": user.OPCION14,
      "opcion15": user.OPCION15,
      "opcion16": user.OPCION16,
      "opcion17": user.OPCION17,
      "opcion18": user.OPCION18,
      "tarea01": user.TAREA01,
      "tarea02": user.TAREA02,
      "tarea03": user.TAREA03,
      "tarea04": user.TAREA04,
      "tarea05": user.TAREA05,
      "tarea09": user.TAREA09,
      "foto": user.FOTO if user.FOTO else "../../../../assets/img/taxi.jpg",
      "empresa": user.EMPRESA
    }
    token_cookie = encode_jwt(user_data_cookie)
    token_localStorage = encode_jwt(user_data_localStorage)
    
    return {'token_cookie': token_cookie, 'token_localStorage': token_localStorage, 'status_code':200}
  except Exception as e:
    return {'error': str(e), 'status_code':500}
  finally:
    db.close()

# ---------------------------------------------------------------------------------------------------------------

async def process_logout():
  return JSONResponse(content=jsonable_encoder({'message':'Sesión cerrada exitosamente'}), status_code=200)