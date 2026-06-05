"""Router de Ecuaciones Diferenciales Ordinarias (EDOs)."""

from fastapi import APIRouter
from api.models.schemas import EulerRequest
from api.algorithms.euler import run_euler

from api.models.schemas import ODERequest

from api.algorithms.rk2 import (
    run_heun,
    run_punto_medio,
    run_ralston
)

router = APIRouter(
    prefix="/api/edos",
    tags=["EDOs"]
)


# =========================================
# HEUN
# =========================================

@router.post("/heun")
def api_heun(req: ODERequest):

    rows = run_heun(req)

    return {
        "method": "Heun",
        "rows": rows
    }


# =========================================
# PUNTO MEDIO
# =========================================

@router.post("/punto-medio")
def api_punto_medio(req: ODERequest):

    rows = run_punto_medio(req)

    return {
        "method": "Punto Medio",
        "rows": rows
    }


# =========================================
# RALSTON
# =========================================

@router.post("/ralston")
def api_ralston(req: ODERequest):

    rows = run_ralston(req)

    return {
        "method": "Ralston",
        "rows": rows
    }