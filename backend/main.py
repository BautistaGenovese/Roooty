from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations, implicit_multiplication_application
)
import numpy as np
import statistics
import re
import math

app = FastAPI(title="Roooty Lab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── UTILS ────────────────────────────────────────────────────────────────────

def limpiar_formula(formula_str: str) -> str:
    if re.search(r'[<>=?]', formula_str):
        raise ValueError("No se permiten inecuaciones ni igualdades.")
    if re.search(r'[\{\}\[\]]', formula_str):
        raise ValueError("Usa solo paréntesis curvos () para agrupar.")
    if re.search(r'[^a-zA-Z0-9\+\-\*\/\(\)\.\,\!\^\s\|]', formula_str):
        raise ValueError("Se detectaron caracteres inválidos en la fórmula.")

    f = formula_str.lower()
    f = f.replace('^', '**').replace(',', '.')

    reemplazos = {
        r'\bsen\b': 'sin',
        r'\btg\b': 'tan',
        r'\barcsen\b': 'asin',
        r'\barccos\b': 'acos',
        r'\barctg\b': 'atan',
        r'\barctan\b': 'atan',
        r'\bln\b': 'log',
        r'\be\b': 'E',
    }
    for patron, sust in reemplazos.items():
        f = re.sub(patron, sust, f)

    f = re.sub(r'\|(.*?)\|', r'Abs(\1)', f)
    return f


def compilar_funcion(formula_str: str, trig_mode: str = "Radianes"):
    formula_limpia = limpiar_formula(formula_str)
    transformaciones = (standard_transformations + (implicit_multiplication_application,))
    try:
        expr = parse_expr(formula_limpia, transformations=transformaciones)
    except Exception:
        raise ValueError("Error de sintaxis matemática. Verifica paréntesis y operadores.")

    simbolos = expr.free_symbols
    var_x = sp.Symbol('x')
    for s in simbolos:
        if s != var_x:
            raise ValueError(f"Variable '{s}' no permitida. Solo usa 'x'.")

    if trig_mode == "Grados":
        custom = {
            'sin': lambda v: float(np.sin(np.radians(v))),
            'cos': lambda v: float(np.cos(np.radians(v))),
            'tan': lambda v: float(np.tan(np.radians(v))),
        }
        modulos = [custom, 'numpy']
    else:
        modulos = ['numpy']

    return sp.lambdify('x', expr, modules=modulos), str(expr)


def evaluar_f(formula_str: str, x, trig_mode: str = "Radianes"):
    f, _ = compilar_funcion(formula_str, trig_mode)
    resultado = f(x)
    if isinstance(resultado, (np.ndarray,)):
        return resultado
    return float(resultado)


def calcular_error(actual: float, anterior: float, tipo: str = "Absoluto") -> float:
    if tipo == "Absoluto":
        return abs(actual - anterior)
    elif tipo == "Relativo":
        if actual == 0:
            return abs(actual - anterior)
        return abs((actual - anterior) / actual)
    elif tipo == "Porcentual":
        if actual == 0:
            return abs(actual - anterior)
        return abs((actual - anterior) / actual) * 100
    return abs(actual - anterior)


# ─── REQUEST MODELS ───────────────────────────────────────────────────────────

class BaseRequest(BaseModel):
    f: str
    err: float = 1e-6
    max_iters: int = 100
    cero_maquina: float = 1e-12
    limite_infinito: float = 1e6
    tipo_error: str = "Absoluto"
    trig_mode: str = "Radianes"


class BiseccionRequest(BaseRequest):
    a: float
    b: float


class NewtonRequest(BaseRequest):
    x_0: float


class SecanteRequest(BaseRequest):
    x_n: float
    x_n1: float


class PuntoFijoRequest(BaseRequest):
    x_0: float


class RegresionRequest(BaseModel):
    x_vals: List[float]
    y_vals: List[float]


class ChartDataRequest(BaseModel):
    f: str
    x_min: float
    x_max: float
    trig_mode: str = "Radianes"
    n_points: int = 500


# ─── ALGORITHMS ───────────────────────────────────────────────────────────────

def run_biseccion(req: BiseccionRequest):
    a, b = req.a, req.b
    fa = evaluar_f(req.f, a, req.trig_mode)
    fb = evaluar_f(req.f, b, req.trig_mode)
    rows = []

    if fa * fb >= 0:
        return None, rows, "La función no cambia de signo en el intervalo dado."
    if a > b:
        a, b = b, a
        fa, fb = fb, fa

    x_anterior = a
    x = a

    for i in range(req.max_iters):
        x = (a + b) / 2
        fx = evaluar_f(req.f, x, req.trig_mode)

        err_cal = abs(b - a) / 2 if i == 0 else calcular_error(x, x_anterior, req.tipo_error)

        rows.append({
            "iter": i,
            "a": round(a, 10),
            "b": round(b, 10),
            "x": round(x, 10),
            "fx": round(fx, 10),
            "dx": round(x - a, 10),
            "error": round(err_cal, 10),
        })

        if abs(fx) < req.cero_maquina:
            break
        if err_cal < req.err and i > 0:
            break
        if fx * fa < 0:
            b = x
            fb = fx
        else:
            a = x
            fa = fx

        x_anterior = x

    return x, rows, None


def run_regula_falsi(req: BiseccionRequest):
    a, b = req.a, req.b
    fa = evaluar_f(req.f, a, req.trig_mode)
    fb = evaluar_f(req.f, b, req.trig_mode)
    rows = []

    if fa * fb >= 0:
        return None, rows, "La función no cambia de signo en el intervalo dado."
    if a > b:
        a, b = b, a
        fa, fb = fb, fa

    x_anterior = a
    x = a

    for i in range(req.max_iters):
        if abs(fb - fa) < req.cero_maquina:
            return None, rows, "División por cero. Los puntos están muy cerca."

        x = b - (fb * (b - a)) / (fb - fa)
        fx = evaluar_f(req.f, x, req.trig_mode)
        err_cal = calcular_error(x, x_anterior, req.tipo_error)

        rows.append({
            "iter": i,
            "a": round(a, 10),
            "b": round(b, 10),
            "x": round(x, 10),
            "fx": round(fx, 10),
            "dx": round(x - a, 10),
            "error": round(err_cal, 10),
        })

        if abs(fx) < req.cero_maquina:
            break
        if err_cal < req.err:
            break
        if fx * fa < 0:
            b = x
            fb = fx
        else:
            a = x
            fa = fx

        x_anterior = x

    return x, rows, None


def run_newton(req: NewtonRequest):
    rows = []
    f_limpia = limpiar_formula(req.f)
    transformaciones = (standard_transformations + (implicit_multiplication_application,))
    expr = parse_expr(f_limpia, transformations=transformaciones)
    derivada_expr = sp.diff(expr, 'x')
    derivada_str = str(derivada_expr)

    x_n = req.x_0

    for i in range(req.max_iters):
        fa = evaluar_f(req.f, x_n, req.trig_mode)
        d_val = evaluar_f(derivada_str, x_n, req.trig_mode)

        if d_val == 0 or abs(d_val) < req.cero_maquina:
            return None, rows, "La derivada es cero. El método no puede continuar."

        x_n1 = x_n - (fa / d_val)
        err_cal = calcular_error(x_n1, x_n, req.tipo_error)

        rows.append({
            "iter": i,
            "x": round(x_n, 10),
            "fx": round(fa, 10),
            "dfx": round(d_val, 10),
            "x_next": round(x_n1, 10),
            "error": round(err_cal, 10),
        })

        if abs(x_n1) > req.limite_infinito:
            return None, rows, "El método divergió."
        if abs(evaluar_f(req.f, x_n1, req.trig_mode)) <= req.cero_maquina:
            return x_n1, rows, None
        if err_cal <= req.err:
            return x_n1, rows, None

        x_n = x_n1

    return None, rows, "Se alcanzó el límite de iteraciones sin converger."


def run_secante(req: SecanteRequest):
    rows = []
    x_n = req.x_n
    x_n1 = req.x_n1

    for i in range(req.max_iters):
        try:
            fx_n = evaluar_f(req.f, x_n, req.trig_mode)
            fx_n1 = evaluar_f(req.f, x_n1, req.trig_mode)

            denom = fx_n - fx_n1
            if abs(denom) < req.cero_maquina:
                return None, rows, "División por cero en la secante."

            x = x_n - fx_n * ((x_n - x_n1) / denom)
            fx = evaluar_f(req.f, x, req.trig_mode)
            err_cal = calcular_error(x_n1, x_n, req.tipo_error)

            rows.append({
                "iter": i,
                "x": round(x_n, 10),
                "fx": round(fx, 10),
                "dx": round(x_n1 - x_n, 10),
                "x_next": round(x_n1, 10),
                "error": round(err_cal, 10),
            })

            if abs(fx) < req.cero_maquina:
                return x, rows, None
            if abs(x_n1) > req.limite_infinito:
                return None, rows, "El método divergió."
            if err_cal <= req.err:
                return x, rows, None

            x_n, x_n1 = x, x_n
        except ZeroDivisionError:
            return None, rows, "División por cero."

    return None, rows, "Se alcanzó el límite de iteraciones sin converger."


def run_punto_fijo(req: PuntoFijoRequest):
    rows = []
    x_n = req.x_0

    for i in range(req.max_iters):
        try:
            x_n1 = evaluar_f(req.f, x_n, req.trig_mode)
            if isinstance(x_n1, complex):
                return None, rows, "Resultado complejo. El método divergió."
            err_cal = calcular_error(x_n1, x_n, req.tipo_error)

            rows.append({
                "iter": i,
                "x": round(x_n, 10),
                "gx": round(float(x_n1), 10),
                "error": round(err_cal, 10),
            })

            if err_cal > req.limite_infinito:
                return None, rows, "El método divergió."
            if err_cal <= req.err:
                return float(x_n1), rows, None

            x_n = float(x_n1)
        except Exception as e:
            return None, rows, f"Error matemático: {e}"

    return None, rows, "Se alcanzó el límite de iteraciones sin converger."


def run_regresion(req: RegresionRequest):
    x_vals, y_vals = req.x_vals, req.y_vals
    if len(x_vals) < 2 or len(x_vals) != len(y_vals):
        return None, None, None, None, [], "Se necesitan al menos 2 puntos con x e y."
    try:
        m, b = statistics.linear_regression(x_vals, y_vals)
        r = statistics.correlation(x_vals, y_vals)
        r2 = r ** 2
        raiz = -b / m if m != 0 else None
        rows = [{"x": x, "y": y} for x, y in zip(x_vals, y_vals)]
        return m, b, raiz, r2, rows, None
    except Exception as e:
        return None, None, None, None, [], str(e)


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.post("/api/biseccion")
def api_biseccion(req: BiseccionRequest):
    try:
        raiz, rows, error = run_biseccion(req)
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/regula_falsi")
def api_regula_falsi(req: BiseccionRequest):
    try:
        raiz, rows, error = run_regula_falsi(req)
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/newton")
def api_newton(req: NewtonRequest):
    try:
        raiz, rows, error = run_newton(req)
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/secante")
def api_secante(req: SecanteRequest):
    try:
        raiz, rows, error = run_secante(req)
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/punto_fijo")
def api_punto_fijo(req: PuntoFijoRequest):
    try:
        raiz, rows, error = run_punto_fijo(req)
        if raiz is None:
            raise HTTPException(status_code=400, detail=error or "No se encontró la raíz.")
        return {"raiz": raiz, "iteraciones": rows, "n_iters": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/regresion")
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


@app.post("/api/chart_data")
def api_chart_data(req: ChartDataRequest):
    try:
        x = np.linspace(req.x_min, req.x_max, req.n_points)
        y = evaluar_f(req.f, x, req.trig_mode)
        # Replace inf/nan with None
        y_list = [None if (math.isnan(v) or math.isinf(v)) else round(float(v), 8) for v in y]
        return {"x": [round(float(xi), 8) for xi in x], "y": y_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}

# ── Servir React (debe ir AL FINAL, después de todas las rutas /api/) ─────────
_static = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(_static):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(_static, "index.html"))
