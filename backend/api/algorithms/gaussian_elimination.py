"""
Eliminación Gaussiana con Pivoteo Parcial para la resolución de sistemas lineales.

Algoritmo en dos fases:
  1. Transformación a Matriz Triangular Superior (con Pivoteo Parcial por filas).
  2. Sustitución Regresiva para obtener el vector solución.

Nota: Implementación en Python puro sin dependencias externas (como numpy)
para garantizar compatibilidad en todos los entornos locales.
"""

import logging

logger = logging.getLogger(__name__)

# Umbral bajo el cual un pivote se considera numéricamente cero (sistema singular)
_EPSILON = 1e-12


def run_gaussian_elimination(matrix: list[list[float]], vector: list[float]):
    """
    Resuelve el sistema Ax = b usando Eliminación Gaussiana con Pivoteo Parcial.

    Args:
        matrix: Matriz de coeficientes A de tamaño N×N.
        vector: Vector de términos independientes b de tamaño N.

    Returns:
        tuple: (solucion, pasos, error)
            solucion (list[float] | None) : Vector solución x, o None si falla.
            pasos    (list[dict])         : Pasos intermedios de la eliminación.
            error    (str | None)         : Mensaje descriptivo del error, o None.
    """
    n = len(matrix)
    pasos: list[dict] = []

    # ── Validación básica de entrada ──────────────────────────────────────────
    if n == 0:
        return None, pasos, "La matriz no puede estar vacía."

    # ── Construir la Matriz Aumentada [A | b] ─────────────────────────────────
    # Aseguramos de que sean floats puros, ya que Pydantic puede pasar tipos propios
    aug: list[list[float]] = [[float(val) for val in row] + [float(vector[i])] for i, row in enumerate(matrix)]

    for k in range(n):

        # ── Paso a: buscar el pivote de mayor módulo en la columna k ──────────
        pivot_row = k
        for i in range(k + 1, n):
            if abs(aug[i][k]) > abs(aug[pivot_row][k]):
                pivot_row = i

        # ── Intercambiar filas si el pivote no está ya en la fila k ──────────
        if pivot_row != k:
            aug[k], aug[pivot_row] = aug[pivot_row], aug[k]
            pasos.append({
                "tipo": "intercambio",
                "descripcion": f"Intercambio F{k + 1} ↔ F{pivot_row + 1}",
                "matriz": _snapshot(aug, n),
            })

        # ── Verificar singularidad ─────────────────────────────────────────────
        if abs(aug[k][k]) < _EPSILON:
            return None, pasos, (
                f"El sistema es singular o indeterminado: "
                f"el pivote en la columna {k + 1} es cero (≈ 0). "
                f"El determinante de la matriz de coeficientes es cero; "
                f"el sistema puede no tener solución o tener infinitas soluciones."
            )

        # ── Paso c: eliminar elementos debajo del pivote ──────────────────────
        for i in range(k + 1, n):
            # Si el elemento ya es cero, no hace falta operar
            if abs(aug[i][k]) < _EPSILON:
                continue

            m = aug[i][k] / aug[k][k]

            # Actualizar todos los coeficientes de la fila i, incluyendo b (col n)
            for j in range(k, n + 1):
                aug[i][j] -= m * aug[k][j]

            # Forzar cero exacto en la posición pivote para evitar ruido numérico
            aug[i][k] = 0.0

            pasos.append({
                "tipo": "eliminacion",
                "descripcion": f"F{i + 1} = F{i + 1} − ({_fmt(m)}) × F{k + 1}",
                "factor": round(m, 8),
                "fila_origen": k,
                "fila_destino": i,
                "matriz": _snapshot(aug, n),
            })

    # =========================================================================
    # FASE 2 — SUSTITUCIÓN REGRESIVA
    # =========================================================================
    solucion = [0.0] * n

    for i in range(n - 1, -1, -1):
        # Suma de los términos ya conocidos (incógnitas calculadas previamente)
        suma_conocidos = sum(aug[i][j] * solucion[j] for j in range(i + 1, n))
        solucion[i] = (aug[i][n] - suma_conocidos) / aug[i][i]

        # Suprimir ruido numérico: valores extremadamente pequeños → 0
        if abs(solucion[i]) < _EPSILON:
            solucion[i] = 0.0

    pasos.append({
        "tipo": "solucion",
        "descripcion": "Sustitución regresiva completada exitosamente.",
        "solucion": [round(x, 10) for x in solucion],
    })

    return solucion, pasos, None


# ─── Helpers internos ─────────────────────────────────────────────────────────

def _snapshot(aug: list[list[float]], n: int) -> list[list[float]]:
    """
    Retorna una copia redondeada del estado actual de la matriz aumentada.
    Se usa para registrar cada paso intermedio sin referencias compartidas.
    Evita que valores NaN/Inf rompan la serialización JSON.
    """
    def _safe_round(val):
        try:
            f = float(val)
            if f != f or abs(f) > 1e300: # NaN o Inf
                return 0.0
            return round(f, 8)
        except Exception:
            return 0.0

    return [[_safe_round(aug[i][j]) for j in range(n + 1)] for i in range(n)]


def _fmt(value: float) -> str:
    """Formatea un número de manera compacta para los mensajes de pasos."""
    return f"{value:.6g}"

if __name__ == "__main__":
    print("--- PRUEBA DEL ALGORITMO DE ELIMINACIÓN GAUSSIANA ---")
    
    # Caso de prueba fallido reportado
    A_test = [
        [1, 2, 1],
        [2, 5, 1],
        [2, 4, 3]
    ]
    b_test = [1, 1, 3]
    
    print("Matriz A:")
    for row in A_test:
        print(" ", row)
    print("Vector b:", b_test)
    print("-" * 50)
    
    try:
        sol, pasos, err = run_gaussian_elimination(A_test, b_test)
        if err:
            print(f"RESULTADO FALLIDO (Singular o Error de Lógica):\n{err}")
        else:
            print(f"RESULTADO EXITOSO (Solución única encontrada):")
            print(f"x = {sol}")
            # Verificación rápida: x1 = 0, x2 = 0, x3 = 1
            print("-" * 50)
            print(f"Número de pasos registrados: {len(pasos)}")
            print("Verificación de la solución esperada [0.0, 0.0, 1.0]: ", 
                  "CORRECTA" if [round(x, 4) for x in sol] == [0.0, 0.0, 1.0] else "INCORRECTA")
    except Exception as e:
        print(f"¡EXCEPCIÓN CRÍTICA NO CAPTURADA!\nTipo: {type(e).__name__}\nDetalle: {e}")
        import traceback
        traceback.print_exc()

