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


class GaussianEliminationRequest(BaseModel):
    """
    Eliminación Gaussiana: recibe la matriz cuadrada A y el vector b.

    - matrix: Lista de N listas de N floats (la matriz de coeficientes A).
    - vector: Lista de N floats (el vector de términos independientes b).
    """
    matrix: List[List[float]]
    vector: List[float]
    cero_maquina: float = 1e-12

    def validate_dimensions(self):
        """Valida que la matriz sea cuadrada y coincida con el vector."""
        n = len(self.matrix)
        if n == 0:
            raise ValueError("La matriz no puede estar vacía.")
        if n != len(self.vector):
            raise ValueError(
                f"Dimensiones incompatibles: la matriz es {n}×{len(self.matrix[0])} "
                f"pero el vector tiene {len(self.vector)} elementos."
            )
        for i, row in enumerate(self.matrix):
            if len(row) != n:
                raise ValueError(
                    f"La fila {i+1} tiene {len(row)} columnas; se esperaban {n}."
                )


class IntegracionRequest(BaseModel):
    """Integración Numérica: requiere función, límites y número de intervalos."""
    f: str
    a: float
    b: float
    n: int = 100
    trig_mode: str = "Radianes"


class GaussJordanRequest(BaseModel):
    """Gauss-Jordan: recibe la matriz A (n×n) y el vector b (n) del sistema Ax=b."""
    A: List[List[float]]
    b: List[float]
    cero_maquina: float = 1e-12
