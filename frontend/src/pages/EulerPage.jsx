import ODELayout from "../components/ODELayout";

export default function EulerPage() {
  const campos = [
    {
      name: "f",
      label: "f(x, y)",
      placeholder: "ej: x + y",
      helperText: "Escribe la derivada y' = f(x, y)",
      type: "text",
    },
    {
      name: "x0",
      label: "x₀ (valor inicial de x)",
      placeholder: "0",
      type: "number",
    },
    {
      name: "y0",
      label: "y₀ (condición inicial)",
      placeholder: "1",
      type: "number",
    },
    {
      name: "h",
      label: "Paso h",
      placeholder: "0.1",
      type: "number",
    },
    {
      name: "x_final",
      label: "x final",
      placeholder: "2",
      type: "number",
    },
    {
      name: "max_iters",
      label: "Máx. iteraciones",
      placeholder: "100",
      type: "number",
    },
  ];

  const columnasTabla = [
    { key: "iter",   label: "n" },
    { key: "x",      label: "xₙ" },
    { key: "y",      label: "yₙ" },
    { key: "fxy",    label: "f(xₙ, yₙ)" },
    { key: "y_nuevo", label: "yₙ₊₁" },
  ];

  /**
   * Transforma la respuesta del backend al formato que espera ODELayout:
   *   { puntos: [{x, y}, ...], tabla: [...], resultado: string }
   */
  function transformarRespuesta(data) {
    if (!data.success) {
      return { error: data.error };
    }
    return {
      puntos: data.puntos,           // para el gráfico
      tabla: data.tabla,             // para la tabla de iteraciones
      resultado: `y(${data.x_final}) ≈ ${data.y_final}`,
    };
  }

  return (
    <ODELayout
      titulo="Método de Euler"
      descripcion="Resuelve Problemas de Valor Inicial (PVI) de la forma y' = f(x, y), y(x₀) = y₀ usando el método iterativo de Euler."
      endpoint="/edos/euler"
      campos={campos}
      columnasTabla={columnasTabla}
      transformarRespuesta={transformarRespuesta}
      defaultValues={{
        f: "x + y",
        x0: 0,
        y0: 1,
        h: 0.1,
        x_final: 2,
        max_iters: 100,
      }}
    />
  );
}
