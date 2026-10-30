from __future__ import annotations

from datetime import date

import pytest

from app.services.calculations import (
    DAYS_IN_YEAR,
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


class TestDayOfYear:
    def test_new_years_day_is_one(self) -> None:
        assert day_of_year(date(2024, 1, 1)) == 1

    def test_year_end_is_365_even_in_leap_years(self) -> None:
        assert day_of_year(date(2023, 12, 31)) == 365
        assert day_of_year(date(2024, 12, 31)) == 365

    def test_same_calendar_day_has_same_index_in_leap_and_common_years(self) -> None:
        assert day_of_year(date(2024, 3, 1)) == day_of_year(date(2023, 3, 1)) == 60

    def test_leap_day_folds_into_feb_28(self) -> None:
        assert day_of_year(date(2024, 2, 29)) == day_of_year(date(2024, 2, 28)) == 59


class TestWeekOfYear:
    def test_first_and_last_days(self) -> None:
        assert week_of_year(1) == 1
        assert week_of_year(7) == 1
        assert week_of_year(8) == 2
        assert week_of_year(364) == 52
        assert week_of_year(DAYS_IN_YEAR) == 52


class TestBuildDailyArray:
    def test_places_counts_on_their_day_and_clamps_negatives(self) -> None:
        daily = build_daily_array(
            [(date(2023, 1, 1), 5), (date(2023, 1, 2), -3), (date(2023, 1, 3), 2)]
        )
        assert len(daily) == DAYS_IN_YEAR
        assert daily[:3] == [5, 0, 2]
        assert sum(daily) == 7

    def test_leap_day_counts_are_added_to_feb_28(self) -> None:
        daily = build_daily_array([(date(2024, 2, 28), 4), (date(2024, 2, 29), 6)])
        assert daily[58] == 10


class TestComputeTiming:
    def test_returns_none_for_an_empty_year(self) -> None:
        assert compute_timing([0] * DAYS_IN_YEAR) is None

    def test_landmarks_for_a_simple_run(self) -> None:
        daily = [0] * DAYS_IN_YEAR
        for index in range(99, 109):  # days 100-109, ten fish a day
            daily[index] = 10
        timing = compute_timing(daily)
        assert timing is not None
        assert timing.total == 100
        assert timing.first_doy == 100
        assert timing.last_doy == 109
        assert timing.p10_doy == 100
        assert timing.p50_doy == 104
        assert timing.p90_doy == 108
        assert timing.peak_doy == 100  # ties resolve to the earliest day

    def test_peak_is_the_busiest_day(self) -> None:
        daily = [0] * DAYS_IN_YEAR
        daily[49] = 5
        daily[199] = 90
        daily[299] = 5
        timing = compute_timing(daily)
        assert timing is not None
        assert timing.peak_doy == 200
        assert timing.p50_doy == 200


class TestPercentCurve:
    def test_reaches_100_and_is_monotonic(self) -> None:
        daily = [0] * DAYS_IN_YEAR
        daily[10] = 25
        daily[20] = 75
        curve = percent_curve(daily)
        assert curve[9] == 0.0
        assert curve[10] == pytest.approx(25.0)
        assert curve[-1] == pytest.approx(100.0)
        assert all(a <= b for a, b in zip(curve, curve[1:]))

    def test_all_zero_year_stays_at_zero(self) -> None:
        assert percent_curve([0, 0, 0]) == [0.0, 0.0, 0.0]


class TestSummarizeBand:
    def test_mean_min_max_per_position(self) -> None:
        band = summarize_band([[1.0, 4.0], [3.0, 8.0]])
        assert [point.average for point in band] == [2.0, 6.0]
        assert [point.low for point in band] == [1.0, 4.0]
        assert [point.high for point in band] == [3.0, 8.0]

    def test_empty_input(self) -> None:
        assert summarize_band([]) == []


class TestCumulativeAndRatio:
    def test_cumulative(self) -> None:
        assert cumulative([1, 2, 3]) == [1, 3, 6]

    def test_safe_ratio(self) -> None:
        assert safe_ratio(1, 4) == 0.25
        assert safe_ratio(1, 0) is None
        assert safe_ratio(1, -2) is None


class TestLinearFit:
    def test_recovers_an_exact_line(self) -> None:
        fit = linear_fit([1, 2, 3, 4], [3, 5, 7, 9])
        assert fit is not None
        assert fit.slope == pytest.approx(2.0)
        assert fit.intercept == pytest.approx(1.0)
        assert fit.r_squared == pytest.approx(1.0)
        assert fit.residual_std_error == pytest.approx(0.0, abs=1e-9)
        assert fit.predict(10) == pytest.approx(21.0)

    def test_noisy_data_has_r_squared_below_one(self) -> None:
        fit = linear_fit([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])
        assert fit is not None
        assert 0.0 < fit.r_squared < 1.0
        assert fit.residual_std_error > 0.0

    def test_needs_three_points(self) -> None:
        assert linear_fit([1, 2], [1, 2]) is None

    def test_needs_varying_x(self) -> None:
        assert linear_fit([2, 2, 2], [1, 2, 3]) is None

    def test_constant_y_has_zero_r_squared(self) -> None:
        fit = linear_fit([1, 2, 3], [5, 5, 5])
        assert fit is not None
        assert fit.slope == pytest.approx(0.0)
        assert fit.r_squared == 0.0


class TestSiblingPairs:
    def test_pairs_jacks_with_next_years_adults(self) -> None:
        pairs = build_sibling_pairs(
            jacks_by_year={2000: 10, 2001: 20, 2002: 30},
            adults_by_year={2001: 100, 2002: 200},
            in_progress_year=2030,
        )
        assert [(p.jack_year, p.adult_year, p.jacks, p.adults) for p in pairs] == [
            (2000, 2001, 10, 100),
            (2001, 2002, 20, 200),
        ]
        assert not any(pair.adults_in_progress for pair in pairs)

    def test_marks_the_in_progress_adult_year(self) -> None:
        pairs = build_sibling_pairs(
            jacks_by_year={2024: 10, 2025: 20},
            adults_by_year={2025: 100, 2026: 50},
            in_progress_year=2026,
        )
        assert [pair.adults_in_progress for pair in pairs] == [False, True]

    def test_negative_totals_are_clamped(self) -> None:
        pairs = build_sibling_pairs({1: -5}, {2: -9}, in_progress_year=2030)
        assert (pairs[0].jacks, pairs[0].adults) == (0, 0)

    def test_fit_ignores_in_progress_adult_years(self) -> None:
        pairs = build_sibling_pairs(
            jacks_by_year={1: 10, 2: 20, 3: 30, 4: 40},
            adults_by_year={2: 100, 3: 200, 4: 300, 5: 1},
            in_progress_year=5,
        )
        fit = fit_sibling_pairs(pairs)
        assert fit is not None
        assert fit.n == 3
        assert fit.slope == pytest.approx(10.0)
        assert fit.intercept == pytest.approx(0.0, abs=1e-9)
