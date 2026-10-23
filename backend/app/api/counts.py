from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.counts import (
    LocationTotalsResponse,
    MonthlyCountsResponse,
    SpeciesTotalsResponse,
    YearCountsResponse,
)
from app.services.counts import (
    get_counts_for_year,
    get_location_totals_for_year,
    get_monthly_counts_for_year,
    get_species_totals_for_year,
)

router = APIRouter(prefix="/api", tags=["counts"])

MIN_YEAR = 1938
MAX_YEAR = date.today().year


@router.get("/counts/{year}", response_model=YearCountsResponse)
async def read_counts_for_year(
    year: int = Path(..., ge=MIN_YEAR, le=MAX_YEAR),
    db: AsyncSession = Depends(get_db),
) -> YearCountsResponse:
    try:
        return await get_counts_for_year(db, year)
    except Exception as exc:  # noqa: BLE001 — surfaced as HTTP error below
        raise HTTPException(status_code=500, detail="Failed to load fish counts") from exc


@router.get("/counts/{year}/monthly", response_model=MonthlyCountsResponse)
async def read_monthly_counts_for_year(
    year: int = Path(..., ge=MIN_YEAR, le=MAX_YEAR),
    db: AsyncSession = Depends(get_db),
) -> MonthlyCountsResponse:
    try:
        return await get_monthly_counts_for_year(db, year)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail="Failed to load monthly fish counts"
        ) from exc


@router.get("/counts/{year}/locations", response_model=LocationTotalsResponse)
async def read_location_totals_for_year(
    year: int = Path(..., ge=MIN_YEAR, le=MAX_YEAR),
    db: AsyncSession = Depends(get_db),
) -> LocationTotalsResponse:
    try:
        return await get_location_totals_for_year(db, year)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail="Failed to load fish counts by location"
        ) from exc


@router.get("/counts/{year}/totals", response_model=SpeciesTotalsResponse)
async def read_species_totals_for_year(
    year: int = Path(..., ge=MIN_YEAR, le=MAX_YEAR),
    db: AsyncSession = Depends(get_db),
) -> SpeciesTotalsResponse:
    try:
        return await get_species_totals_for_year(db, year)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail="Failed to load species totals"
        ) from exc
