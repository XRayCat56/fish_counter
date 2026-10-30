from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DailyCountPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    count: int = Field(description="Daily dam passages (summed across dams; a fish is counted at each dam it climbs)")


class SpeciesYearSeries(BaseModel):
    code: str
    name: str
    counts: list[DailyCountPoint]


class YearCountsResponse(BaseModel):
    year: int
    species: list[SpeciesYearSeries]


class MonthlyCountPoint(BaseModel):
    month: int = Field(ge=1, le=12, description="Calendar month (1-12)")
    count: int = Field(description="Monthly dam passages (summed across dams; a fish is counted at each dam it climbs)")


class SpeciesMonthlySeries(BaseModel):
    code: str
    name: str
    counts: list[MonthlyCountPoint]


class MonthlyCountsResponse(BaseModel):
    year: int
    species: list[SpeciesMonthlySeries]


class LocationTotal(BaseModel):
    code: str
    name: str
    total: int = Field(description="Total fish count for the year at this dam")


class LocationTotalsResponse(BaseModel):
    year: int
    locations: list[LocationTotal]


class SpeciesTotal(BaseModel):
    code: str
    name: str
    total: int = Field(description="Total dam passages for the year (all dams; a fish is counted at each dam it climbs)")


class SpeciesTotalsResponse(BaseModel):
    year: int
    species: list[SpeciesTotal]


class SpeciesInfo(BaseModel):
    code: str
    name: str
    class_codes: list[str] = Field(
        default_factory=list,
        description="Count classes recorded for this species (total, adult, jack, ...)",
    )


class SpeciesListResponse(BaseModel):
    species: list[SpeciesInfo]


class LocationYearSeries(BaseModel):
    code: str
    name: str
    counts: list[DailyCountPoint]


class SpeciesLocationCountsResponse(BaseModel):
    year: int
    species_code: str
    species_name: str
    locations: list[LocationYearSeries]


class YearlyTotalPoint(BaseModel):
    year: int
    total: int = Field(description="Total fish count for the year at this dam")


class LocationYearlyTotals(BaseModel):
    code: str
    name: str
    totals: list[YearlyTotalPoint]


class SpeciesYearlyTotalsResponse(BaseModel):
    species_code: str
    species_name: str
    locations: list[LocationYearlyTotals]
