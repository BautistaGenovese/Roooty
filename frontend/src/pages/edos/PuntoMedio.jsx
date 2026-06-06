import { useState, useEffect } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import { useHistory } from '../../hooks/useHistory'
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
  const { push: pushHistory } = useHistory()
  const [searchParams] = useSearchParams()

  const [f, setF] = useLocalStorage('PuntoMedio_f', '')
  const [x0, setX0] = useLocalStorage('PuntoMedio_x0', '')
  const [y0, setY0] = useLocalStorage('PuntoMedio_y0', '')
  const [h, setH] = useLocalStorage('PuntoMedio_h', '')
  const [n, setN] = useLocalStorage('PuntoMedio_n', '')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const pf = searchParams.get('f')
    const px0 = searchParams.get('x0')
    const py0 = searchParams.get('y0')
    const ph = searchParams.get('h')
    const pn = searchParams.get('n')
    if (pf) setF(pf)
    if (px0) setX0(px0)
    if (py0) setY0(py0)
    if (ph) setH(ph)
    if (pn) setN(pn)
  }, [searchParams])

  
  const handleClear = () => {
    setF('')
    setX0('')
    setY0('')
    setH('')
    setN('')
    setResult(null)
    setError(null)
  }

  async function calcular() {
    if (!f.trim() || x0 === '' || y0 === '' || h === '' || n === '') { 
      setError("Por favor, completa todos los campos."); 
      return 
    }
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
      const data = await apiPost('edos/puntomedio', payload)

      if (data.error) {
        setError(data.error); setResult(null); return
      }

      setResult({
        dataPoints: data.rows.map(r => ({ x: r.x, y: r.y })),
        iteraciones: data.rows,
      })

      pushHistory({
        method: 'Punto Medio',
        f,
        timestamp: Date.now(),
        displayParams: { f, x0, y0, h, n },
        queryParams: { f, x0, y0, h, n }
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona el método del Punto Medio?">
      <p>
        <strong>Concepto básico:</strong> Es otro método de Runge-Kutta de 2do orden.
        Evalúa la pendiente en el punto medio del intervalo para obtener una mejor aproximación del paso completo.
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
        <label className="form-label">Ecuación Diferencial y' = f(x, y)</label>
        <input className="form-input" type="text" value={f} placeholder="Ej: x + y" onChange={e => setF(e.target.value)} />
      </div>

      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Valor inicial de x (x₀)</label>
          <input className="form-number" type="number" value={x0} step={0.1} placeholder="Ej: 0" onChange={e => setX0(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Valor de y en x₀ (y₀)</label>
          <input className="form-number" type="number" value={y0} step={0.1} placeholder="Ej: 1" onChange={e => setY0(e.target.value)} />
        </div>
      </div>

      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Tamaño de paso (h)</label>
          <input className="form-number" type="number" value={h} step={0.01} min={0.001} placeholder="Ej: 0.1" onChange={e => setH(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Número de pasos (N)</label>
          <input className="form-number" type="number" value={n} min={1} max={5000} placeholder="Ej: 10" onChange={e => setN(e.target.value)} />
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
      onClear={handleClear}
      result={result}
      codeRaw={code}
      iteraciones={result?.iteraciones}
      columns={COLS}
    />
  )
}
