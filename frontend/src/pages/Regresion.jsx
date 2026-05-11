import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../utils/api'
import Latex from '../components/Latex'
import MethodLayout, { Expander, EmptyPanel, PdfButton, MetricsBar, IterTable } from '../components/MethodLayout'
import Chart from '../components/Chart'

export default function Regresion() {
  const [puntos, setPuntos] = useState([{ x: '', y: '' }, { x: '', y: '' }, { x: '', y: '' }])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState(null)

  function setCell(i, field, val) {
    setPuntos(pts => pts.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }
  function addRow() { setPuntos(pts => [...pts, { x: '', y: '' }]) }
  function removeRow(i) { if (puntos.length > 2) setPuntos(pts => pts.filter((_, idx) => idx !== i)) }

  async function calcular() {
    const valid = puntos.filter(p => p.x !== '' && p.y !== '' && !isNaN(parseFloat(p.x)) && !isNaN(parseFloat(p.y)))
    if (valid.length < 2) { setError('Se necesitan al menos 2 puntos válidos.'); return }
    setLoading(true); setError(null)
    try {
      const xv = valid.map(p => parseFloat(p.x))
      const yv = valid.map(p => parseFloat(p.y))
      const data = await apiPost('regresion', { x_vals: xv, y_vals: yv })
      setResult({ ...data, xv, yv })

      // Build chart data for regression line
      const xMin = Math.min(...xv) - 1
      const xMax = Math.max(...xv) + 1
      const n = 200
      const xs = Array.from({ length: n }, (_, i) => xMin + (i / (n - 1)) * (xMax - xMin))
      const ys = xs.map(xi => data.m * xi + data.b)
      setChartData({ x: xs, y: ys })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="📖 ¿Cómo funciona la Regresión Lineal?">
      <p>
        <strong>Concepto básico:</strong> Modela la relación entre un conjunto de datos buscando la <strong>recta de mejor ajuste</strong> que minimiza la distancia vertical al cuadrado entre los puntos y la recta.
      </p>
      <br />
      <p><strong>Ecuación resultante:</strong></p>
      <Latex tex={String.raw`f(x) = mx + b`} display />
      <br />
      <div className="alert alert-info">
        💡 La raíz se obtiene despejando: <Latex tex="x = -\dfrac{b}{m}" /> (siempre que <Latex tex="m \neq 0" />).
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <div className="form-group">
        <label className="form-label">Tabla de puntos</label>
        <div className="alert alert-info" style={{ marginBottom: 10, fontSize: '0.82rem' }}>
          💡 Edita la tabla e ingresa al menos 2 pares (x, y).
        </div>
        <div className="table-wrap" style={{ marginBottom: 8 }}>
          <table>
            <thead>
              <tr><th>x</th><th>y</th><th></th></tr>
            </thead>
            <tbody>
              {puntos.map((p, i) => (
                <tr key={i}>
                  <td>
                    <input
                      className="form-number" type="number" value={p.x}
                      onChange={e => setCell(i, 'x', e.target.value)}
                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input
                      className="form-number" type="number" value={p.y}
                      onChange={e => setCell(i, 'y', e.target.value)}
                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => removeRow(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }}
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-secondary" style={{ marginBottom: 8 }} onClick={addRow}>
          + Agregar fila
        </button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {result && <PdfButton title="Regresión Lineal" params={{ 'Puntos ingresados': result.xv?.length || 0, 'Pendiente (m)': result.m?.toFixed(4), 'Ordenada (b)': result.b?.toFixed(4), 'R²': result.r2?.toFixed(4) }} result={result} />}
    </>
  )

  const resultPanel = result && chartData ? (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--slate)', fontWeight: 700, letterSpacing: 1 }}>FUNCIÓN APROXIMADA</span>
        <br />
        <div style={{ color: 'var(--navy)' }}>
          <Latex tex={`${result.m.toFixed(4)}x + ${result.b >= 0 ? result.b.toFixed(4) : `(${result.b.toFixed(4)})`}`} display />
        </div>
      </div>

      <div className="metrics-bar">
        <div className="metric-item">
          <div className="metric-label">Raíz encontrada</div>
          <div className="metric-value" style={{ fontSize: '1.1rem' }}>{result.raiz?.toFixed(10)}</div>
        </div>
      </div>

      <Chart
        f={chartData} raiz={result.raiz}
        xMin={Math.min(...result.xv) - 1}
        xMax={Math.max(...result.xv) + 1}
        iteraciones={{ puntos: result.puntos }}
        chartKey={`reg-${result.raiz}`}
        isRegresion
      />

      <Expander title="📊 Ver métricas del modelo">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: 2 }}>
          <div><strong>Raíz (x):</strong> {result.raiz}</div>
          <div><strong>Pendiente (m):</strong> {result.m}</div>
          <div><strong>Ordenada al origen (b):</strong> {result.b}</div>
          <div><strong>Coeficiente R²:</strong> {result.r2?.toFixed(8)}</div>
        </div>
      </Expander>
    </div>
  ) : <EmptyPanel />

  const code = (
    <pre className="code-block">{`def calcular_regresion(datos):
    m, b = statistics.linear_regression(
        datos['x'], datos['y']
    )
    if m != 0:
        raiz = -b / m
        return m, b, raiz
    else:
        return None`}</pre>
  )

  return (
    <MethodLayout
      title="Regresión Lineal"
      badge="MÍNIMOS CUADRADOS"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultPanel}
      codeSnippet={code}
    />
  )
}
