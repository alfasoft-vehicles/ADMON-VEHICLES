from fastapi import APIRouter
from schemas.reports import *
from schemas.drivers import *
from controller.drivers import *

drivers_router = APIRouter()

@drivers_router.get("/drivers/{company_code}/", tags=["Drivers"])
async def get_drivers(company_code: str):
  return await drivers(company_code)

@drivers_router.get("/drivers/all/{company_code}/", tags=["Drivers"])
async def get_drivers(company_code: str):
  return await drivers_all(company_code)

@drivers_router.get("/drivers_data/{company_code}/", tags=["Drivers"])
async def get_drivers_data(company_code: str):
  return await drivers_data(company_code)

@drivers_router.get('/directorio-conductores/{company_code}/{user_code}/', tags=["Drivers"])
async def get_conductores_detalles(company_code: str, user_code: str):
  return await conductores_detalles(company_code, user_code)

@drivers_router.get("/driver/{driver_id}/", tags=["Drivers"])
async def get_driver_info(driver_id: int):
  return await driver_info(driver_id)

@drivers_router.put("/driver/{driver_id}/", tags=["Drivers"])
async def update_driver(driver_id: int, driver: ConductorUpdate):
  return await update_driver_info(driver_id, driver)

@drivers_router.delete("/driver/{driver_id}/", tags=["Drivers"])
async def verify_driver_delete(driver_id: int):
  return await driver_delete(driver_id)

@drivers_router.get('/verify-driver-delete/{driver_id}/', tags=["Drivers"])
async def verify_driver_delete(driver_id: int):
  return await get_verify_delete(driver_id)

@drivers_router.get("/driver-codes/", tags=["Drivers"])
async def get_owner_codes():
  return await owner_codes()

@drivers_router.post("/drivers/", response_model=ConductorCreate, tags=["Drivers"])
async def create_driver(driver: ConductorCreate):
  return await create_driver_info(driver)

@drivers_router.get("/drivers-count/{company_code}/", tags=["Drivers"])
async def get_drivers_count(company_code: str):
  return await drivers_count(company_code)