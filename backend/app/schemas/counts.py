from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DailyCountPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    count: int = Field(description="Daily fish count (summed across dams)")


class SpeciesYearSeries(BaseModel):
    code: str
    name: str
    counts: list[DailyCountPoint]


class YearCountsResponse(BaseModel):
    year: int
    species: list[SpeciesYearSeries]


class MonthlyCountPoint(BaseModel):
    month: int = Field(ge=1, le=12, description="Calendar month (1-12)")
    count: int = Field(description="Monthly fish count (summed across dams)")


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
    total: int = Field(description="Total fish count for the year (all dams)")


class SpeciesTotalsResponse(BaseModel):
    year: int
    species: list[SpeciesTotal]
