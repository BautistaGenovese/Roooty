"""
Métodos Runge-Kutta de 2do Orden:
- Heun
- Punto Medio
- Ralston
"""

from api.utils.math_helpers import evaluar_fxy


# =========================================
# HEUN
# =========================================

def run_heun(req):

    x = req.x0
    y = req.y0

    rows = []

    for i in range(req.n):

        k1 = evaluar_fxy(req.f, x, y, req.trig_mode)

        k2 = evaluar_fxy(
            req.f,
            x + req.h,
            y + req.h * k1,
            req.trig_mode
        )

        y_next = y + (req.h / 2) * (k1 + k2)

        rows.append({
            "iter": i + 1,
            "x": x,
            "y": y,
            "k1": k1,
            "k2": k2,
            "y_next": y_next
        })

        y = y_next
        x += req.h

    return rows


# =========================================
# PUNTO MEDIO
# =========================================

def run_punto_medio(req):

    x = req.x0
    y = req.y0

    rows = []

    for i in range(req.n):

        k1 = evaluar_fxy(req.f, x, y, req.trig_mode)

        k2 = evaluar_fxy(
            req.f,
            x + req.h / 2,
            y + (req.h / 2) * k1,
            req.trig_mode
        )

        y_next = y + req.h * k2

        rows.append({
            "iter": i + 1,
            "x": x,
            "y": y,
            "k1": k1,
            "k2": k2,
            "y_next": y_next
        })

        y = y_next
        x += req.h

    return rows


# =========================================
# RALSTON
# =========================================

def run_ralston(req):

    x = req.x0
    y = req.y0

    rows = []

    for i in range(req.n):

        k1 = evaluar_fxy(req.f, x, y, req.trig_mode)

        k2 = evaluar_fxy(
            req.f,
            x + (3 * req.h / 4),
            y + (3 * req.h / 4) * k1,
            req.trig_mode
        )

        y_next = y + req.h * (
            (1 / 3) * k1 + (2 / 3) * k2
        )

        rows.append({
            "iter": i + 1,
            "x": x,
            "y": y,
            "k1": k1,
            "k2": k2,
            "y_next": y_next
        })

        y = y_next
        x += req.h

    return rows