"""
Módulo de Integración Numérica.

Implementa tres métodos clásicos de integración numérica compuesta:
  - Regla del Trapecio
  - Regla de Simpson 1/3
  - Regla de Simpson 3/8

Cada función retorna una tupla (resultado, puntos, curva_f, aproximacion):
  - resultado    : float   — valor de la integral aproximada
  - puntos       : list    — nodos [{x, fx}] para la tabla
  - curva_f      : dict    — {x: [...], y: [...]} con 500 pts suaves de f(x)
  - aproximacion : dict    — {x: [...], y: [...]} puntos de la aproximación
                             geométrica (trapecios o polinomios) para el gráfico
"""

import numpy as np
from api.utils.math_helpers import compilar_funcion


# ─── AUXILIAR: curva densa de f(x) ────────────────────────────────────────────

def _curva_densa(f_str: str, a: float, b: float, trig_mode: str,
                 n_pts: int = 500) -> dict:
    """
    Genera un array denso de puntos para dibujar f(x) como curva suave.

    Returns:
        {"x": [...], "y": [...]}  — listas de floats limpios (sin NaN/Inf)
    """
    fn, _ = compilar_funcion(f_str, trig_mode)
    xs = np.linspace(a, b, n_pts)
    ys = []
    xs_clean = []
    for xi in xs:
        try:
            yi = float(fn(xi))
            if np.isfinite(yi):
                xs_clean.append(round(float(xi), 10))
                ys.append(round(yi, 10))
        except Exception:
            pass
    return {"x": xs_clean, "y": ys}


# ─── AUXILIAR: aproximación por trapecios ─────────────────────────────────────

def _aprox_trapecio(fxs: list, xs: list) -> dict:
    """
    Construye la poligonal de los trapecios para graficar.

    La secuencia de puntos dibuja: (x0,0)→(x0,f0)→(x1,f1)→...→(xn,fn)→(xn,0)
    Con fill hacia y=0 se obtiene el área sombreada de todos los trapecios.

    Returns:
        {"x": [...], "y": [...]}
    """
    px, py = [xs[0]], [0.0]           # Anclaje inferior izquierdo
    for xi, fxi in zip(xs, fxs):
        px.append(round(xi, 10))
        py.append(round(fxi, 10))
    px.append(xs[-1])                  # Anclaje inferior derecho
    py.append(0.0)
    return {"x": px, "y": py}


# ─── AUXILIAR: aproximación parabólica / cúbica (Simpson) ─────────────────────

def _aprox_polinomio(f_str: str, xs: list, trig_mode: str,
                     grado: int, n_sub_pts: int = 30) -> dict:
    """
    Para cada subintervalo de Simpson, interpola un polinomio de 'grado' y
    muestrea n_sub_pts puntos sobre él para dibujar una curva suave.

    El resultado incluye anclajes en y=0 para permitir el fill sombreado.

    Args:
        grado   : 2 para Simpson 1/3 (parábolas), 3 para Simpson 3/8 (cúbicas)
        n_sub_pts: puntos por subintervalo interpolado

    Returns:
        {"x": [...], "y": [...]}
    """
    fn, _ = compilar_funcion(f_str, trig_mode)
    paso = grado          # Nodos por segmento: 3 para 1/3, 4 para 3/8
    n = len(xs) - 1       # Total de subintervalos

    px, py = [xs[0]], [0.0]   # Anclaje inicial

    for seg in range(0, n, paso):
        # Nodos del segmento (grado+1 puntos)
        seg_xs = xs[seg : seg + paso + 1]
        seg_ys = []
        for xi in seg_xs:
            try:
                yi = float(fn(xi))
                seg_ys.append(yi if np.isfinite(yi) else 0.0)
            except Exception:
                seg_ys.append(0.0)

        # Ajustar polinomio de 'grado' a los nodos del segmento
        coeffs = np.polyfit(seg_xs, seg_ys, grado)
        poly   = np.poly1d(coeffs)

        # Muestrear puntos suaves sobre el segmento
        t_vals = np.linspace(seg_xs[0], seg_xs[-1], n_sub_pts)
        for t in t_vals:
            yi = float(poly(t))
            px.append(round(float(t), 10))
            py.append(round(yi if np.isfinite(yi) else 0.0, 10))

    px.append(xs[-1])    # Anclaje final
    py.append(0.0)
    return {"x": px, "y": py}


# ──────────────────────────────────────────────────────────────────────────────
# REGLA DEL TRAPECIO COMPUESTA
# ──────────────────────────────────────────────────────────────────────────────

