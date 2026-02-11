from fastapi import APIRouter, UploadFile, File
from schemas.operations import *
from controller.operations import *

operations_router = APIRouter()

@operations_router.get("/operations/deliveryvehicledriver/vehicle/{vehicle_number}/", tags=["Operations"])
async def get_vehicle_operations(vehicle_number: str):
  return await get_vehicle_operation(vehicle_number)

@operations_router.get("/operations/deliveryvehicledriver/driver/{driver_number}/", tags=["Operations"])
async def get_driver_operations(driver_number: str):
  return await get_driver_operation(driver_number)

@operations_router.post("/operations/deliveryvehicledriver/", tags=["Operations"])
async def post_delivery_vehicle_driver(data: DeliveryVehicleDriver):
  return await delivery_vehicle_driver(data)

@operations_router.get("/operations/generate-contract/info/{vehicle_number}/", tags=["Operations"])
async def get_vehicle_delivery_info(vehicle_number: str):
  return await vehicle_delivery_info(vehicle_number)

@operations_router.post("/operations/generate-contract/pdf/{vehicle_number}/", tags=["Operations"])
async def post_generate_contract(vehicle_number: str, data: GenerateContractData):
  return await generate_contract(vehicle_number, data)

@operations_router.post("/operations/validation/", tags=["Operations"])
async def post_validation(data: BillValidation):
  return await validation(data)

@operations_router.post("/operations/new-bill/", tags=["Operations"])
async def post_new_bill(data: BillInfo):
  return await new_bill(data)

@operations_router.post("/operations/change-yard/", tags=["Operations"])
async def post_change_yard(data: ChangeYard):
  return await change_yard(data)

@operations_router.post("/operations/change-vehicle-state/", tags=["Operations"])
async def post_change_vehicle_state(data: ChangeVehicleState):
  return await change_vehicle_state(data)

@operations_router.get("/operations/vehicle-mileage/{company_code}/{vehicle_number}/", tags=["Operations"])
async def get_vehicle_mileage(company_code: str, vehicle_number: str):
  return await vehicle_mileage(company_code, vehicle_number)

@operations_router.post("/operations/update-vehicle-mileage/", tags=["Operations"])
async def post_update_vehicle_mileage(data: VehicleMileage):
  return await update_mileage(data)

@operations_router.get("/operations/loan-vehicle/validation/{company_code}/{vehicle_number}/", tags=["Operations"])
async def get_loan_vehicle_validation(company_code: str, vehicle_number: str):
  return await loan_validation(company_code, vehicle_number)

@operations_router.post("/operations/loan-vehicle/", tags=["Operations"])
async def post_loan_vehicle(data: LoanVehicle):
  return await loan_vehicle(data)

@operations_router.get("/operations/return-vehicle/validation/{company_code}/{vehicle_number}/", tags=["Operations"])
async def get_return_vehicle_validation(company_code: str, vehicle_number: str):
  return await return_validation(company_code, vehicle_number)

@operations_router.post("/operations/return-vehicle/", tags=["Operations"])
async def post_return_vehicle(data: ReturnVehicle):
  return await return_vehicle(data)

@operations_router.get("/operations/remove-driver/{company_code}/{vehicle_number}/{driver_number}/", tags=["Operations"])
async def get_remove_driver(company_code: str, vehicle_number: str, driver_number: str):
  return await remove_driver(company_code, vehicle_number, driver_number)

@operations_router.get("/operations/items-cxp/{company_code}/", tags=["Operations"])
async def get_items_cxp(company_code: str):
  return await items_cxp(company_code)

@operations_router.post("/operations/driver-settlement/", tags=["Operations"])
async def post_driver_settlement(data: DriverSettlement):
  return await driver_settlement(data)

@operations_router.post("/operations/save-remove-driver/", tags=["Operations"])
async def post_save_remove_driver(data: RemoveDriver):
  return await save_remove_driver(data)