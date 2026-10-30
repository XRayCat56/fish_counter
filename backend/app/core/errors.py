"""Central mapping of domain errors to HTTP responses."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.analytics import ClassNotAvailableError, LocationNotFoundError
from app.services.counts import SpeciesNotFoundError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(SpeciesNotFoundError)
    async def species_not_found(_: Request, exc: SpeciesNotFoundError) -> JSONResponse:
        logger.info("species not found: %s", exc)
        return JSONResponse(status_code=404, content={"detail": "Species not found"})

    @app.exception_handler(LocationNotFoundError)
    async def location_not_found(_: Request, exc: LocationNotFoundError) -> JSONResponse:
        logger.info("location not found: %s", exc)
        return JSONResponse(status_code=404, content={"detail": "Location not found"})

    @app.exception_handler(ClassNotAvailableError)
    async def class_not_available(_: Request, exc: ClassNotAvailableError) -> JSONResponse:
        logger.info("count classes unavailable for species: %s", exc)
        return JSONResponse(
            status_code=400,
            content={"detail": "This analysis is not available for the selected species"},
        )
