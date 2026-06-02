"""
Router para los métodos de Integración Numérica.

Expone tres endpoints POST bajo el prefijo /api/integracion:
  - /trapecio   → Regla del Trapecio compuesta
  - /simpson13  → Regla de Simpson 1/3 compuesta (n par)
  - /simpson38  → Regla de Simpson 3/8 compuesta (n múltiplo de 3)

Request body (JSON): IntegracionRequest
  { f, a, b, n, trig_mode }

Response (JSON):
  {
    metodo      : str,
    integral    : float,
    puntos      : [{x, fx}, ...],   ← nodos para la tabla
    curva_f     : {x: [], y: []},   ← 500 pts suaves de f(x) para graficar
    aproximacion: {x: [], y: []},   ← poligonal/parábola de la aproximación
  }
"""

from fastapi import APIRouter, HTTPException
from api.models.schemas import IntegracionRequest
from api.algorithms import integracion

router = APIRouter(prefix="/api/integracion", tags=["Integración Numérica"])


@router.post("/trapecio")
def trapecio_endpoint(req: IntegracionRequest):
    """
    Calcula la integral por la Regla del Trapecio Compuesta y devuelve
    además los puntos necesarios para graficar la aproximación.
    """
    try:
        integral, puntos, curva_f, aproximacion = integracion.metodo_trapecio(
            req.f, req.a, req.b, req.n, req.trig_mode
        )
        return {
            "metodo"      : "Regla del Trapecio",
            "integral"    : integral,
            "puntos"      : puntos,
            "curva_f"     : curva_f,
            "aproximacion": aproximacion,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simpson13")
def simpson13_endpoint(req: IntegracionRequest):
    """
    Calcula la integral por la Regla de Simpson 1/3 Compuesta (n PAR) y
    devuelve además las parábolas interpoladas para graficar.
    """
    try:
        integral, puntos, curva_f, aproximacion = integracion.metodo_simpson_13(
            req.f, req.a, req.b, req.n, req.trig_mode
        )
        return {
            "metodo"      : "Regla de Simpson 1/3",
            "integral"    : integral,
            "puntos"      : puntos,
            "curva_f"     : curva_f,
            "aproximacion": aproximacion,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simpson38")
def simpson38_endpoint(req: IntegracionRequest):
    """
    Calcula la integral por la Regla de Simpson 3/8 Compuesta (n múltiplo
    de 3) y devuelve además las cúbicas interpoladas para graficar.
    """
    try:
        integral, puntos, curva_f, aproximacion = integracion.metodo_simpson_38(
            req.f, req.a, req.b, req.n, req.trig_mode
        )
        return {
            "metodo"      : "Regla de Simpson 3/8",
            "integral"    : integral,
            "puntos"      : puntos,
            "curva_f"     : curva_f,
            "aproximacion": aproximacion,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
