from __future__ import annotations

from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.counts import router as counts_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="PNW Fish Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(counts_router)


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}
