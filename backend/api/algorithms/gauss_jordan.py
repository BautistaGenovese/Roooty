"""
Método de Gauss-Jordan para resolución de sistemas de ecuaciones lineales.

Transforma la matriz aumentada [A|b] a la forma identidad [I|x],
registrando cada paso para mostrar en la UI.
"""

import copy
from typing import List, Tuple, Optional


def _fmt(val: float, decimals: int = 6) -> float:
    """Redondea un valor para evitar ruido numérico en la presentación."""
    return round(val, decimals)


def _matrix_to_list(mat: List[List[float]], decimals: int = 6) -> List[List[float]]:
    """Convierte una matriz a lista con redondeo."""
    return [[_fmt(v, decimals) for v in row] for row in mat]


def run_gauss_jordan(
    A: List[List[float]],
    b: List[float],
) -> dict:
    """
    Aplica Gauss-Jordan a la matriz aumentada [A | b].

    Parámetros
    ----------
    A : matriz de coeficientes (n×n)
    b : vector de términos independientes (n)

    Retorna
    -------
    dict con:
        solucion   : lista de valores x_1..x_n  (None si no hay solución única)
        pasos      : lista de pasos del proceso
        error      : mensaje de error (o None)
        n          : tamaño del sistema
    """
    n = len(A)

    # Validaciones básicas
    if n == 0:
        return {"solucion": None, "pasos": [], "error": "La matriz está vacía.", "n": 0}
    if any(len(row) != n for row in A):
        return {"solucion": None, "pasos": [], "error": "La matriz A debe ser cuadrada.", "n": n}
    if len(b) != n:
        return {"solucion": None, "pasos": [], "error": "El vector b debe tener n elementos.", "n": n}

    # Construir matriz aumentada [A | b]
    aug = [A[i][:] + [b[i]] for i in range(n)]

    pasos = []

    def snapshot(descripcion: str, pivote_fila: int = -1, fila_modificada: int = -1):
        """Guarda una foto del estado actual de la matriz aumentada."""
        pasos.append({
            "descripcion": descripcion,
            "matriz": _matrix_to_list(aug),
            "pivote_fila": pivote_fila,
            "fila_modificada": fila_modificada,
        })

    # Estado inicial
    snapshot("Matriz aumentada inicial [A | b]")

    for col in range(n):
        # ── Búsqueda del pivote (pivoteo parcial) ──────────────────────────────
        max_row = col
        max_val = abs(aug[col][col])
        for row in range(col + 1, n):
            if abs(aug[row][col]) > max_val:
                max_val = abs(aug[row][col])
                max_row = row

        if max_val < 1e-12:
            return {
                "solucion": None,
                "pasos": pasos,
                "error": (
                    f"El sistema no tiene solución única (pivote ≈ 0 en columna {col + 1}). "
                    "Puede ser singular o tener infinitas soluciones."
                ),
                "n": n,
            }

        # Intercambiar filas si es necesario
        if max_row != col:
            aug[col], aug[max_row] = aug[max_row], aug[col]
            snapshot(
                f"Intercambio de filas: F{col+1} <-> F{max_row+1}",
                pivote_fila=col,
            )

        pivote = aug[col][col]

        # ── Normalizar la fila pivote ──────────────────────────────────────────
        aug[col] = [v / pivote for v in aug[col]]
        snapshot(
            f"Normalizacion: F{col+1} / {_fmt(pivote)}  ->  pivote = 1",
            pivote_fila=col,
        )

        # ── Eliminar en TODAS las demás filas (Jordan: arriba y abajo) ─────────
        for row in range(n):
            if row == col:
                continue
            factor = aug[row][col]
            if abs(factor) < 1e-15:
                continue
            aug[row] = [aug[row][j] - factor * aug[col][j] for j in range(n + 1)]
            snapshot(
                f"Eliminación: F{row+1} = F{row+1} - ({_fmt(factor)}) · F{col+1}",
                pivote_fila=col,
                fila_modificada=row,
            )

    # Extraer solución
    solucion = [_fmt(aug[i][n]) for i in range(n)]

    snapshot("✅ Matriz identidad alcanzada — solución extraída")

    return {
        "solucion": solucion,
        "pasos": pasos,
        "error": None,
        "n": n,
    }
