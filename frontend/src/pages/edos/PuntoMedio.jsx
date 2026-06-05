import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { apiPost } from '../../utils/api'
import Latex from '../../components/Latex'
import ODELayout from '../../components/ODELayout'
import { Expander } from '../../components/MethodLayout'

const COLS = [
  { key: 'x',      label: 'x[i]' },
  { key: 'y',      label: 'y[i]' },
  { key: 'k1',     label: 'k1' },
  { key: 'k2',     label: 'k2' },
  { key: 'y_next', label: 'y[i+1]' },
]

export default function PuntoMedio() {
  const { settings } = useSettings()
  const [f, setF]           = useState('x + y')
  const [x0, setX0]         = useState(0)
  const [y0, setY0]         = useState(1)
  const [h, setH]           = useState(0.1)
  const [n, setN]           = useState(10)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  async function calcular() {
    if (!f.trim()) { setError("Ingresa una función f(x, y)."); return }
    setLoading(true); setError(null)
    try {
      const payload = {
        f,
        x0: parseFloat(x0),
        y0: parseFloat(y0),
        h: parseFloat(h),
        n: parseInt(n, 10),
        trig_mode: settings.trigMode ?? 'rad',
      }
      const data = await apiPost('edos/punto-medio', payload)

      if (data.error) {
        setError(data.error); setResult(null); return
      }

      setResult({
        dataPoints: data.rows.map(r => ({ x: r.x, y: r.y })),
        iteraciones: data.rows,
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona el método del Punto Medio?">
      <p>
        <strong>Concepto básico:</strong> Es un método Runge-Kutta de 2do orden. Estima la pendiente en la mitad
        del intervalo usando el método de Euler y luego utiliza esa pendiente para calcular el valor de y en el siguiente paso completo.
      </p>
      <br />
      <p><strong>Fórmulas:</strong></p>
      <Latex tex={String.raw`k_1 = f(x_n, y_n)`} display />
      <Latex tex={String.raw`k_2 = f(x_n + \frac{h}{2}, y_n + \frac{h}{2} k_1)`} display />
      <Latex tex={String.raw`y_{n+1} = y_n + h \cdot k_2`} display />
      <br />
    </Expander>
  )

  const inputs = (
    <>
      <div className="form-group">
        <label className="form-label">f(x, y) — ecuación diferencial y' =</label>
        <input className="form-input" type="text" value={f} placeholder="ej: x + y" onChange={e => setF(e.target.value)} />
      </div>

      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">x₀ (valor inicial de x)</label>
          <input className="form-number" type="number" value={x0} step={0.1} onChange={e => setX0(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">y₀ (condición inicial)</label>
          <input className="form-number" type="number" value={y0} step={0.1} onChange={e => setY0(e.target.value)} />
        </div>
      </div>

      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Paso h</label>
          <input className="form-number" type="number" value={h} step={0.01} min={0.001} onChange={e => setH(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">N Iteraciones</label>
          <input className="form-number" type="number" value={n} min={1} max={5000} onChange={e => setN(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
    </>
  )

  const code = `def punto_medio(f, x0, y0, h, n):
    x, y = x0, y0
    puntos = [(x, y)]
    
    for _ in range(n):
        k1 = f(x, y)
        k2 = f(x + h/2, y + (h/2) * k1)
        y = y + h * k2
        x = x + h
        puntos.append((round(x, 10), round(y, 10)))
        
    return puntos`

  return (
    <ODELayout
      title="Método del Punto Medio"
      badge="RUNGE-KUTTA ORDEN 2"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={result}
      codeRaw={code}
      iteraciones={result?.iteraciones}
      columns={COLS}
    />
  )
}
