import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload } from '../utils/api'
import Latex from '../components/Latex'
import MethodLayout, { Expander, FormulaInput, PrecisionSlider, EmptyPanel, ResultsPanel, PdfButton } from '../components/MethodLayout'

const COLS = [
  { key: 'x', label: 'x[i]' }, { key: 'fx', label: 'f(x[i])' },
  { key: 'dx', label: 'dx[i]' }, { key: 'x_next', label: 'x[i+1]' },
  { key: 'error', label: 'Error' },
]

export default function Secante() {
  const { settings } = useSettings()
  const [f, setF] = useState('')
  const [xn, setXn] = useState(-10)
  const [xn1, setXn1] = useState(10)
  const [prec, setPrec] = useState(2)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function calcular() {
    if (!f.trim()) { setError('Ingresa una función.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('secante', buildPayload(f, settings, { x_n: xn, x_n1: xn1, err: 10 ** (-prec) }))
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="📖 ¿Cómo funciona el método de la Secante?">
      <p>
        <strong>Concepto básico:</strong> Aproxima la derivada trazando una recta <strong>secante</strong> entre los dos últimos puntos evaluados,
        sin necesidad de calcular la derivada analíticamente.
      </p>
      <br />
      <p><strong>Fórmula de iteración:</strong></p>
      <Latex tex={String.raw`x_{i+1} = x_i - f(x_i) \cdot \dfrac{x_{i-1} - x_i}{f(x_{i-1}) - f(x_i)}`} display />
      <br />
      <div className="alert alert-warning">
        ⚠️ <strong>Restricción:</strong> f(x_(i-1)) ≠ f(x_i) para evitar división por cero.
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <FormulaInput value={f} onChange={setF} />
      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Ingresar xₙ</label>
          <input className="form-number" type="number" value={xn} step={2} onChange={e => setXn(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Ingresar xₙ₊₁</label>
          <input className="form-number" type="number" value={xn1} step={2} onChange={e => setXn1(parseFloat(e.target.value))} />
        </div>
      </div>
      <PrecisionSlider value={prec} onChange={setPrec} />
      {error && <div className="alert alert-error">{error}</div>}
      {result && <><hr className="divider" /><PdfButton /></>}
    </>
  )

  const resultPanel = result ? (
    <ResultsPanel
      f={f} raiz={result.raiz} iteraciones={result.iteraciones}
      columns={COLS}
      xMin={result.raiz - 5} xMax={result.raiz + 5}
      chartKey={`sec-${result.raiz}`}
    />
  ) : <EmptyPanel />

  const code = (
    <pre className="code-block">{`def secante(x_n1, x_n, f, err):
    for i in range(100):
        try:
            fx_n = evaluar_f(f, x_n)
            fx_n1 = evaluar_f(f, x_n1)
            
            x = x_n - fx_n * ((x_n - x_n1) / (fx_n - fx_n1))
            fx = evaluar_f(f, x)
            
            if abs(fx) < err:
                return x
            else:
                x_n, x_n1 = x, x_n
        except ZeroDivisionError:
            return None`}</pre>
  )

  return (
    <MethodLayout
      title="Secante"
      badge="MÉTODO ABIERTO"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultPanel}
      codeSnippet={code}
    />
  )
}
