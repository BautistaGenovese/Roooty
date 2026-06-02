"""
Esquemas Pydantic para las solicitudes de la API.

Cada modelo define la estructura de datos que reciben los endpoints.
"""

from pydantic import BaseModel
from typing import List


class BaseRequest(BaseModel):
    """Parámetros comunes a todos los métodos de búsqueda de raíces."""
    f: str
    err: float = 1e-6
    max_iters: int = 100
    cero_maquina: float = 1e-12
    limite_infinito: float = 1e6
    tipo_error: str = "Absoluto"
    trig_mode: str = "Radianes"


class BiseccionRequest(BaseRequest):
    """Bisección y Regula Falsi: requieren un intervalo [a, b]."""
    a: float
    b: float


class NewtonRequest(BaseRequest):
    """Newton-Raphson: requiere un punto inicial x_0."""
    x_0: float


class SecanteRequest(BaseRequest):
    """Secante: requiere dos puntos iniciales."""
    x_n: float
    x_n1: float


class PuntoFijoRequest(BaseRequest):
    """Punto Fijo: requiere un punto inicial x_0."""
    x_0: float


class RegresionRequest(BaseModel):
    """Regresión lineal: recibe listas de puntos."""
    x_vals: List[float]
    y_vals: List[float]


class ChartDataRequest(BaseModel):
    """Generación de datos para graficar una función."""
    f: str
    x_min: float
    x_max: float
    trig_mode: str = "Radianes"
    n_points: int = 500


class IntegracionRequest(BaseModel):
    """Integración Numérica: requiere función, límites y número de intervalos."""
    f: str
    a: float
    b: float
    n: int = 100
    trig_mode: str = "Radianes"
from pydantic import BaseModel
from typing import Optional
 

class EulerRequest(BaseModel):
    f: str                        # función f(x, y) como string, ej: "x + y"
    x0: float                     # valor inicial de x
    y0: float                     # valor inicial de y (condición inicial)
    h: float = 0.1                # tamaño de paso
    x_final: Optional[float] = None   # límite superior del intervalo
    max_iters: int = 100
    trig_mode: str = "rad"        # "rad" | "deg"
 