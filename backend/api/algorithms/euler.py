"""Método de Euler para Ecuaciones Diferenciales Ordinarias (PVI)."""
 
from api.utils.math_helpers import evaluar_f
 
 
def run_euler(req):
    """
    Resuelve un PVI de la forma:
        y' = f(x, y),  y(x0) = y0
    usando el método iterativo de Euler.
 
    Retorna:
        xs      : lista de valores de x
        ys      : lista de valores de y aproximados
        rows    : tabla de iteraciones (para mostrar en frontend)
        error   : mensaje de error o None
    """
    x = req.x0
    y = req.y0
    h = req.h
    xs = [round(x, 10)]
    ys = [round(y, 10)]
    rows = []
 
    try:
        for i in range(req.max_iters):
            # f(x, y) — usamos evaluar_f adaptado para dos variables
            fxy = _evaluar_fxy(req.f, x, y, req.trig_mode)
 
            pendiente = fxy
            y_nuevo = y + h * pendiente
            x_nuevo = x + h
 
            rows.append({
                "iter": i,
                "x": round(x, 10),
                "y": round(y, 10),
                "fxy": round(fxy, 10),
                "y_nuevo": round(y_nuevo, 10),
            })
 
            x = round(x_nuevo, 10)
            y = round(y_nuevo, 10)
            xs.append(x)
            ys.append(y)
 
            # Condición de parada: llegamos al extremo del intervalo
            if req.x_final is not None and x >= req.x_final - 1e-12:
                break
 
    except Exception as e:
        return None, None, [], f"Error al evaluar la función: {str(e)}"
 
    return xs, ys, rows, None
 
 
def _evaluar_fxy(f_str: str, x: float, y: float, trig_mode: str) -> float:
    """
    Evalúa f(x, y) de forma segura usando sympy/eval.
    La función viene como string, ej: "x + y", "x*y - y**2"
    """
    import math
 
    if trig_mode == "deg":
        _sin = lambda v: math.sin(math.radians(v))
        _cos = lambda v: math.cos(math.radians(v))
        _tan = lambda v: math.tan(math.radians(v))
    else:
        _sin = math.sin
        _cos = math.cos
        _tan = math.tan
 
    local_vars = {
        "x": x, "y": y,
        "sin": _sin, "cos": _cos, "tan": _tan,
        "exp": math.exp, "log": math.log,
        "sqrt": math.sqrt, "pi": math.pi, "e": math.e,
    }
 
    return float(eval(f_str, {"__builtins__": {}}, local_vars))