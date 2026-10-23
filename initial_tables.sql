CREATE TABLE locations (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE,   -- FPC project code: LGR, BON, ...
  name        text NOT NULL UNIQUE,   -- Lower Granite
  river       text,                   -- Snake, Columbia
  sort_order  smallint NOT NULL       -- downstream to upstream
);

CREATE TABLE species (
  id    smallserial PRIMARY KEY,
  code  text NOT NULL UNIQUE,         -- chinook, coho, steelhead, sockeye, chum, pink
  name  text NOT NULL UNIQUE
);

CREATE TABLE count_classes (
  id        smallserial PRIMARY KEY,
  code      text NOT NULL UNIQUE,     -- total, adult, jack, unclipped, clipped
  name      text NOT NULL,
  is_total  boolean NOT NULL
);

-- Which classes are legal for which species. Drives the UI dropdowns.
CREATE TABLE species_classes (
  species_id  smallint REFERENCES species,
  class_id    smallint REFERENCES count_classes,
  PRIMARY KEY (species_id, class_id)
);

CREATE TABLE daily_counts (
  location_id  smallint NOT NULL REFERENCES locations,
  count_date   date     NOT NULL,
  species_id   smallint NOT NULL REFERENCES species,
  class_id     smallint NOT NULL REFERENCES count_classes,
  fish_count   integer  NOT NULL,     -- negatives allowed
  PRIMARY KEY (location_id, count_date, species_id, class_id)
);

CREATE INDEX daily_counts_query_idx
  ON daily_counts (species_id, class_id, count_date, location_id);