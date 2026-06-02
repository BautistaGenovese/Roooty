"""
Router de EDOs — Endpoints para ecuaciones diferenciales ordinarias.

TODO: Implementar endpoints para:
  - Método de Euler
  - Runge-Kutta (RK4)
  - Heun
  - Euler Mejorado
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/edos", tags=["EDOs"])

# ─── Agregar endpoints aquí ──────────────────────────────────────────────────
"""Router de Ecuaciones Diferenciales Ordinarias (EDOs)."""
 
from fastapi import APIRouter
from api.models.schemas import EulerRequest
from api.algorithms.euler import run_euler
 
router = APIRouter(prefix="/edos", tags=["EDOs"])
 
 
@router.post("/euler")
def euler(req: EulerRequest):
    """
    Resuelve un PVI usando el método de Euler.
 
    Body esperado:
    {
        "f":         "x + y",      # f(x, y) como string
        "x0":        0.0,           # valor inicial de x
        "y0":        1.0,           # valor inicial de y  (condición inicial)
        "h":         0.1,           # tamaño de paso
        "x_final":   2.0,           # x hasta donde integrar (opcional)
        "max_iters": 100,
        "trig_mode": "rad"          # "rad" | "deg"
    }
    """
    xs, ys, rows, error = run_euler(req)
 
    if error:
        return {"success": False, "error": error}
 
    puntos = [{"x": x, "y": y} for x, y in zip(xs, ys)]
 
    return {
        "success": True,
        "puntos": puntos,   # lista de {x, y} para graficar
        "tabla": rows,      # tabla de iteraciones
        "x_final": xs[-1] if xs else None,
        "y_final": ys[-1] if ys else None,
    }