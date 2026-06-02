"""Método de Punto Fijo para búsqueda de raíces."""

from api.utils.math_helpers import compilar_funcion, calcular_error
from api.models.schemas import PuntoFijoRequest


def run_punto_fijo(req: PuntoFijoRequest):
    rows = []
    x_n = req.x_0
    
    f_compilada, _ = compilar_funcion(req.f, req.trig_mode)

    for i in range(req.max_iters):
        try:
            x_n1 = f_compilada(x_n)
            if isinstance(x_n1, complex):
                return None, rows, "Resultado complejo. El método divergió."
            err_cal = calcular_error(x_n1, x_n, req.tipo_error)

            rows.append({
                "iter": i,
                "x": round(x_n, 10),
                "gx": round(float(x_n1), 10),
                "error": round(err_cal, 10),
            })

            if err_cal > req.limite_infinito:
                return None, rows, "El método divergió."
            if err_cal <= req.err:
                return float(x_n1), rows, None

            x_n = float(x_n1)
        except Exception as e:
            return None, rows, f"Error matemático: {e}"

    return None, rows, "Se alcanzó el límite de iteraciones sin converger."
