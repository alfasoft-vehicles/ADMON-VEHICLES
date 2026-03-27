import asyncio
import os

async def remove_file_delayed(path: str, delay_seconds: int = 5):
  await asyncio.sleep(delay_seconds)
  if os.path.exists(path):
    os.remove(path)