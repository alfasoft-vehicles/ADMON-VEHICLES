from fastapi import APIRouter
from controller.vehicles_to_repair import *
from schemas.vehicles_to_repair import *

vehicles_to_repair_router = APIRouter()

@vehicles_to_repair_router.get("/vehicles_to_repair/new_vehicle_entry_data/{company_code}/{vehicle_number}/", tags=["Vehicles to Repair"])
async def get_new_vehicle_entry_data(company_code: str, vehicle_number: str):
  return await new_vehicle_entry_data(company_code, vehicle_number)

@vehicles_to_repair_router.post("/vehicles_to_repair/create_vehicle_entry/", tags=["Vehicles to Repair"])
async def post_create_vehicle_entry(data: NewVehicleEntry):
  return await create_vehicle_entry(data)

@vehicles_to_repair_router.post("/vehicles_to_repair/upload_images/{entry_id}/", tags=["Vehicles to Repair"])
async def post_upload_images(entry_id: int, images: List[UploadFile] = File(...)):
    return await upload_images(entry_id, images)