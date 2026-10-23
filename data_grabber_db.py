"""Load Fish Passage Center adult counts into Postgres.

Same source and project/year loop as data_grabber.py. Each project-year is
parsed and inserted before the next request, so a stopped run keeps the years
already committed.

Connection settings are read from a .env file in this directory. Set
DATABASE_URL, or set PGHOST, PGPORT, PGDATABASE, PGUSER, and PGPASSWORD.
Variables already present in the environment take precedence.
Tables are the ones in initial_tables.sql. Lookup rows are inserted if missing.
"""

from datetime import datetime
import os
from pathlib import Path

from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import execute_values
import requests

URL = "https://www.fpc.org/adults/R_coeadultcount_runsum_salmon_results.php"
# Inclusive. range() stops before its end, so the loop uses END_YEAR + 1.
END_YEAR = 2026
# Set to a year (e.g. 2026) to backfill from that year only; None uses each
# project's historical start. Inserts upsert, so re-runs are safe.
START_YEAR_OVERRIDE = 2026
ENV_PATH = Path(__file__).resolve().parent / ".env"

PROJECTS = {
    "BON": 1938,
    "TDA": 1957,
    "JDA": 1968,
    "MCN": 1954,
    "IHR": 1962,
    "LMN": 1969,
    "LGS": 1970,
    "LGR": 1975,
}

# Seeded even for projects that are commented out above, so uncommenting a
# project does not require a schema change. sort_order runs downstream to upstream.
LOCATIONS = [
    ("BON", "Bonneville", "Columbia", 1),
    ("TDA", "The Dalles", "Columbia", 2),
    ("JDA", "John Day", "Columbia", 3),
    ("MCN", "McNary", "Columbia", 4),
    ("IHR", "Ice Harbor", "Snake", 5),
    ("LMN", "Lower Monumental", "Snake", 6),
    ("LGS", "Little Goose", "Snake", 7),
    ("LGR", "Lower Granite", "Snake", 8),
]

SPECIES = [
    ("chinook", "Chinook"),
    ("coho", "Coho"),
    ("steelhead", "Steelhead"),
    ("sockeye", "Sockeye"),
    ("chum", "Chum"),
    ("pink", "Pink"),
]

COUNT_CLASSES = [
    ("total", "Total", True),
    ("adult", "Adult", False),
    ("jack", "Jack", False),
    ("unclipped", "Unclipped", False),
    ("clipped", "Clipped", False),
]

SPECIES_CLASSES = {
    "chinook": ("total", "adult", "jack"),
    "coho": ("total", "adult", "jack"),
    "steelhead": ("total", "unclipped", "clipped"),
    "sockeye": ("total",),
    "chum": ("total",),
    "pink": ("total",),
}

# Daily columns worth storing. The matching "Total ..." columns are a running
# sum for the requested window, so they are left out.
COLUMN_MAP = {
    "All Chinook": ("chinook", "total"),
    "Adult Chinook": ("chinook", "adult"),
    "Jack Chinook": ("chinook", "jack"),
    "All Coho": ("coho", "total"),
    "Adult Coho": ("coho", "adult"),
    "Jack Coho": ("coho", "jack"),
    "All Steelhead": ("steelhead", "total"),
    "Unclipped Steelhead": ("steelhead", "unclipped"),
    "Clipped Steelhead": ("steelhead", "clipped"),
    "Sockeye": ("sockeye", "total"),
    "Chum": ("chum", "total"),
    "Pink": ("pink", "total"),
}


