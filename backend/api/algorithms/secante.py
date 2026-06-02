"""Método de la Secante para búsqueda de raíces."""

from api.utils.math_helpers import compilar_funcion, calcular_error
from api.models.schemas import SecanteRequest


def run_secante(req: SecanteRequest):
    rows = []
    x_n = req.x_n
    x_n1 = req.x_n1
    
    f_compilada, _ = compilar_funcion(req.f, req.trig_mode)

    for i in range(req.max_iters):
        try:
            fx_n = f_compilada(x_n)
            fx_n1 = f_compilada(x_n1)

            denom = fx_n - fx_n1
            if abs(denom) < req.cero_maquina:
                return None, rows, "División por cero en la secante."

            x = x_n - fx_n * ((x_n - x_n1) / denom)
            fx = f_compilada(x)
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
