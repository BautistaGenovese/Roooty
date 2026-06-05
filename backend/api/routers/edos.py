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
# EULER
# =========================================

@router.post("/euler")
def api_euler(req: EulerRequest):
    try:
        xs, ys, rows, error = run_euler(req)
        if error:
            return {"success": False, "error": error}
        puntos = [{"x": x, "y": y} for x, y in zip(xs, ys)]
        return {"success": True, "puntos": puntos, "tabla": rows}
    except Exception as e:
        return {"success": False, "error": str(e)}


# =========================================
# HEUN
# =========================================

@router.post("/heun")
def api_heun(req: ODERequest):
    try:
        rows = run_heun(req)
        return {"method": "Heun", "rows": rows}
    except Exception as e:
        return {"method": "Heun", "rows": [], "error": str(e)}


# =========================================
# PUNTO MEDIO
# =========================================

@router.post("/punto-medio")
def api_punto_medio(req: ODERequest):
    try:
        rows = run_punto_medio(req)
        return {"method": "Punto Medio", "rows": rows}
    except Exception as e:
        return {"method": "Punto Medio", "rows": [], "error": str(e)}


# =========================================
# RALSTON
# =========================================

@router.post("/ralston")
def api_ralston(req: ODERequest):
    try:
        rows = run_ralston(req)
        return {"method": "Ralston", "rows": rows}
    except Exception as e:
        return {"method": "Ralston", "rows": [], "error": str(e)}

