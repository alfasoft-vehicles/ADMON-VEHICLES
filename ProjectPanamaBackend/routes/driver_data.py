from fastapi import APIRouter, Depends
from schemas.driver_data import DriverData, FingerprintData
from controller.driver_data import *
from middlewares.api_key import verify_api_key

driver_data_router = APIRouter()

@driver_data_router.post("/driver/upload-signature/", tags=["Driver Data"])
async def post_upload_signature(data: DriverData):
  return await upload_signature(data)

@driver_data_router.post("/driver/upload-picture/", tags=["Driver Data"])
async def post_upload_picture(data: DriverData):
  return await upload_picture(data)

@driver_data_router.post("/driver/upload-vehicle-photo/", tags=["Driver Data"])
async def post_upload_vehicle_photo(data: DriverData):
  return await upload_vehicle_photo(data)

@driver_data_router.post("/driver/upload-fingerprint/", tags=["Driver Data"], dependencies=[Depends(verify_api_key)])
async def post_upload_fingerprint(data: FingerprintData):
  return await upload_fingerprint(data)

@driver_data_router.post("/driver/upload-fingerprint-photo/", tags=["Driver Data"])
async def post_upload_fingerprint_internal(data: FingerprintData):
  return await upload_fingerprint(data)

@driver_data_router.get("/driver/vehicle-data/{company_code}/{vehicle_number}/", tags=["Driver Data"])
async def get_vehicle_driver_data(company_code: str, vehicle_number: str):
  return await vehicle_driver_data(company_code, vehicle_number)