from fastapi import APIRouter
from controller.vehicles_to_repair import *

vehicles_to_repair_router = APIRouter()

@vehicles_to_repair_router.get("/vehicles_to_repair/new_vehicle_entry_data/{company_code}/{vehicle_number}/", tags=["Vehicles to Repair"])
async def get_new_vehicle_entry_data(company_code: str, vehicle_number: str):
  return await new_vehicle_entry_data(company_code, vehicle_number)