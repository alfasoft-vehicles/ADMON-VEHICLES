from fastapi import APIRouter
from controller.documents import *
from schemas.documents import Info

documents_router = APIRouter()

@documents_router.get("/documents/vehicle-documents/{company_code}/{vehicle_number}/", tags=["Documents"])
async def get_vehicle_documents(company_code: str, vehicle_number: str):
  return await vehicle_documents(company_code, vehicle_number)

@documents_router.get("/documents/send-vehicle-documents/{company_code}/{vehicle_number}/{base_doc}/", tags=["Documents"])
async def get_send_vehicle_documents(company_code: str, vehicle_number: str, base_doc: str):
  return await send_vehicle_documents(company_code, vehicle_number, base_doc)

@documents_router.post("/documents/info/{company_code}/", tags=["Documents"])
async def post_info(company_code: str, data: Info):
  return await info(company_code, data)

@documents_router.get("/documents/driver-documents/{company_code}/{driver_number}/", tags=["Documents"])
async def get_driver_documents(company_code: str, driver_number: str):
  return await driver_documents(company_code, driver_number)

@documents_router.get("/documents/send-driver-documents/{company_code}/{driver_number}/{base_doc}/", tags=["Documents"])
async def get_send_driver_documents(company_code: str, driver_number: str, base_doc: str):
  return await send_driver_documents(company_code, driver_number, base_doc)