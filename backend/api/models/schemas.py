"""
Esquemas Pydantic para las solicitudes de la API.

Cada modelo define la estructura de datos que reciben los endpoints.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class BaseRequest(BaseModel):
    """Parámetros comunes a todos los métodos de búsqueda de raíces."""
    f: str = Field(..., max_length=150)
    err: float = Field(1e-6, ge=1e-15, le=1)
    max_iters: int = Field(100, ge=1, le=1000)
    cero_maquina: float = Field(1e-12, ge=1e-20, le=1)
    limite_infinito: float = Field(1e6, ge=1, le=1e100)
    tipo_error: str = "Absoluto"
    trig_mode: str = "Radianes"


class BiseccionRequest(BaseRequest):
    """Bisección y Regula Falsi: requieren un intervalo [a, b]."""
    a: float = Field(..., ge=-1e100, le=1e100)
    b: float = Field(..., ge=-1e100, le=1e100)


class NewtonRequest(BaseRequest):
    """Newton-Raphson: requiere un punto inicial x_0."""
    x_0: float = Field(..., ge=-1e100, le=1e100)


class SecanteRequest(BaseRequest):
    """Secante: requiere dos puntos iniciales."""
    x_n: float = Field(..., ge=-1e100, le=1e100)
    x_n1: float = Field(..., ge=-1e100, le=1e100)


class PuntoFijoRequest(BaseRequest):
    """Punto Fijo: requiere un punto inicial x_0."""
    x_0: float = Field(..., ge=-1e100, le=1e100)


class RegresionRequest(BaseModel):
    """Regresión lineal: recibe listas de puntos."""
    x_vals: List[float] = Field(..., max_length=500)
    y_vals: List[float] = Field(..., max_length=500)

    @field_validator('x_vals', 'y_vals')
    def check_values(cls, v):
        if any(abs(val) > 1e100 for val in v):
            raise ValueError("Valores fuera de rango permitido (-1e100 a 1e100).")
        return v


class ChartDataRequest(BaseModel):
    """Generación de datos para graficar una función."""
    f: str = Field(..., max_length=150)
    x_min: float = Field(..., ge=-1e100, le=1e100)
    x_max: float = Field(..., ge=-1e100, le=1e100)
    trig_mode: str = "Radianes"
    n_points: int = Field(500, ge=10, le=5000)


class GaussianEliminationRequest(BaseModel):
    """
    Eliminación Gaussiana: recibe la matriz cuadrada A y el vector b.

    - matrix: Lista de N listas de N floats (la matriz de coeficientes A).
    - vector: Lista de N floats (el vector de términos independientes b).
    """
    matrix: List[List[float]] = Field(..., max_length=20)
    vector: List[float] = Field(..., max_length=20)
    cero_maquina: float = Field(1e-12, ge=1e-20, le=1)

    @field_validator('matrix')
    def check_matrix(cls, m):
        for row in m:
            if len(row) > 20:
                raise ValueError("Filas de la matriz exceden 20 columnas.")
            if any(abs(val) > 1e15 for val in row):
                raise ValueError("Valores en la matriz fuera de rango (-1e15 a 1e15).")
        return m

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
    f: str = Field(..., max_length=150)
    a: float = Field(..., ge=-1e100, le=1e100)
    b: float = Field(..., ge=-1e100, le=1e100)
    n: int = Field(100, ge=1, le=5000)
    trig_mode: str = "Radianes"


class ODERequest(BaseModel):
    f: str = Field(..., max_length=150)
    x0: float = Field(..., ge=-1e100, le=1e100)
    y0: float = Field(..., ge=-1e100, le=1e100)
    h: float = Field(..., ge=0.0001, le=1e6)
    n: int = Field(..., ge=1, le=5000)
    trig_mode: str = "rad"


class EulerRequest(BaseModel):
    f: str = Field(..., max_length=150)
    x0: float = Field(..., ge=-1e100, le=1e100)
    y0: float = Field(..., ge=-1e100, le=1e100)
    h: float = Field(0.1, ge=0.0001, le=1e6)
    x_final: Optional[float] = Field(None, ge=-1e100, le=1e100)
    max_iters: int = Field(100, ge=1, le=5000)
    trig_mode: str = "rad"
 

class GaussJordanRequest(BaseModel):
    """Gauss-Jordan: recibe la matriz A (n×n) y el vector b (n) del sistema Ax=b."""
    A: List[List[float]] = Field(..., max_length=20)
    b: List[float] = Field(..., max_length=20)
    cero_maquina: float = Field(1e-12, ge=1e-20, le=1)

    @field_validator('A')
    def check_matrix(cls, m):
        for row in m:
            if len(row) > 20:
                raise ValueError("Filas de la matriz exceden 20 columnas.")
            if any(abs(val) > 1e15 for val in row):
                raise ValueError("Valores en la matriz fuera de rango (-1e15 a 1e15).")
        return m
