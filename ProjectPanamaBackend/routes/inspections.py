from fastapi import APIRouter, UploadFile, File
from schemas.inspections import InspectionInfo, DownloadImageRequest, NewInspection, UpdateInspection
from controller.inspections import *

inspections_router = APIRouter()

@inspections_router.get("/inspections/vehicles_data/{company_code}/", tags=["Inspections"])
async def get_vehicles_data(company_code: str):
  return await vehicles_data(company_code)

@inspections_router.get("/inspections/drivers_data/{company_code}/", tags=["Inspections"])
async def get_drivers_data(company_code: str):
  return await drivers_data(company_code)

@inspections_router.post("/inspections/inspections_info/all/{company_code}/", tags=["Inspections"])
async def post_inspections_list(data: InspectionInfo, company_code: str):
    return await inspections_info_all(data, company_code)

@inspections_router.post("/inspections/inspections_info/{company_code}/", tags=["Inspections"])
async def post_inspections_info(data: InspectionInfo, company_code: str):
  return await inspections_info(data, company_code)

@inspections_router.post("/inspections/upload_images/{inspection_id}/", tags=["Inspections"])
async def post_upload_images(inspection_id: int, images: List[UploadFile] = File(...)):
    return await upload_images(inspection_id, images)

@inspections_router.post("/inspections/upload_signature/{inspection_id}/", tags=["Inspections"])
async def post_upload_signature(inspection_id: int, signature: UploadFile = File(...)):
    return await upload_signature(inspection_id, signature)

@inspections_router.post("/inspections/report_inspections/{company_code}/", tags=["Inspections"])
async def post_report_inspections(data: InspectionInfo, company_code: str):
    return await report_inspections(data, company_code)

@inspections_router.get("/inspections/inspection_types/{company_code}/", tags=["Inspections"])
async def get_inspection_types(company_code: str):
    return await inspection_types(company_code)

@inspections_router.get("/inspections/new_inspection_data/{company_code}/{vehicle_number}/", tags=["Inspections"])
async def get_new_inspection_data(company_code: str, vehicle_number: str):
    return await new_inspection_data(company_code, vehicle_number)

@inspections_router.post("/inspections/create_inspection/", tags=["Inspections"])
async def post_create_inspection(data: NewInspection):
    return await create_inspection(data)

@inspections_router.put("/inspections/update_inspection/", tags=["Inspections"])
async def put_update_inspection(data: UpdateInspection):
    return await update_inspection(data)

@inspections_router.post("/inspections/download_image/", tags=["Inspections"])
async def post_download_image(request: DownloadImageRequest):
    return await download_image_by_url(request.image_url)

@inspections_router.get("/inspections/inspection_details/{inspection_id}/", tags=["Inspections"])
async def get_inspection_details(inspection_id: int):
    return await inspection_details(inspection_id)

@inspections_router.post("/inspections/generate_inspection_pdf/{company_code}/", tags=["Inspections"])
async def post_generate_inspection_pdf(data: ReportInspection, company_code: str):
    return await generate_inspection_pdf(data, company_code)

@inspections_router.get("/inspections/vehicle_info/{company_code}/{vehicle_number}/", tags=["Inspections"])
async def get_vehicle_info(company_code: str, vehicle_number: str):
    return await vehicle_info(company_code, vehicle_number)

@inspections_router.get("/inspections/generate_qr/{company_code}/{vehicle_number}/", tags=["Inspections"])
async def get_generate_qr(company_code: str, vehicle_number: str):
    return await generate_qr(company_code, vehicle_number)