from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.counts import MAX_YEAR, MIN_YEAR
from app.core.database import get_db
from app.schemas.analytics import (
    ClassCompositionResponse,
    DamConversionResponse,
    LocationListResponse,
    RunCurveResponse,
    RunTimingResponse,
    SiblingForecastResponse,
    WeeklyHeatmapResponse,
)
from app.services.analytics import (
    DEFAULT_BASELINE_YEARS,
    get_class_composition,
    get_dam_conversion,
    get_location_list,
    get_run_curve,
    get_run_timing,
    get_sibling_forecast,
    get_weekly_heatmap,
)

router = APIRouter(prefix="/api", tags=["analytics"])

DEFAULT_LOCATION = "BON"

SpeciesCodePath = Path(..., min_length=1, max_length=64)
LocationQuery = Query(DEFAULT_LOCATION, min_length=2, max_length=8)


@router.get("/locations", response_model=LocationListResponse)
async def read_location_list(db: AsyncSession = Depends(get_db)) -> LocationListResponse:
    return await get_location_list(db)


@router.get("/species/{species_code}/run-timing", response_model=RunTimingResponse)
async def read_run_timing(
    species_code: str = SpeciesCodePath,
    location: str = LocationQuery,
    db: AsyncSession = Depends(get_db),
) -> RunTimingResponse:
    return await get_run_timing(db, species_code, location.upper())


@router.get(
    "/species/{species_code}/run-timing/{year}/curve",
    response_model=RunCurveResponse,
)
async def read_run_curve(
    species_code: str = SpeciesCodePath,
    year: int = Path(..., ge=MIN_YEAR, le=MAX_YEAR),
    location: str = LocationQuery,
    baseline_years: int = Query(DEFAULT_BASELINE_YEARS, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
) -> RunCurveResponse:
    return await get_run_curve(db, species_code, location.upper(), year, baseline_years)


@router.get(
    "/species/{species_code}/class-composition",
    response_model=ClassCompositionResponse,
)
async def read_class_composition(
    species_code: str = SpeciesCodePath,
    db: AsyncSession = Depends(get_db),
) -> ClassCompositionResponse:
    return await get_class_composition(db, species_code)


@router.get(
    "/species/{species_code}/sibling-forecast",
    response_model=SiblingForecastResponse,
)
async def read_sibling_forecast(
    species_code: str = SpeciesCodePath,
    location: str = LocationQuery,
    db: AsyncSession = Depends(get_db),
) -> SiblingForecastResponse:
    return await get_sibling_forecast(db, species_code, location.upper())


@router.get(
    "/species/{species_code}/dam-conversion",
    response_model=DamConversionResponse,
)
async def read_dam_conversion(
    species_code: str = SpeciesCodePath,
    reference: str = Query(DEFAULT_LOCATION, min_length=2, max_length=8),
    db: AsyncSession = Depends(get_db),
) -> DamConversionResponse:
    return await get_dam_conversion(db, species_code, reference.upper())


@router.get(
    "/species/{species_code}/weekly-heatmap",
    response_model=WeeklyHeatmapResponse,
)
async def read_weekly_heatmap(
    species_code: str = SpeciesCodePath,
    location: str = LocationQuery,
    db: AsyncSession = Depends(get_db),
) -> WeeklyHeatmapResponse:
    return await get_weekly_heatmap(db, species_code, location.upper())
