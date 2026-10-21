from fastapi import APIRouter, UploadFile, File
from typing import List
from controller.vehicles_to_repair import *
from schemas.vehicles_to_repair import *

vehicles_to_repair_router = APIRouter()

@vehicles_to_repair_router.get("/vehicles_to_repair/get_repair_types/{company_code}/", tags=["Vehicles to Repair"])
async def get_repair_types_route(company_code: str):
  return await get_repair_types(company_code)

@vehicles_to_repair_router.get("/vehicles_to_repair/new_vehicle_entry_data/{company_code}/{vehicle_number}/", tags=["Vehicles to Repair"])
async def get_new_vehicle_entry_data(company_code: str, vehicle_number: str):
  return await new_vehicle_entry_data(company_code, vehicle_number)

@vehicles_to_repair_router.post("/vehicles_to_repair/create_vehicle_entry/", tags=["Vehicles to Repair"])
async def post_create_vehicle_entry(data: NewVehicleEntry):
  return await create_vehicle_entry(data)

@vehicles_to_repair_router.post("/vehicles_to_repair/upload_images/{entry_id}/", tags=["Vehicles to Repair"])
async def post_upload_images(entry_id: int, images: List[UploadFile] = File(...)):
    return await upload_images(entry_id, images)

@vehicles_to_repair_router.get("/vehicles_to_repair/generate_qr/{entry_id}/", tags=["Vehicles to Repair"])
async def get_generate_qr(entry_id: int):
  return await generate_qr(entry_id)

@vehicles_to_repair_router.post("/vehicles_to_repair/vehicles_info/{company_code}/", tags=["Vehicles to Repair"])
async def post_vehicles_info(data: VehicleToRepairInfo, company_code: str):
  return await vehicles_info(data, company_code)

@vehicles_to_repair_router.get("/vehicles_to_repair/get_pdf_url/{entry_id}/", tags=["Vehicles to Repair"])
async def get_pdf_url_route(entry_id: int):
  return await get_pdf_url(entry_id)

@vehicles_to_repair_router.get("/vehicles_to_repair/repair_details/{entry_id}/", tags=["Vehicles to Repair"])
async def get_repair_details(entry_id: int):
  return await repair_details(entry_id)

@vehicles_to_repair_router.get("/vehicles_to_repair/get_repair_edit_data/{entry_id}/", tags=["Vehicles to Repair"])
async def get_repair_edit_data_route(entry_id: int):
  return await get_repair_edit_data(entry_id)

@vehicles_to_repair_router.put("/vehicles_to_repair/update_repair_entry/{entry_id}/", tags=["Vehicles to Repair"])
async def put_update_repair_entry(entry_id: int, data: UpdateVehicleRepair):
  return await update_repair_entry(entry_id, data)

@vehicles_to_repair_router.post("/vehicles_to_repair/report_repairs/{company_code}/", tags=["Vehicles to Repair"])
async def post_report_repairs(data: VehicleToRepairInfo, company_code: str):
  return await report_repairs(data, company_code)

@vehicles_to_repair_router.post("/vehicles_to_repair/download_image/", tags=["Vehicles to Repair"])
async def post_download_repair_image(request: DownloadImageRequest):
  return await download_image_by_url(request.image_url)

@vehicles_to_repair_router.post("/vehicles_to_repair/finish_repair/", tags=["Vehicles to Repair"])
async def post_finish_repair(data: FinishRepairRequest):
  return await finish_repair(data)