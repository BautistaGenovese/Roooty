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
  { key: 'fxy',    label: "f(x[i], y[i])" },
  { key: 'y_nuevo', label: 'y[i+1]' },
]

export default function Euler() {
  const { settings } = useSettings()
  const { push: pushHistory } = useHistory()
  const [searchParams] = useSearchParams()

  const [f, setF] = useLocalStorage('Euler_f', '')
  const [x0, setX0] = useLocalStorage('Euler_x0', '')
  const [y0, setY0] = useLocalStorage('Euler_y0', '')
  const [h, setH] = useLocalStorage('Euler_h', '')
  const [xFinal, setXFinal] = useLocalStorage('Euler_xFinal', '')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const pf = searchParams.get('f')
    const px0 = searchParams.get('x0')
    const py0 = searchParams.get('y0')
    const ph = searchParams.get('h')
    const pxfinal = searchParams.get('x_final')
    if (pf) setF(pf)
    if (px0) setX0(px0)
    if (py0) setY0(py0)
    if (ph) setH(ph)
    if (pxfinal) setXFinal(pxfinal)
  }, [searchParams])

  
  const handleClear = () => {
    setF('')
    setX0('')
    setY0('')
    setH('')
    setXFinal('')
    setResult(null)
    setError(null)
  }

  async function calcular() {
    if (!f.trim() || x0 === '' || y0 === '' || h === '' || xFinal === '') { 
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
        x_final: parseFloat(xFinal),
        max_iters: settings.maxIters ?? 100,
        trig_mode: settings.trigMode ?? 'rad',
      }
      const data = await apiPost('edos/euler', payload)

      if (!data.success) {
        setError(data.error); setResult(null); return
      }

      setResult({
        dataPoints: data.puntos,
        iteraciones: data.tabla,
      })

      pushHistory({
        method: 'Euler',
        f,
        timestamp: Date.now(),
        displayParams: { f, x0, y0, h, x_final: xFinal },
        queryParams: { f, x0, y0, h, x_final: xFinal }
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona el método de Euler?">
      <p>
        <strong>Concepto básico:</strong> Es el método numérico más simple para resolver
        Problemas de Valor Inicial (PVI) de la forma <Latex tex="y' = f(x,y),\ y(x_0) = y_0" />.
        Avanza paso a paso usando la pendiente en el punto actual.
      </p>
      <br />
      <p><strong>Fórmula de iteración:</strong></p>
      <Latex tex={String.raw`y_{n+1} = y_n + h \cdot f(x_n,\, y_n)`} display />
      <Latex tex={String.raw`x_{n+1} = x_n + h`} display />
      <br />
      <div className="alert alert-info">
        <strong>Parámetro h:</strong> El tamaño de paso controla la precisión. Valores más
        pequeños de <Latex tex="h" /> dan mayor exactitud pero requieren más iteraciones.
      </div>
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
          <label className="form-label">Punto a evaluar (x final)</label>
          <input className="form-number" type="number" value={xFinal} step={0.5} placeholder="Ej: 2" onChange={e => setXFinal(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
    </>
  )

  const code = `def euler(f, x0, y0, h, x_final):
    x, y = x0, y0
    puntos = [(x, y)]
    
    while x < x_final - 1e-12:
        y = y + h * f(x, y)
        x = x + h
        puntos.append((round(x, 10), round(y, 10)))
    
    return puntos`

  return (
    <ODELayout
      title="Método de Euler"
      badge="MÉTODO ITERATIVO"
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
