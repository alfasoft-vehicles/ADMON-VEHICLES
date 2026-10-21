from fastapi import APIRouter
from controller.mechanics import mechanics

mechanics_router = APIRouter()

@mechanics_router.get("/mechanics/{company_code}/", tags=["Mechanics"])
async def get_mechanics(company_code: str):
  return await mechanics(company_code)