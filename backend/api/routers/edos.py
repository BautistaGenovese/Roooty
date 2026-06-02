"""Router de Ecuaciones Diferenciales Ordinarias (EDOs)."""

from fastapi import APIRouter
from api.models.schemas import EulerRequest
from api.algorithms.euler import run_euler

router = APIRouter(prefix="/api/edos", tags=["EDOs"])


@router.post("/euler")
def euler(req: EulerRequest):
    xs, ys, rows, error = run_euler(req)

    if error:
        return {"success": False, "error": error}

    puntos = [{"x": x, "y": y} for x, y in zip(xs, ys)]

    return {
        "success": True,
        "puntos": puntos,
        "tabla": rows,
        "x_final": xs[-1] if xs else None,
        "y_final": ys[-1] if ys else None,
    }