"""
Router de Raíces — Endpoints de búsqueda de raíces y análisis de funciones.

Incluye: Bisección, Regula Falsi, Newton-Raphson, Secante, Punto Fijo,
         Regresión Lineal y generación de datos para gráficos.
"""

import math
import time
import numpy as np
from fastapi import APIRouter, HTTPException

from api.models.schemas import (
    BiseccionRequest, NewtonRequest, SecanteRequest,
    PuntoFijoRequest, RegresionRequest, ChartDataRequest,
)
from api.utils.math_helpers import evaluar_f
from api.algorithms.biseccion import run_biseccion
from api.algorithms.regula_falsi import run_regula_falsi
from api.algorithms.newton import run_newton
from api.algorithms.secante import run_secante
from api.algorithms.punto_fijo import run_punto_fijo
from api.algorithms.regresion import run_regresion

router = APIRouter(prefix="/api", tags=["Raíces"])


@router.post("/biseccion")
def api_biseccion(req: BiseccionRequest):
    try:
        t0 = time.perf_counter()
        raiz, rows, error = run_biseccion(req)
        t_ms = (time.perf_counter() - t0) * 1000
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows), "time_ms": t_ms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/regula_falsi")
def api_regula_falsi(req: BiseccionRequest):
    try:
        t0 = time.perf_counter()
        raiz, rows, error = run_regula_falsi(req)
        t_ms = (time.perf_counter() - t0) * 1000
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows), "time_ms": t_ms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/newton")
def api_newton(req: NewtonRequest):
    try:
        t0 = time.perf_counter()
        raiz, rows, error = run_newton(req)
        t_ms = (time.perf_counter() - t0) * 1000
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows), "time_ms": t_ms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/secante")
def api_secante(req: SecanteRequest):
    try:
        t0 = time.perf_counter()
        raiz, rows, error = run_secante(req)
        t_ms = (time.perf_counter() - t0) * 1000
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows), "time_ms": t_ms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/punto_fijo")
def api_punto_fijo(req: PuntoFijoRequest):
    try:
        t0 = time.perf_counter()
        raiz, rows, error = run_punto_fijo(req)
        t_ms = (time.perf_counter() - t0) * 1000
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows), "time_ms": t_ms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/regresion")
def api_regresion(req: RegresionRequest):
    try:
        m, b, raiz, r2, rows, error = run_regresion(req)
        if m is None:
            raise HTTPException(status_code=400, detail=error)
        return {"m": m, "b": b, "raiz": raiz, "r2": r2, "puntos": rows}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chart_data")
def api_chart_data(req: ChartDataRequest):
    try:
        x = np.linspace(req.x_min, req.x_max, req.n_points)
        y = evaluar_f(req.f, x, req.trig_mode)
        # Replace inf/nan with None
        y_list = [None if (math.isnan(v) or math.isinf(v)) else round(float(v), 8) for v in y]
        return {"x": [round(float(xi), 8) for xi in x], "y": y_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
