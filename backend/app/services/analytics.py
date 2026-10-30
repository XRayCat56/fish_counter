"""Analytics queries: run timing, composition, sibling forecast, dam conversion, heatmap.

Database access lives here; the maths lives in ``app.services.calculations``.
All series use the ``total`` count class unless a function says otherwise.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import and_, case, distinct, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.counts import CountClass, DailyCount, Location, Species
from app.schemas.analytics import (
    ClassCompositionResponse,
    ClassInfo,
    CompositionYear,
    CurvePoint,
    DamConversionPoint,
    DamConversionResponse,
    DamConversionSeries,
    HeatmapCell,
    LocationComposition,
    LocationInfo,
    LocationListResponse,
    PassageDays,
    RunCurveResponse,
    RunTimingResponse,
    SiblingFit,
    SiblingForecast,
    SiblingForecastResponse,
    SiblingPairPoint,
    TrendFit,
    WeeklyHeatmapResponse,
    YearTimingPoint,
)
from app.services.calculations import (
    DAYS_IN_YEAR,
    BandPoint,
    LinearFit,
    build_daily_array,
    build_sibling_pairs,
    compute_timing,
    cumulative,
    day_of_year,
    fit_sibling_pairs,
    linear_fit,
    percent_curve,
    safe_ratio,
    summarize_band,
    week_of_year,
)
from app.services.counts import SpeciesNotFoundError

# Years with fewer fish than this are skipped for timing: percentiles of a
# handful of fish say nothing about when the run happens.
MIN_TIMING_TOTAL = 100

DEFAULT_BASELINE_YEARS = 10

DailyRows = list[tuple[date, int]]


class LocationNotFoundError(Exception):
    """Raised when a dam location code does not exist."""


class ClassNotAvailableError(Exception):
    """Raised when a species does not record the count classes an analysis needs."""


def _current_year() -> int:
    return date.today().year


async def _require_species(db: AsyncSession, species_code: str) -> tuple[str, str]:
    row = (
        await db.execute(
            select(Species.code, Species.name).where(Species.code == species_code)
        )
    ).one_or_none()
    if row is None:
        raise SpeciesNotFoundError(species_code)
    return row.code, row.name


async def _require_location(db: AsyncSession, location_code: str) -> tuple[str, str]:
    row = (
        await db.execute(
            select(Location.code, Location.name).where(Location.code == location_code)
        )
    ).one_or_none()
    if row is None:
        raise LocationNotFoundError(location_code)
    return row.code, row.name


async def _load_daily_rows_by_year(
    db: AsyncSession, species_code: str, location_code: str
) -> dict[int, DailyRows]:
    """Daily ``total`` counts for one species at one dam, grouped by year."""
    stmt = (
        select(DailyCount.count_date, DailyCount.fish_count)
        .join(Species, Species.id == DailyCount.species_id)
        .join(Location, Location.id == DailyCount.location_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code == "total",
            Species.code == species_code,
            Location.code == location_code,
        )
        .order_by(DailyCount.count_date)
    )
    grouped: dict[int, DailyRows] = defaultdict(list)
    for count_date, fish_count in (await db.execute(stmt)).all():
        grouped[count_date.year].append((count_date, int(fish_count)))
    return dict(grouped)


async def _load_yearly_class_totals(
    db: AsyncSession,
    species_code: str,
    location_code: str,
    class_codes: Sequence[str],
) -> dict[str, dict[int, int]]:
    """Yearly totals per class for one species at one dam."""
    year_expr = extract("year", DailyCount.count_date)
    stmt = (
        select(CountClass.code, year_expr, func.sum(DailyCount.fish_count))
        .join(Species, Species.id == DailyCount.species_id)
        .join(Location, Location.id == DailyCount.location_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(
            CountClass.code.in_(class_codes),
            Species.code == species_code,
            Location.code == location_code,
        )
        .group_by(CountClass.code, year_expr)
    )
    totals: dict[str, dict[int, int]] = {code: {} for code in class_codes}
    for class_code, year, total in (await db.execute(stmt)).all():
        totals[class_code][int(year)] = int(total)
    return totals


# --------------------------------------------------------------------------
# Locations
# --------------------------------------------------------------------------


async def get_location_list(db: AsyncSession) -> LocationListResponse:
    """Return all dams ordered downstream to upstream."""
    stmt = select(
        Location.code, Location.name, Location.river, Location.sort_order
    ).order_by(Location.sort_order)
    rows = (await db.execute(stmt)).all()
    return LocationListResponse(
        locations=[
            LocationInfo(code=code, name=name, river=river, sort_order=sort_order)
            for code, name, river, sort_order in rows
        ]
    )


# --------------------------------------------------------------------------
# Run timing
# --------------------------------------------------------------------------


async def get_run_timing(
    db: AsyncSession, species_code: str, location_code: str
) -> RunTimingResponse:
    """Timing landmarks (first, 10/50/90%, peak, last) for every year at one dam."""
    species_code, species_name = await _require_species(db, species_code)
    location_code, location_name = await _require_location(db, location_code)
    rows_by_year = await _load_daily_rows_by_year(db, species_code, location_code)
    current_year = _current_year()

    points: list[YearTimingPoint] = []
    for year in sorted(rows_by_year):
        timing = compute_timing(build_daily_array(rows_by_year[year]))
        if timing is None or timing.total < MIN_TIMING_TOTAL:
            continue
        points.append(
            YearTimingPoint(
                year=year,
                total=timing.total,
                first_doy=timing.first_doy,
                last_doy=timing.last_doy,
                peak_doy=timing.peak_doy,
                p10_doy=timing.p10_doy,
                p50_doy=timing.p50_doy,
                p90_doy=timing.p90_doy,
                in_progress=year >= current_year,
            )
        )

    # A partly counted year would bias the median day late or early.
    complete = [point for point in points if not point.in_progress]
    fit = linear_fit(
        [float(point.year) for point in complete],
        [float(point.p50_doy) for point in complete],
    )

    return RunTimingResponse(
        species_code=species_code,
        species_name=species_name,
        location_code=location_code,
        location_name=location_name,
        years=points,
        p50_trend=_to_trend(fit),
    )


def _to_trend(fit: Optional[LinearFit]) -> Optional[TrendFit]:
    if fit is None:
        return None
    return TrendFit(
        slope_per_year=fit.slope,
        intercept=fit.intercept,
        r_squared=fit.r_squared,
        n=fit.n,
    )


def _round_or_none(value: Optional[float], digits: int) -> Optional[float]:
    return None if value is None else round(value, digits)


async def get_run_curve(
    db: AsyncSession,
    species_code: str,
    location_code: str,
    year: int,
    baseline_count: int = DEFAULT_BASELINE_YEARS,
) -> RunCurveResponse:
    """Cumulative passage curve for one year against the preceding years' band."""
    species_code, species_name = await _require_species(db, species_code)
    location_code, location_name = await _require_location(db, location_code)
    rows_by_year = await _load_daily_rows_by_year(db, species_code, location_code)
    current_year = _current_year()

    year_rows = rows_by_year.get(year, [])
    year_daily = build_daily_array(year_rows)
    year_timing = compute_timing(year_daily)
    in_progress = year >= current_year
    last_data_doy = (
        max(day_of_year(day) for day, _ in year_rows) if year_rows else None
    )

    # Baseline: the most recent complete years before the selected one.
    baseline_years: list[int] = []
    baseline_daily: list[list[int]] = []
    baseline_passages: list[PassageDays] = []
    for candidate in sorted(rows_by_year, reverse=True):
        if len(baseline_years) >= baseline_count:
            break
        if candidate >= year or candidate >= current_year:
            continue
        daily = build_daily_array(rows_by_year[candidate])
        timing = compute_timing(daily)
        if timing is None or timing.total < MIN_TIMING_TOTAL:
            continue
        baseline_years.append(candidate)
        baseline_daily.append(daily)
        baseline_passages.append(
            PassageDays(
                p10_doy=timing.p10_doy,
                p50_doy=timing.p50_doy,
                p90_doy=timing.p90_doy,
            )
        )
    baseline_years.sort()

    pct_band: list[BandPoint] = summarize_band(
        [percent_curve(daily) for daily in baseline_daily]
    )
    count_band: list[BandPoint] = summarize_band(
        [cumulative(daily) for daily in baseline_daily]
    )

    year_pct = percent_curve(year_daily)
    year_count = cumulative(year_daily)
    has_year_data = year_timing is not None

    points: list[CurvePoint] = []
    for index in range(DAYS_IN_YEAR):
        doy = index + 1
        # An unfinished year has no data after its last counted day.
        show_year = has_year_data and (
            not in_progress or (last_data_doy is not None and doy <= last_data_doy)
        )
        pct = pct_band[index] if pct_band else None
        cnt = count_band[index] if count_band else None
        points.append(
            CurvePoint(
                doy=doy,
                year_pct=round(year_pct[index], 2) if show_year else None,
                year_count=int(year_count[index]) if show_year else None,
                baseline_avg_pct=_round_or_none(pct.average if pct else None, 2),
                baseline_min_pct=_round_or_none(pct.low if pct else None, 2),
                baseline_max_pct=_round_or_none(pct.high if pct else None, 2),
                baseline_avg_count=_round_or_none(cnt.average if cnt else None, 1),
                baseline_min_count=_round_or_none(cnt.low if cnt else None, 1),
                baseline_max_count=_round_or_none(cnt.high if cnt else None, 1),
            )
        )

    return RunCurveResponse(
        species_code=species_code,
        species_name=species_name,
        location_code=location_code,
        location_name=location_name,
        year=year,
        in_progress=in_progress,
        last_data_doy=last_data_doy,
        year_timing=(
            PassageDays(
                p10_doy=year_timing.p10_doy,
                p50_doy=year_timing.p50_doy,
                p90_doy=year_timing.p90_doy,
            )
            if year_timing is not None
            else None
        ),
        baseline_years=baseline_years,
        baseline_timing=_average_passage(baseline_passages),
        points=points,
    )


