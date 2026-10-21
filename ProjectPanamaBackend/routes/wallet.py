from fastapi import APIRouter, UploadFile, File
from controller.wallet import *
from schemas.wallet import *

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

@wallet_router.get("/wallet/messages/{company_code}/{vehicle_number}/", tags=["Wallet"])
async def get_messages(company_code: str, vehicle_number: str):
  return await wallet_messages(company_code, vehicle_number)

@wallet_router.get("/wallet/notifications/{company_code}/{vehicle_number}/", tags=["Wallet"])
async def get_notifications(company_code: str, vehicle_number: str):
  return await wallet_notifications(company_code, vehicle_number)

@wallet_router.post("/wallet/create-surcharge/", tags=["Wallet"])
async def post_create_surcharge(surcharge_data: newSurcharge):
  return await create_surcharge(surcharge_data)

@wallet_router.get("/wallet/surcharges/{company_code}/{vehicle_number}/{driver_number}/", tags=["Wallet"])
async def get_surcharges(company_code: str, vehicle_number: str, driver_number: str):
  return await surcharges_list(company_code, vehicle_number, driver_number)

@wallet_router.post("/wallet/verify-revenue/", tags=["Wallet"])
async def post_verify_revenue(revenue_data: Revenue):
  return await verify_revenue_data(revenue_data)

@wallet_router.post("/wallet/create-rent-receipt/", tags=["Wallet"])
async def post_create_rent_receipt(receipt_data: newRentReceipt):
  return await create_rent_receipt(receipt_data)

@wallet_router.post("/wallet/collect-revenue/", tags=["Wallet"])
async def post_collect_revenue(revenue_data: Revenue):
  return await collect_revenue(revenue_data)

@wallet_router.get("/wallet/revenue-pdf/{company_code}/{receipt_number}/", tags=["Wallet"])
async def get_revenue_pdf(company_code: str, receipt_number: str):
  return await generate_revenue_pdf(company_code, receipt_number)

@wallet_router.post("/wallet/bulk-upload/yappy/{company_code}/", tags=["Wallet"])
async def post_upload_yappy_csv(company_code: str, file: UploadFile = File(...)):
  return await upload_yappy_csv(company_code, file)

@wallet_router.get("/wallet/has-records/yappy/", tags=["Wallet"])
async def get_yappy_has_records():
  return await yappy_has_records()

@wallet_router.get("/wallet/get-records/yappy/{company_code}/", tags=["Wallet"])
async def get_yappy_records(company_code: str):
  return await yappy_records(company_code)
