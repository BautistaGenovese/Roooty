"""
Utilidades matemáticas compartidas.

Funciones de sanitización, compilación y evaluación de fórmulas
ingresadas por el usuario, y cálculo de errores numéricos.
"""

from functools import lru_cache
import threading
import re
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations, implicit_multiplication_application
)

ALLOWED_FUNCTIONS = {
    'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
    'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
    'exp': sp.exp, 'log': sp.log, 'ln': sp.ln,
    'sqrt': sp.sqrt, 'Abs': sp.Abs, 'E': sp.E, 'pi': sp.pi,
    'x': sp.Symbol('x'), 'y': sp.Symbol('y')
}


def limpiar_formula(formula_str: str) -> str:
    if len(formula_str) > 150:
        raise ValueError("La fórmula excede el límite máximo de caracteres.")
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


_compile_lock = threading.Lock()

@lru_cache(maxsize=128)
def _compilar_funcion_interna(formula_str: str, trig_mode: str):
    """Parsea una fórmula string y retorna una función numérica evaluable."""
    formula_limpia = limpiar_formula(formula_str)
    transformaciones = (standard_transformations + (implicit_multiplication_application,))
    try:
        expr = parse_expr(
            formula_limpia, 
            local_dict=ALLOWED_FUNCTIONS,
            transformations=transformaciones, 
            evaluate=False
        )
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

def compilar_funcion(formula_str: str, trig_mode: str = "Radianes"):
    with _compile_lock:
        return _compilar_funcion_interna(formula_str, trig_mode)


@lru_cache(maxsize=128)
def _obtener_derivada_str_interna(formula_str: str) -> str:
    formula_limpia = limpiar_formula(formula_str)
    transformaciones = (standard_transformations + (implicit_multiplication_application,))
    try:
        expr = parse_expr(
            formula_limpia, 
            local_dict=ALLOWED_FUNCTIONS,
            transformations=transformaciones, 
            evaluate=False
        )
        return str(sp.diff(expr, 'x'))
    except Exception:
        raise ValueError("No se pudo derivar la función.")

def obtener_derivada_str(formula_str: str) -> str:
    with _compile_lock:
        return _obtener_derivada_str_interna(formula_str)


def evaluar_f(formula_str: str, x, trig_mode: str = "Radianes"):
    """Evalúa una fórmula en un punto (o array) x."""
    f, _ = compilar_funcion(formula_str, trig_mode)
    resultado = f(x)
    if isinstance(resultado, (np.ndarray,)):
        return resultado
    return float(resultado)


def calcular_error(actual: float, anterior: float, tipo: str = "Absoluto") -> float:
    """Calcula el error entre dos aproximaciones sucesivas."""
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


# ─── Evaluador de dos variables f(x, y) para EDOs ─────────────────────────────

_compile_fxy_lock = threading.Lock()

@lru_cache(maxsize=128)
def _compilar_fxy_interna(formula_str: str, trig_mode: str):
    """Parsea una fórmula f(x, y) y retorna una función numérica evaluable."""
    formula_limpia = limpiar_formula(formula_str)
    # Allow 'y' as well: patch the cleaner so it doesn't reject 'y'
    transformaciones = (standard_transformations + (implicit_multiplication_application,))
    try:
        expr = parse_expr(
            formula_limpia, 
            local_dict=ALLOWED_FUNCTIONS,
            transformations=transformaciones, 
            evaluate=False
        )
    except Exception:
        raise ValueError("Error de sintaxis matemática. Verifica paréntesis y operadores.")

    simbolos = expr.free_symbols
    var_x = sp.Symbol('x')
    var_y = sp.Symbol('y')
    for s in simbolos:
        if s not in (var_x, var_y):
            raise ValueError(f"Variable '{s}' no permitida. Solo usa 'x' e 'y'.")

    if trig_mode in ("Grados", "deg"):
        custom = {
            'sin': lambda v: float(np.sin(np.radians(v))),
            'cos': lambda v: float(np.cos(np.radians(v))),
            'tan': lambda v: float(np.tan(np.radians(v))),
        }
        modulos = [custom, 'numpy']
    else:
        modulos = ['numpy']

    return sp.lambdify(('x', 'y'), expr, modules=modulos), str(expr)


def compilar_fxy(formula_str: str, trig_mode: str = "rad"):
    with _compile_fxy_lock:
        return _compilar_fxy_interna(formula_str, trig_mode)


def evaluar_fxy(formula_str: str, x, y, trig_mode: str = "rad"):
    """Evalúa f(x, y) en un punto (x, y)."""
    f, _ = compilar_fxy(formula_str, trig_mode)
    resultado = f(x, y)
    if isinstance(resultado, (np.ndarray,)):
        return resultado
    return float(resultado)
