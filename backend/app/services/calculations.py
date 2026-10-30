"""Pure calculation helpers for the analytics endpoints.

Nothing in here touches the database or FastAPI, so every function can be
unit tested with plain Python values.

Conventions
-----------
* "Day of year" (``doy``) runs 1-365 on a fixed non-leap calendar. Feb 29 is
  folded into Feb 28 so a given calendar day has the same index every year,
  which is what makes years comparable on one axis.
* Run-timing maths clamps negative daily counts to zero. The source data
  contains small negative corrections that would otherwise make a cumulative
  curve step backwards.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Optional, Sequence

DAYS_IN_YEAR = 365
WEEKS_IN_YEAR = 52


def day_of_year(day: date) -> int:
    """Return the 1-365 day index of ``day`` on a fixed non-leap calendar."""
    folded = day.replace(day=28) if day.month == 2 and day.day == 29 else day
    return date(2001, folded.month, folded.day).timetuple().tm_yday


def week_of_year(doy: int) -> int:
    """Map a 1-365 day index to a 1-52 week index (week 52 absorbs the tail)."""
    return min((doy - 1) // 7 + 1, WEEKS_IN_YEAR)


def build_daily_array(rows: Sequence[tuple[date, int]]) -> List[int]:
    """Spread (date, count) rows over a 365-slot array, clamping negatives to 0."""
    daily = [0] * DAYS_IN_YEAR
    for day, count in rows:
        daily[day_of_year(day) - 1] += max(count, 0)
    return daily


def cumulative(values: Sequence[float]) -> List[float]:
    """Running sum of ``values``."""
    running = 0.0
    result: List[float] = []
    for value in values:
        running += value
        result.append(running)
    return result


def safe_ratio(numerator: float, denominator: float) -> Optional[float]:
    """``numerator / denominator``, or ``None`` when the denominator is not positive."""
    if denominator <= 0:
        return None
    return numerator / denominator


# --------------------------------------------------------------------------
# Run timing
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class RunTiming:
    """Timing landmarks for one year's run, as 1-365 day indexes."""

    total: int
    first_doy: int
    last_doy: int
    peak_doy: int
    p10_doy: int
    p50_doy: int
    p90_doy: int


def compute_timing(daily: Sequence[int]) -> Optional[RunTiming]:
    """Return timing landmarks for one year, or ``None`` if no fish were counted."""
    total = sum(daily)
    if total <= 0:
        return None

    running = cumulative(daily)

    def crossing(fraction: float) -> int:
        threshold = total * fraction
        for index, value in enumerate(running):
            if value >= threshold:
                return index + 1
        return len(running)

    nonzero = [index for index, value in enumerate(daily) if value > 0]
    peak_index = max(range(len(daily)), key=lambda index: daily[index])
    return RunTiming(
        total=total,
        first_doy=nonzero[0] + 1,
        last_doy=nonzero[-1] + 1,
        peak_doy=peak_index + 1,
        p10_doy=crossing(0.10),
        p50_doy=crossing(0.50),
        p90_doy=crossing(0.90),
    )


@dataclass(frozen=True)
class BandPoint:
    """Mean and range of several series at one position."""

    average: float
    low: float
    high: float


def summarize_band(series: Sequence[Sequence[float]]) -> List[BandPoint]:
    """Per-position mean/min/max across equally long series."""
    if not series:
        return []
    length = len(series[0])
    band: List[BandPoint] = []
    for position in range(length):
        column = [one[position] for one in series]
        band.append(
            BandPoint(
                average=sum(column) / len(column),
                low=min(column),
                high=max(column),
            )
        )
    return band


def percent_curve(daily: Sequence[int]) -> List[float]:
    """Cumulative percent (0-100) of the year's own total for each day."""
    total = sum(daily)
    if total <= 0:
        return [0.0] * len(daily)
    return [value / total * 100.0 for value in cumulative(daily)]


# --------------------------------------------------------------------------
# Regression
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class LinearFit:
    """Ordinary least squares fit of ``y = intercept + slope * x``."""

    slope: float
    intercept: float
    r_squared: float
    residual_std_error: float
    n: int

    def predict(self, x: float) -> float:
        return self.intercept + self.slope * x


def linear_fit(xs: Sequence[float], ys: Sequence[float]) -> Optional[LinearFit]:
    """Fit a line by least squares. Needs at least 3 points and varying ``xs``."""
    n = len(xs)
    if n != len(ys) or n < 3:
        return None

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    sxx = sum((x - mean_x) ** 2 for x in xs)
    if sxx == 0:
        return None

    sxy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    slope = sxy / sxx
    intercept = mean_y - slope * mean_x

    ss_tot = sum((y - mean_y) ** 2 for y in ys)
    ss_res = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(xs, ys))
    r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
    return LinearFit(
        slope=slope,
        intercept=intercept,
        r_squared=r_squared,
        residual_std_error=math.sqrt(ss_res / (n - 2)),
        n=n,
    )


# --------------------------------------------------------------------------
# Jack -> adult sibling relationship
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class SiblingPair:
    """Jacks counted in ``jack_year`` alongside adults counted the year after."""

    jack_year: int
    adult_year: int
    jacks: int
    adults: int
    adults_in_progress: bool


def build_sibling_pairs(
    jacks_by_year: Dict[int, int],
    adults_by_year: Dict[int, int],
    in_progress_year: int,
) -> List[SiblingPair]:
    """Pair each year's jack total with the following year's adult total."""
    pairs: List[SiblingPair] = []
    for jack_year in sorted(jacks_by_year):
        adult_year = jack_year + 1
        if adult_year not in adults_by_year:
            continue
        pairs.append(
            SiblingPair(
                jack_year=jack_year,
                adult_year=adult_year,
                jacks=max(jacks_by_year[jack_year], 0),
                adults=max(adults_by_year[adult_year], 0),
                adults_in_progress=adult_year >= in_progress_year,
            )
        )
    return pairs


def fit_sibling_pairs(pairs: Sequence[SiblingPair]) -> Optional[LinearFit]:
    """Fit adults against prior-year jacks, leaving out incomplete adult years."""
    complete = [pair for pair in pairs if not pair.adults_in_progress]
    return linear_fit(
        [float(pair.jacks) for pair in complete],
        [float(pair.adults) for pair in complete],
    )
