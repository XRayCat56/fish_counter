from __future__ import annotations

from collections import defaultdict
from datetime import date

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.counts import CountClass, DailyCount, Location, Species
from app.schemas.counts import (
    DailyCountPoint,
    LocationTotal,
    LocationTotalsResponse,
    MonthlyCountPoint,
    MonthlyCountsResponse,
    LocationYearSeries,
    SpeciesInfo,
    SpeciesListResponse,
    SpeciesLocationCountsResponse,
    SpeciesMonthlySeries,
    SpeciesTotal,
    SpeciesTotalsResponse,
    SpeciesYearSeries,
    SpeciesYearlyTotalsResponse,
    LocationYearlyTotals,
    YearCountsResponse,
    YearlyTotalPoint,
)


class SpeciesNotFoundError(Exception):
    """Raised when a species code does not exist."""


async def get_counts_for_year(db: AsyncSession, year: int) -> YearCountsResponse:
    """Return daily total counts per species for a year.

    Species with no rows for the year are omitted. Counts are summed across
    all dam locations using the 'total' count class.
    """
    stmt = (
        select(
            Species.code,
            Species.name,
            DailyCount.count_date,
            func.sum(DailyCount.fish_count).label("daily_total"),
        )
        .join(Species, Species.id == DailyCount.species_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            extract("year", DailyCount.count_date) == year,
        )
        .group_by(Species.code, Species.name, DailyCount.count_date)
        .order_by(Species.name, DailyCount.count_date)
    )
    result = await db.execute(stmt)
    rows = result.all()

    grouped: dict[tuple[str, str], list[DailyCountPoint]] = defaultdict(list)
    for code, name, count_date, daily_total in rows:
        assert isinstance(count_date, date)
        grouped[(code, name)].append(
            DailyCountPoint(date=count_date, count=int(daily_total))
        )

    species_series = [
        SpeciesYearSeries(code=code, name=name, counts=points)
        for (code, name), points in grouped.items()
        if points
    ]
    species_series.sort(key=lambda series: series.name)

    return YearCountsResponse(year=year, species=species_series)


def _year_range(year: int) -> tuple[date, date]:
    """Half-open date range [start, end) covering a calendar year."""
    return date(year, 1, 1), date(year + 1, 1, 1)


async def get_monthly_counts_for_year(
    db: AsyncSession, year: int
) -> MonthlyCountsResponse:
    """Return monthly total counts per species for a year.

    Only months with data are included for each species. Counts are summed
    across all dam locations using the 'total' count class.
    """
    start, end = _year_range(year)
    month_expr = extract("month", DailyCount.count_date)
    stmt = (
        select(
            Species.code,
            Species.name,
            month_expr.label("month"),
            func.sum(DailyCount.fish_count).label("monthly_total"),
        )
        .join(Species, Species.id == DailyCount.species_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            DailyCount.count_date >= start,
            DailyCount.count_date < end,
        )
        .group_by(Species.code, Species.name, month_expr)
        .order_by(Species.name, month_expr)
    )
    rows = (await db.execute(stmt)).all()

    grouped: dict[tuple[str, str], list[MonthlyCountPoint]] = defaultdict(list)
    for code, name, month, monthly_total in rows:
        grouped[(code, name)].append(
            MonthlyCountPoint(month=int(month), count=int(monthly_total))
        )

    species_series = [
        SpeciesMonthlySeries(code=code, name=name, counts=points)
        for (code, name), points in grouped.items()
    ]
    species_series.sort(key=lambda series: series.name)

    return MonthlyCountsResponse(year=year, species=species_series)


async def get_location_totals_for_year(
    db: AsyncSession, year: int
) -> LocationTotalsResponse:
    """Return total fish counts (all species) per dam location for a year."""
    start, end = _year_range(year)
    total = func.sum(DailyCount.fish_count).label("location_total")
    stmt = (
        select(Location.code, Location.name, total)
        .join(Location, Location.id == DailyCount.location_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            DailyCount.count_date >= start,
            DailyCount.count_date < end,
        )
        .group_by(Location.code, Location.name, Location.sort_order)
        .order_by(Location.sort_order)
    )
    rows = (await db.execute(stmt)).all()

    return LocationTotalsResponse(
        year=year,
        locations=[
            LocationTotal(code=code, name=name, total=int(location_total))
            for code, name, location_total in rows
        ],
    )


