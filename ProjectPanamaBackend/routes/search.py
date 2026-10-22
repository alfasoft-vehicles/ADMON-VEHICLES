from fastapi import APIRouter
from controller.search import *

search_router = APIRouter()

@search_router.get("/search/basic-info/{company_code}/", tags=["Search"])
async def get_search_basic_info(company_code: str, q: str = ""):
  return await search_basic_info(company_code, q)