def metodo_trapecio(f_str: str, a: float, b: float, n: int,
                    trig_mode: str = "Radianes") -> tuple:
    """
    Regla del Trapecio Compuesta.

        I ≈ (h/2) * [f(x_0) + 2·Σf(x_i) + f(x_n)]

    Returns:
        (integral, puntos, curva_f, aproximacion)
    """
    if n <= 0:
        raise ValueError("El número de subintervalos 'n' debe ser mayor que 0.")

    h  = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    
    f_compilada, _ = compilar_funcion(f_str, trig_mode)

    puntos, fxs = [], []
    for xi in xs:
        try:
            fxi = float(f_compilada(xi))
        except Exception:
            fxi = 0.0
        puntos.append({"x": round(xi, 10), "fx": round(fxi, 10)})
        fxs.append(fxi)

    suma_interior = sum(fxs[1:-1])
    integral = (h / 2) * (fxs[0] + 2 * suma_interior + fxs[-1])

    curva_f      = _curva_densa(f_str, a, b, trig_mode)
    aproximacion = _aprox_trapecio(fxs, xs)

    return round(integral, 10), puntos, curva_f, aproximacion


# ──────────────────────────────────────────────────────────────────────────────
# REGLA DE SIMPSON 1/3 COMPUESTA
# ──────────────────────────────────────────────────────────────────────────────

def metodo_simpson_13(f_str: str, a: float, b: float, n: int,
                      trig_mode: str = "Radianes") -> tuple:
    """
    Regla de Simpson 1/3 Compuesta (n debe ser PAR).

        I ≈ (h/3) * [f(x_0) + 4Σf(x_impares) + 2Σf(x_pares) + f(x_n)]

    Returns:
        (integral, puntos, curva_f, aproximacion)
    """
    if n <= 0:
        raise ValueError("El número de subintervalos 'n' debe ser mayor que 0.")
    if n % 2 != 0:
        raise ValueError(
            f"Simpson 1/3 requiere que 'n' sea PAR. "
            f"Recibido n={n}. Prueba con n={n + 1} o n={n - 1 if n > 1 else 2}."
        )

    h  = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    
    f_compilada, _ = compilar_funcion(f_str, trig_mode)

    puntos, fxs = [], []
    for xi in xs:
        try:
            fxi = float(f_compilada(xi))
        except Exception:
            fxi = 0.0
        puntos.append({"x": round(xi, 10), "fx": round(fxi, 10)})
        fxs.append(fxi)

    suma_impares = sum(fxs[i] for i in range(1, n, 2))
    suma_pares   = sum(fxs[i] for i in range(2, n, 2))
    integral = (h / 3) * (fxs[0] + 4 * suma_impares + 2 * suma_pares + fxs[-1])

    curva_f      = _curva_densa(f_str, a, b, trig_mode)
    # Parábolas (grado 2) sobre cada par de subintervalos
    aproximacion = _aprox_polinomio(f_str, xs, trig_mode, grado=2)

    return round(integral, 10), puntos, curva_f, aproximacion


# ──────────────────────────────────────────────────────────────────────────────
# REGLA DE SIMPSON 3/8 COMPUESTA
# ──────────────────────────────────────────────────────────────────────────────

def metodo_simpson_38(f_str: str, a: float, b: float, n: int,
                      trig_mode: str = "Radianes") -> tuple:
    """
    Regla de Simpson 3/8 Compuesta (n debe ser MÚLTIPLO DE 3).

        I ≈ (3h/8) * [f(x_0) + 3Σ(...) + 2Σ(...) + f(x_n)]

    Returns:
        (integral, puntos, curva_f, aproximacion)
    """
    if n <= 0:
        raise ValueError("El número de subintervalos 'n' debe ser mayor que 0.")
    if n % 3 != 0:
        sugerencia = max(3, round(n / 3) * 3)
        raise ValueError(
            f"Simpson 3/8 requiere que 'n' sea múltiplo de 3. "
            f"Recibido n={n}. Prueba con n={sugerencia}."
        )

    h  = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    
    f_compilada, _ = compilar_funcion(f_str, trig_mode)

    puntos, fxs = [], []
    for xi in xs:
        try:
            fxi = float(f_compilada(xi))
        except Exception:
            fxi = 0.0
        puntos.append({"x": round(xi, 10), "fx": round(fxi, 10)})
        fxs.append(fxi)

    suma = fxs[0] + fxs[-1]
    for i in range(1, n):
        suma += 2 * fxs[i] if i % 3 == 0 else 3 * fxs[i]
    integral = (3 * h / 8) * suma

    curva_f      = _curva_densa(f_str, a, b, trig_mode)
    # Cúbicas (grado 3) sobre cada terna de subintervalos
    aproximacion = _aprox_polinomio(f_str, xs, trig_mode, grado=3)

    return round(integral, 10), puntos, curva_f, aproximacion
