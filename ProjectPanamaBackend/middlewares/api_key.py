from fastapi import Request, HTTPException, Depends
from fastapi.security import APIKeyHeader
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("EXTERNAL_API_KEY", "")
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
  if not API_KEY:
    raise HTTPException(status_code=500, detail="API Key not configured on server")
  if api_key != API_KEY:
    raise HTTPException(status_code=403, detail="Invalid or missing API Key")
  return api_key
