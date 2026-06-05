"""Método de Newton-Raphson para búsqueda de raíces."""

from api.utils.math_helpers import compilar_funcion, calcular_error, obtener_derivada_str
from api.models.schemas import NewtonRequest


def run_newton(req: NewtonRequest):
    rows = []
    derivada_str = obtener_derivada_str(req.f)

    x_n = req.x_0

    f_compilada, _ = compilar_funcion(req.f, req.trig_mode)
    df_compilada, _ = compilar_funcion(derivada_str, req.trig_mode)

    for i in range(req.max_iters):
        fa = f_compilada(x_n)
        d_val = df_compilada(x_n)

        if d_val == 0 or abs(d_val) < req.cero_maquina:
            return None, rows, "La derivada es cero. El método no puede continuar."

        x_n1 = x_n - (fa / d_val)
        err_cal = calcular_error(x_n1, x_n, req.tipo_error)

        rows.append({
            "iter": i,
            "x": round(x_n, 10),
            "fx": round(fa, 10),
            "dfx": round(d_val, 10),
            "x_next": round(x_n1, 10),
            "error": round(err_cal, 10),
        })

        if abs(x_n1) > req.limite_infinito:
            return None, rows, "El método divergió."
        if abs(f_compilada(x_n1)) <= req.cero_maquina:
            return x_n1, rows, None
        if err_cal <= req.err:
            return x_n1, rows, None

        x_n = x_n1

    return None, rows, "Se alcanzó el límite de iteraciones sin converger."