async def get_species_totals_for_year(
    db: AsyncSession, year: int
) -> SpeciesTotalsResponse:
    """Return total fish counts per species for a year (all dams combined)."""
    start, end = _year_range(year)
    total = func.sum(DailyCount.fish_count).label("species_total")
    stmt = (
        select(Species.code, Species.name, total)
        .join(Species, Species.id == DailyCount.species_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            DailyCount.count_date >= start,
            DailyCount.count_date < end,
        )
        .group_by(Species.code, Species.name)
        .order_by(Species.name)
    )
    rows = (await db.execute(stmt)).all()

    return SpeciesTotalsResponse(
        year=year,
        species=[
            SpeciesTotal(code=code, name=name, total=int(species_total))
            for code, name, species_total in rows
        ],
    )


async def get_species_list(db: AsyncSession) -> SpeciesListResponse:
    """Return all species, ordered by name."""
    stmt = select(Species.code, Species.name).order_by(Species.name)
    rows = (await db.execute(stmt)).all()
    return SpeciesListResponse(
        species=[SpeciesInfo(code=code, name=name) for code, name in rows]
    )


async def get_species_location_counts_for_year(
    db: AsyncSession, year: int, species_code: str
) -> SpeciesLocationCountsResponse:
    """Return daily total counts per dam location for one species and year.

    Locations with no rows for the year are omitted and are ordered
    downstream to upstream.
    """
    species_row = (
        await db.execute(
            select(Species.code, Species.name).where(Species.code == species_code)
        )
    ).one_or_none()
    if species_row is None:
        raise SpeciesNotFoundError(species_code)
    species_name: str = species_row.name

    start, end = _year_range(year)
    stmt = (
        select(
            Location.code,
            Location.name,
            DailyCount.count_date,
            func.sum(DailyCount.fish_count).label("daily_total"),
        )
        .join(Location, Location.id == DailyCount.location_id)
        .join(Species, Species.id == DailyCount.species_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            Species.code == species_code,
            DailyCount.count_date >= start,
            DailyCount.count_date < end,
        )
        .group_by(
            Location.code, Location.name, Location.sort_order, DailyCount.count_date
        )
        .order_by(Location.sort_order, DailyCount.count_date)
    )
    rows = (await db.execute(stmt)).all()

    grouped: dict[tuple[str, str], list[DailyCountPoint]] = {}
    for code, name, count_date, daily_total in rows:
        grouped.setdefault((code, name), []).append(
            DailyCountPoint(date=count_date, count=int(daily_total))
        )

    return SpeciesLocationCountsResponse(
        year=year,
        species_code=species_code,
        species_name=species_name,
        locations=[
            LocationYearSeries(code=code, name=name, counts=points)
            for (code, name), points in grouped.items()
        ],
    )


async def get_species_yearly_totals_by_location(
    db: AsyncSession, species_code: str
) -> SpeciesYearlyTotalsResponse:
    """Return yearly total counts per dam location for one species.

    Covers every year with data. Locations with no rows are omitted and are
    ordered downstream to upstream.
    """
    species_row = (
        await db.execute(
            select(Species.code, Species.name).where(Species.code == species_code)
        )
    ).one_or_none()
    if species_row is None:
        raise SpeciesNotFoundError(species_code)
    species_name: str = species_row.name

    year_expr = extract("year", DailyCount.count_date)
    stmt = (
        select(
            Location.code,
            Location.name,
            year_expr.label("year"),
            func.sum(DailyCount.fish_count).label("yearly_total"),
        )
        .join(Location, Location.id == DailyCount.location_id)
        .join(Species, Species.id == DailyCount.species_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(CountClass.code == "total", Species.code == species_code)
        .group_by(Location.code, Location.name, Location.sort_order, year_expr)
        .order_by(Location.sort_order, year_expr)
    )
    rows = (await db.execute(stmt)).all()

    grouped: dict[tuple[str, str], list[YearlyTotalPoint]] = {}
    for code, name, year, yearly_total in rows:
        grouped.setdefault((code, name), []).append(
            YearlyTotalPoint(year=int(year), total=int(yearly_total))
        )

    return SpeciesYearlyTotalsResponse(
        species_code=species_code,
        species_name=species_name,
        locations=[
            LocationYearlyTotals(code=code, name=name, totals=points)
            for (code, name), points in grouped.items()
        ],
    )
