"""
Router de Matrices — Endpoints para métodos de álgebra lineal.
"""

from fastapi import APIRouter, HTTPException
from api.models.schemas import GaussJordanRequest
from api.algorithms.gauss_jordan import run_gauss_jordan

router = APIRouter(prefix="/api/matrices", tags=["Matrices"])

# ─── Gauss-Jordan ─────────────────────────────────────────────────────────────

@router.post("/gauss-jordan")
def gauss_jordan(req: GaussJordanRequest):
    """
    Resuelve el sistema Ax = b usando eliminación de Gauss-Jordan.

    Retorna la solución, los pasos de la reducción y
    la matriz identidad resultante.
    """
    n = len(req.b)

    # Validar dimensiones antes de pasar al algoritmo
    if len(req.A) != n:
        raise HTTPException(
            status_code=422,
            detail=f"La matriz A tiene {len(req.A)} filas pero b tiene {n} elementos."
        )
    for i, row in enumerate(req.A):
        if len(row) != n:
            raise HTTPException(
                status_code=422,
                detail=f"La fila {i+1} de A tiene {len(row)} columnas; se esperaban {n}."
            )

    result = run_gauss_jordan(req.A, req.b)

    if result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
