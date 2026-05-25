from fastapi import APIRouter
from controller.wallet import *

wallet_router = APIRouter()

@wallet_router.get("/wallet/vehicle-wallet-info/{company_code}/{vehicle_number}/{driver_number}/", tags=["Wallet"])
async def get_vehicle_wallet_info(company_code: str, vehicle_number: str, driver_number: str):
  return await vehicle_wallet_info(company_code, vehicle_number, driver_number)

@wallet_router.get("/wallet/vehicle-driver-info/{company_code}/{vehicle_number}/", tags=["Wallet"])
async def get_vehicle_and_driver_info(company_code: str, vehicle_number: str):
  return await vehicle_and_driver_info(company_code, vehicle_number)

@wallet_router.get("/wallet/receipts/{company_code}/{vehicle_number}/{driver_number}/", tags=["Wallet"])
async def get_receipts_list(company_code: str, vehicle_number: str, driver_number: str):
  return await receipts_list(company_code, vehicle_number, driver_number)

@wallet_router.get("/wallet/closing-date/{company_code}/", tags=["Wallet"])
async def get_closing_date(company_code: str):
  return await closing_date(company_code)