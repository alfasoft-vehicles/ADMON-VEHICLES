from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from schemas.users import userLogin
from controller.users import get_user, process_login, process_logout

users_router = APIRouter()

# PRUEBA DE PETICIÓN A LA BASE DE DATOS
# ---------------------------------------------------------------------------------------------------------------
@users_router.get('/users/', tags=["Users"])
async def get_users():
  return await get_user()
# ---------------------------------------------------------------------------------------------------------------

@users_router.post('/login/', tags=["Users"])
async def login(data: userLogin, response: Response):
  login_result = await process_login(data)

  if 'error' in login_result:
    return JSONResponse(content=jsonable_encoder({'message': login_result['error']}), status_code=login_result['status_code'])
  
  response.set_cookie(key="access_token", value=login_result['token_cookie'], httponly=True, secure=True, samesite='strict')
  return JSONResponse(content=jsonable_encoder({'token': login_result['token_localStorage']}), status_code=login_result['status_code'])

@users_router.post('/logout/', tags=["Users"])
async def logout(response: Response):
  response.delete_cookie(key="access_token", httponly=True, secure=True, samesite='strict')
  return await process_logout()