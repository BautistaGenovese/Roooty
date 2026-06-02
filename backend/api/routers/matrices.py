"""
Router de Matrices — Endpoints para métodos de álgebra lineal.

Métodos implementados:
  ✅ Eliminación Gaussiana (POST /api/matrices/gaussiana)

TODO: Implementar endpoints para:
  - Factorización LU
  - Gauss-Jordan
  - Jacobi
  - Gauss-Seidel
"""

import logging

from fastapi import APIRouter, HTTPException

from api.models.schemas import GaussianEliminationRequest
from api.algorithms.gaussian_elimination import run_gaussian_elimination

router = APIRouter(prefix="/api/matrices", tags=["Matrices"])
logger = logging.getLogger(__name__)


# ─── Eliminación Gaussiana ─────────────────────────────────────────────────────

@router.post("/gaussiana")
def api_gaussian_elimination(req: GaussianEliminationRequest):
    """
    Resuelve el sistema lineal Ax = b mediante Eliminación Gaussiana con
    Pivoteo Parcial por filas (usando NumPy/LAPACK internamente).

    Body (JSON):
        {
          "matrix": [[a00, a01, ...], [a10, a11, ...], ...],
          "vector": [b0, b1, ...]
        }

    Returns:
        {
          "solucion": [x0, x1, ...],    # Vector solución
          "pasos":    [...],             # Pasos intermedios de la eliminación
          "n":        int                # Tamaño del sistema
        }

    Raises:
        400 si la matriz es singular, inconsistente o con dimensiones inválidas.
        422 si el cuerpo de la solicitud no cumple el esquema.
    """
    try:
        # — Validación de dimensiones —
        req.validate_dimensions()
        logger.info(
            "Solicitud Gauss recibida: n=%d", len(req.matrix)
        )

        # — Convertir explícitamente a listas Python puras antes de pasar —
        # Esto elimina cualquier tipo interno de Pydantic v2 que pueda
        # interferir con la conversión a numpy.
        raw_matrix = [[float(cell) for cell in row] for row in req.matrix]
        raw_vector = [float(v) for v in req.vector]

        # — Ejecutar el algoritmo —
        solucion, pasos, error = run_gaussian_elimination(raw_matrix, raw_vector)

        if solucion is None:
            logger.info("Sistema sin solución única: %s", error)
            raise HTTPException(
                status_code=400,
                detail=error or "El sistema no tiene solución única.",
            )

        logger.info(
            "Gauss resuelto exitosamente. n=%d, pasos=%d",
            len(solucion), len(pasos),
        )
        return {
            "solucion": [round(float(x), 10) for x in solucion],
            "pasos": pasos,
            "n": len(solucion),
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("ValueError en Gauss: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Error inesperado en endpoint Gauss")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