def _average_passage(passages: Sequence[PassageDays]) -> Optional[PassageDays]:
    if not passages:
        return None
    count = len(passages)
    return PassageDays(
        p10_doy=round(sum(p.p10_doy for p in passages) / count, 1),
        p50_doy=round(sum(p.p50_doy for p in passages) / count, 1),
        p90_doy=round(sum(p.p90_doy for p in passages) / count, 1),
    )


# --------------------------------------------------------------------------
# Composition (adult/jack, clipped/unclipped)
# --------------------------------------------------------------------------


async def get_class_composition(
    db: AsyncSession, species_code: str
) -> ClassCompositionResponse:
    """Yearly totals of each non-total class, for every dam."""
    species_code, species_name = await _require_species(db, species_code)
    current_year = _current_year()

    year_expr = extract("year", DailyCount.count_date)
    stmt = (
        select(
            Location.code,
            Location.name,
            CountClass.id,
            CountClass.code,
            CountClass.name,
            year_expr,
            func.sum(DailyCount.fish_count),
        )
        .join(Species, Species.id == DailyCount.species_id)
        .join(Location, Location.id == DailyCount.location_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .where(Species.code == species_code, CountClass.is_total.is_(False))
        .group_by(
            Location.code,
            Location.name,
            Location.sort_order,
            CountClass.id,
            CountClass.code,
            CountClass.name,
            year_expr,
        )
        .order_by(Location.sort_order, year_expr, CountClass.id)
    )
    rows = (await db.execute(stmt)).all()
    if not rows:
        raise ClassNotAvailableError(species_code)

    classes: dict[int, ClassInfo] = {}
    # location code -> (name, {year: {class code: total}}), insertion-ordered.
    by_location: dict[str, tuple[str, dict[int, dict[str, int]]]] = {}
    for loc_code, loc_name, class_id, class_code, class_name, year, total in rows:
        classes.setdefault(class_id, ClassInfo(code=class_code, name=class_name))
        _, years = by_location.setdefault(loc_code, (loc_name, {}))
        years.setdefault(int(year), {})[class_code] = int(total)

    return ClassCompositionResponse(
        species_code=species_code,
        species_name=species_name,
        classes=[classes[class_id] for class_id in sorted(classes)],
        locations=[
            LocationComposition(
                code=loc_code,
                name=loc_name,
                years=[
                    CompositionYear(
                        year=year,
                        counts=counts,
                        in_progress=year >= current_year,
                    )
                    for year, counts in sorted(years.items())
                ],
            )
            for loc_code, (loc_name, years) in by_location.items()
        ],
    )


# --------------------------------------------------------------------------
# Jack -> adult sibling forecast
# --------------------------------------------------------------------------


async def get_sibling_forecast(
    db: AsyncSession, species_code: str, location_code: str
) -> SiblingForecastResponse:
    """Regress adult returns on the previous year's jack returns at one dam."""
    species_code, species_name = await _require_species(db, species_code)
    location_code, location_name = await _require_location(db, location_code)
    current_year = _current_year()

    totals = await _load_yearly_class_totals(
        db, species_code, location_code, ("adult", "jack")
    )
    jacks_by_year = totals["jack"]
    adults_by_year = totals["adult"]
    if not jacks_by_year or not adults_by_year:
        raise ClassNotAvailableError(species_code)

    pairs = build_sibling_pairs(jacks_by_year, adults_by_year, current_year)
    fit = fit_sibling_pairs(pairs)

    pair_points = [
        SiblingPairPoint(
            jack_year=pair.jack_year,
            adult_year=pair.adult_year,
            jacks=pair.jacks,
            adults=pair.adults,
            predicted_adults=(
                max(fit.predict(pair.jacks), 0.0) if fit is not None else None
            ),
            adults_in_progress=pair.adults_in_progress,
        )
        for pair in pairs
    ]

    forecast: Optional[SiblingForecast] = None
    if fit is not None:
        jack_year = max(jacks_by_year)
        jacks = max(jacks_by_year[jack_year], 0)
        predicted = max(fit.predict(jacks), 0.0)
        forecast = SiblingForecast(
            jack_year=jack_year,
            adult_year=jack_year + 1,
            jacks=jacks,
            predicted_adults=predicted,
            predicted_low=max(predicted - fit.residual_std_error, 0.0),
            predicted_high=predicted + fit.residual_std_error,
            jacks_in_progress=jack_year >= current_year,
        )

    return SiblingForecastResponse(
        species_code=species_code,
        species_name=species_name,
        location_code=location_code,
        location_name=location_name,
        pairs=pair_points,
        fit=(
            SiblingFit(
                slope=fit.slope,
                intercept=fit.intercept,
                r_squared=fit.r_squared,
                residual_std_error=fit.residual_std_error,
                n=fit.n,
            )
            if fit is not None
            else None
        ),
        forecast=forecast,
    )


# --------------------------------------------------------------------------
# Dam-to-dam conversion
# --------------------------------------------------------------------------


async def get_dam_conversion(
    db: AsyncSession, species_code: str, reference_code: str
) -> DamConversionResponse:
    """Yearly totals at each dam, plus each dam's ratio to a reference dam.

    Dams count over different windows (Bonneville counts year-round, others only
    part of the year), so a plain ratio of yearly totals would read as fish lost
    when it is really counting-season mismatch. The ratio therefore only uses
    days on which both the dam and the reference dam recorded a count.
    """
    species_code, species_name = await _require_species(db, species_code)
    reference_code, reference_name = await _require_location(db, reference_code)
    current_year = _current_year()

    reference_count = aliased(DailyCount)
    reference_id = (
        select(Location.id).where(Location.code == reference_code).scalar_subquery()
    )
    has_reference = reference_count.fish_count.is_not(None)

    year_expr = extract("year", DailyCount.count_date)
    stmt = (
        select(
            Location.code,
            Location.name,
            Location.river,
            year_expr,
            func.sum(DailyCount.fish_count),
            func.count(distinct(DailyCount.count_date)),
            func.sum(case((has_reference, DailyCount.fish_count), else_=0)),
            func.sum(reference_count.fish_count),
            func.count(distinct(case((has_reference, DailyCount.count_date)))),
        )
        .select_from(DailyCount)
        .join(Species, Species.id == DailyCount.species_id)
        .join(Location, Location.id == DailyCount.location_id)
        .join(CountClass, CountClass.id == DailyCount.class_id)
        .outerjoin(
            reference_count,
            and_(
                reference_count.location_id == reference_id,
                reference_count.count_date == DailyCount.count_date,
                reference_count.species_id == DailyCount.species_id,
                reference_count.class_id == DailyCount.class_id,
            ),
        )
        .where(CountClass.code == "total", Species.code == species_code)
        .group_by(
            Location.code, Location.name, Location.river, Location.sort_order, year_expr
        )
        .order_by(Location.sort_order, year_expr)
    )
    rows = (await db.execute(stmt)).all()

    # code -> (name, river, points), insertion-ordered downstream to upstream.
    series: dict[str, tuple[str, Optional[str], list[DamConversionPoint]]] = {}
    for (
        code,
        name,
        river,
        year,
        total,
        days,
        matched_total,
        reference_matched_total,
        matched_days,
    ) in rows:
        year_int = int(year)
        ratio = safe_ratio(
            float(matched_total), float(reference_matched_total or 0)
        )
        _, _, points = series.setdefault(code, (name, river, []))
        points.append(
            DamConversionPoint(
                year=year_int,
                total=int(total),
                days_counted=int(days),
                matched_days=int(matched_days),
                ratio=round(ratio, 4) if ratio is not None else None,
                in_progress=year_int >= current_year,
            )
        )

    return DamConversionResponse(
        species_code=species_code,
        species_name=species_name,
        reference_code=reference_code,
        reference_name=reference_name,
        locations=[
            DamConversionSeries(code=code, name=name, river=river, years=points)
            for code, (name, river, points) in series.items()
        ],
    )


# --------------------------------------------------------------------------
# Weekly heatmap
# --------------------------------------------------------------------------


async def get_weekly_heatmap(
    db: AsyncSession, species_code: str, location_code: str
) -> WeeklyHeatmapResponse:
    """Weekly passage totals for every year at one dam."""
    species_code, species_name = await _require_species(db, species_code)
    location_code, location_name = await _require_location(db, location_code)
    rows_by_year = await _load_daily_rows_by_year(db, species_code, location_code)

    cells: list[HeatmapCell] = []
    for year in sorted(rows_by_year):
        weekly: dict[int, int] = {}
        for day, count in rows_by_year[year]:
            week = week_of_year(day_of_year(day))
            weekly[week] = weekly.get(week, 0) + max(count, 0)
        cells.extend(
            HeatmapCell(year=year, week=week, count=count)
            for week, count in sorted(weekly.items())
        )

    return WeeklyHeatmapResponse(
        species_code=species_code,
        species_name=species_name,
        location_code=location_code,
        location_name=location_name,
        cells=cells,
    )
