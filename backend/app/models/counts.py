from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    river: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class Species(Base):
    __tablename__ = "species"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)


class CountClass(Base):
    __tablename__ = "count_classes"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    is_total: Mapped[bool] = mapped_column(Boolean, nullable=False)


class DailyCount(Base):
    __tablename__ = "daily_counts"

    location_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("locations.id"), primary_key=True
    )
    count_date: Mapped[date] = mapped_column(Date, primary_key=True)
    species_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("species.id"), primary_key=True
    )
    class_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("count_classes.id"), primary_key=True
    )
    fish_count: Mapped[int] = mapped_column(Integer, nullable=False)
