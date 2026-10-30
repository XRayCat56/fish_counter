from typing import Optional

from pydantic import BaseModel, Field

DOY_DESCRIPTION = "Day of year on a fixed non-leap calendar (1-365)"


class LocationInfo(BaseModel):
    code: str
    name: str
    river: Optional[str]
    sort_order: int = Field(description="Position along the river, downstream to upstream")


class LocationListResponse(BaseModel):
    locations: list[LocationInfo]


# ---- Run timing ---------------------------------------------------------


class YearTimingPoint(BaseModel):
    year: int
    total: int = Field(description="Fish counted at this dam during the year")
    first_doy: int = Field(description=DOY_DESCRIPTION)
    last_doy: int = Field(description=DOY_DESCRIPTION)
    peak_doy: int = Field(description=DOY_DESCRIPTION)
    p10_doy: int = Field(description="Day by which 10% of the run had passed")
    p50_doy: int = Field(description="Day by which 50% of the run had passed")
    p90_doy: int = Field(description="Day by which 90% of the run had passed")
    in_progress: bool = Field(description="True while the year is still being counted")


class TrendFit(BaseModel):
    slope_per_year: float = Field(description="Change in the metric per calendar year")
    intercept: float
    r_squared: float
    n: int


class RunTimingResponse(BaseModel):
    species_code: str
    species_name: str
    location_code: str
    location_name: str
    years: list[YearTimingPoint]
    p50_trend: Optional[TrendFit] = Field(
        description="Trend of the 50% passage day over complete years"
    )


class CurvePoint(BaseModel):
    doy: int = Field(description=DOY_DESCRIPTION)
    year_pct: Optional[float] = Field(description="Cumulative percent of the year's run")
    year_count: Optional[int] = Field(description="Cumulative fish counted in the year")
    baseline_avg_pct: Optional[float]
    baseline_min_pct: Optional[float]
    baseline_max_pct: Optional[float]
    baseline_avg_count: Optional[float]
    baseline_min_count: Optional[float]
    baseline_max_count: Optional[float]


class PassageDays(BaseModel):
    p10_doy: float
    p50_doy: float
    p90_doy: float


class RunCurveResponse(BaseModel):
    species_code: str
    species_name: str
    location_code: str
    location_name: str
    year: int
    in_progress: bool
    last_data_doy: Optional[int] = Field(
        description="Last day of the year with a count, or null if the year has none"
    )
    year_timing: Optional[PassageDays]
    baseline_years: list[int]
    baseline_timing: Optional[PassageDays] = Field(
        description="Average passage days across the baseline years"
    )
    points: list[CurvePoint]


# ---- Composition ----------------------------------------------------------


class ClassInfo(BaseModel):
    code: str
    name: str


class CompositionYear(BaseModel):
    year: int
    counts: dict[str, int] = Field(description="Fish counted per class code")
    in_progress: bool


class LocationComposition(BaseModel):
    code: str
    name: str
    years: list[CompositionYear]


class ClassCompositionResponse(BaseModel):
    species_code: str
    species_name: str
    classes: list[ClassInfo] = Field(description="Non-total classes recorded for the species")
    locations: list[LocationComposition]


# ---- Jack -> adult sibling forecast ----------------------------------------


class SiblingPairPoint(BaseModel):
    jack_year: int
    adult_year: int
    jacks: int
    adults: int
    predicted_adults: Optional[float]
    adults_in_progress: bool = Field(
        description="True when the adult year is still being counted, so it is left out of the fit"
    )


class SiblingFit(BaseModel):
    slope: float
    intercept: float
    r_squared: float
    residual_std_error: float
    n: int


class SiblingForecast(BaseModel):
    jack_year: int
    adult_year: int
    jacks: int
    predicted_adults: float
    predicted_low: float = Field(description="Prediction minus one residual standard error")
    predicted_high: float = Field(description="Prediction plus one residual standard error")
    jacks_in_progress: bool = Field(
        description="True when the jack year is incomplete, so the forecast is likely low"
    )


class SiblingForecastResponse(BaseModel):
    species_code: str
    species_name: str
    location_code: str
    location_name: str
    pairs: list[SiblingPairPoint]
    fit: Optional[SiblingFit]
    forecast: Optional[SiblingForecast]


# ---- Dam-to-dam conversion ---------------------------------------------------


class DamConversionPoint(BaseModel):
    year: int
    total: int = Field(description="Fish counted at this dam over the whole year")
    days_counted: int = Field(description="Days with a count recorded at this dam")
    matched_days: int = Field(
        description="Days with a count recorded at both this dam and the reference dam"
    )
    ratio: Optional[float] = Field(
        description=(
            "Fish counted here divided by fish counted at the reference dam, "
            "using only days both dams recorded counts"
        )
    )
    in_progress: bool


class DamConversionSeries(BaseModel):
    code: str
    name: str
    river: Optional[str]
    years: list[DamConversionPoint]


class DamConversionResponse(BaseModel):
    species_code: str
    species_name: str
    reference_code: str
    reference_name: str
    locations: list[DamConversionSeries] = Field(
        description="Dams ordered downstream to upstream, including the reference dam"
    )


# ---- Weekly heatmap -------------------------------------------------------------


class HeatmapCell(BaseModel):
    year: int
    week: int = Field(ge=1, le=52)
    count: int


class WeeklyHeatmapResponse(BaseModel):
    species_code: str
    species_name: str
    location_code: str
    location_name: str
    cells: list[HeatmapCell] = Field(
        description="Weekly totals. Weeks with no recorded counts are omitted."
    )
