from fastapi import APIRouter
from controller.surcharges_types import surcharges_types

surcharges_router = APIRouter()

@surcharges_router.get("/surcharges/{company_code}/", tags=["Surcharges"])
async def get_surcharges_types(company_code: str):
  return await surcharges_types(company_code)