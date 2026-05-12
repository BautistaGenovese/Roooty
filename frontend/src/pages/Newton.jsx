import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload } from '../utils/api'
import Latex from '../components/Latex'
import MethodLayout, { Expander, FormulaInput, PrecisionSlider, EmptyPanel, ResultsPanel, PdfButton, VSCodeBlock } from '../components/MethodLayout'

const COLS = [
  { key: 'x', label: 'x[i]' }, { key: 'fx', label: "f(x[i])" },
  { key: 'dfx', label: "f'(x[i])" }, { key: 'x_next', label: 'x[i+1]' },
  { key: 'error', label: 'Error' },
]

export default function Newton() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [f, setF] = useState('')
  const [x0, setX0] = useState(-10)
  const [prec, setPrec] = useState(2)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const pf = searchParams.get('f')
    const px0 = searchParams.get('x0')
    if (pf) setF(pf)
    if (px0 !== null) setX0(parseFloat(px0))
  }, [])

  async function calcular() {
    if (!f.trim()) { setError('Ingresa una función.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('newton', buildPayload(f, settings, { x_0: x0, err: 10 ** (-prec) }))
      setResult({ ...data, usedF: f })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="📖 ¿Cómo funciona el método de Newton-Raphson?">
      <p>
        <strong>Concepto básico:</strong> Comienza en un punto inicial <Latex tex="x_0" /> y traza una línea <strong>tangente</strong> a la curva usando la derivada.
        La intersección de esa tangente con el eje X da el siguiente punto <Latex tex="x_1" />.
      </p>
      <br />
      <p><strong>Fórmula de iteración:</strong></p>
      <Latex tex={String.raw`x_{i+1} = x_i - \dfrac{f(x_i)}{f'(x_i)}`} display />
      <br />
      <div className="alert alert-warning">
        ⚠️ <strong>Restricción:</strong> <Latex tex="f'(x_i) \neq 0" />, ya que la tangente horizontal nunca cruza el eje X.
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <FormulaInput value={f} onChange={setF} />
      <div className="form-group">
        <label className="form-label">Ingresar x₀</label>
        <input className="form-number" type="number" value={x0} step={2} onChange={e => setX0(parseFloat(e.target.value))} />
      </div>
      <PrecisionSlider value={prec} onChange={setPrec} />
      {error && <div className="alert alert-error">{error}</div>}
      {result && <PdfButton title="Newton-Raphson" f={f} params={{ 'x0': x0, 'Tolerancia': `1e-${prec}` }} result={result} columns={COLS} />}
    </>
  )

  const resultPanel = result ? (
    <ResultsPanel
      f={result.usedF} raiz={result.raiz} iteraciones={result.iteraciones}
      columns={COLS}
      xMin={result.raiz - 5} xMax={result.raiz + 5}
      chartKey={`newton-${result.raiz}`}
    />
  ) : <EmptyPanel />

  const code = `def newton(x_n, f, err=1e-${prec}):
    derivada = str(sp.diff(f, 'x'))
    
    for i in range(${settings.maxIters}):
        fa = evaluar_f(f, x_n)
        d_val = evaluar_f(derivada, x_n)
        
        if d_val == 0:
            return None
        
        x_n1 = x_n - (fa / d_val)
        
        if abs(evaluar_f(f, x_n1)) <= ${settings.ceroMaquina}:
            return x_n1
        if abs(x_n1 - x_n) <= err:
            return x_n1
        
        x_n = x_n1
    return None`

  return (
    <MethodLayout
      title="Newton-Raphson"
      badge="MÉTODO ABIERTO"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultPanel}
      codeRaw={code}
      iteraciones={result?.iteraciones}
      columns={COLS}
    />
  )
}
