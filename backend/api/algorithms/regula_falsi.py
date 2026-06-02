"""Método de Regula Falsi (Falsa Posición) para búsqueda de raíces."""

from api.utils.math_helpers import compilar_funcion, calcular_error
from api.models.schemas import BiseccionRequest


def run_regula_falsi(req: BiseccionRequest):
    a, b = req.a, req.b
    
    f_compilada, _ = compilar_funcion(req.f, req.trig_mode)
    fa = f_compilada(a)
    fb = f_compilada(b)
    rows = []

    if fa * fb >= 0:
        return None, rows, "La función no cambia de signo en el intervalo dado."
    if a > b:
        a, b = b, a
        fa, fb = fb, fa

    x_anterior = a
    x = a

    for i in range(req.max_iters):
        if abs(fb - fa) < req.cero_maquina:
            return None, rows, "División por cero. Los puntos están muy cerca."

        x = b - (fb * (b - a)) / (fb - fa)
        fx = f_compilada(x)
        err_cal = calcular_error(x, x_anterior, req.tipo_error)

        rows.append({
            "iter": i,
            "a": round(a, 10),
            "b": round(b, 10),
            "x": round(x, 10),
            "fx": round(fx, 10),
            "dx": round(x - a, 10),
            "error": round(err_cal, 10),
        })

        if abs(fx) < req.cero_maquina:
            break
        if err_cal < req.err:
            break
        if fx * fa < 0:
            b = x
            fb = fx
        else:
            a = x
            fa = fx

        x_anterior = x

    return x, rows, None