def load_env(path):
    """Load KEY=VALUE lines from path. Does not override existing variables."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        key, sep, value = line.partition("=")
        if not sep:
            continue
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        os.environ.setdefault(key, value)


def connect():
    load_env(ENV_PATH)
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    return psycopg2.connect(
        host=os.environ.get("PGHOST"),
        port=os.environ.get("PGPORT"),
        dbname=os.environ.get("PGDATABASE"),
        user=os.environ.get("PGUSER"),
        password=os.environ.get("PGPASSWORD"),
    )


def seed_lookups(cur):
    execute_values(
        cur,
        """
        INSERT INTO locations (code, name, river, sort_order)
        VALUES %s
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            river = EXCLUDED.river,
            sort_order = EXCLUDED.sort_order
        """,
        LOCATIONS,
    )
    execute_values(
        cur,
        """
        INSERT INTO species (code, name)
        VALUES %s
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name
        """,
        SPECIES,
    )
    execute_values(
        cur,
        """
        INSERT INTO count_classes (code, name, is_total)
        VALUES %s
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            is_total = EXCLUDED.is_total
        """,
        COUNT_CLASSES,
    )

    cur.execute("SELECT id, code FROM locations")
    location_ids = {code: id_ for id_, code in cur.fetchall()}
    cur.execute("SELECT id, code FROM species")
    species_ids = {code: id_ for id_, code in cur.fetchall()}
    cur.execute("SELECT id, code FROM count_classes")
    class_ids = {code: id_ for id_, code in cur.fetchall()}

    species_class_rows = [
        (species_ids[species_code], class_ids[class_code])
        for species_code, class_codes in SPECIES_CLASSES.items()
        for class_code in class_codes
    ]
    execute_values(
        cur,
        """
        INSERT INTO species_classes (species_id, class_id)
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        species_class_rows,
    )
    return location_ids, species_ids, class_ids


def parse_counts(html, location_id, species_ids, class_ids):
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="example")
    if table is None or table.find("tbody") is None:
        return []

    headers = [th.get_text(strip=True) for th in table.find("thead").find_all("th")]
    rows = []
    # The results markup nests each day inside the previous row. Direct cells
    # are one day; a recursive search would repeat the nested days.
    for tr in table.find("tbody").find_all("tr", class_="results"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td", recursive=False)]
        if len(cells) != len(headers):
            continue

        record = dict(zip(headers, cells))
        count_date = datetime.strptime(record["Count Date"], "%m/%d/%Y").date()
        for header, (species_code, class_code) in COLUMN_MAP.items():
            raw = record.get(header, "")
            if raw == "":
                continue
            rows.append(
                (
                    location_id,
                    count_date,
                    species_ids[species_code],
                    class_ids[class_code],
                    int(raw.replace(",", "")),
                )
            )
    return rows


def insert_counts(cur, rows):
    execute_values(
        cur,
        """
        INSERT INTO daily_counts (
            location_id, count_date, species_id, class_id, fish_count
        )
        VALUES %s
        ON CONFLICT (location_id, count_date, species_id, class_id)
        DO UPDATE SET fish_count = EXCLUDED.fish_count
        """,
        rows,
    )


def main():
    conn = connect()
    try:
        with conn.cursor() as cur:
            location_ids, species_ids, class_ids = seed_lookups(cur)
        conn.commit()

        session = requests.Session()
        for project_code, start_year in PROJECTS.items():
            print(project_code)
            location_id = location_ids[project_code]
            loop_start = (
                START_YEAR_OVERRIDE
                if START_YEAR_OVERRIDE is not None
                else start_year
            )
            for year in range(loop_start, END_YEAR + 1):
                print("\t", year)
                params = {
                    "fr_cdy": year,
                    "fr_cdm": 1,
                    "fr_cdd": 1,
                    "to_cdm": 12,
                    "to_cdd": 31,
                    "prj": project_code,
                }
                try:
                    res = session.post(URL, data=params, timeout=60)
                    res.raise_for_status()
                    rows = parse_counts(res.text, location_id, species_ids, class_ids)
                    if not rows:
                        print("No data for year", year)
                        continue
                    with conn.cursor() as cur:
                        insert_counts(cur, rows)
                    conn.commit()
                    days = len({row[1] for row in rows})
                    print(f"\t\t{days} days, {len(rows)} counts")
                except Exception as exc:
                    conn.rollback()
                    print("No data for year", year, exc)
    finally:
        conn.close()

    print("DONE")


if __name__ == "__main__":
    main()
