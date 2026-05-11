import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload } from '../utils/api'
import Latex from '../components/Latex'
import MethodLayout, { Expander, FormulaInput, PrecisionSlider, EmptyPanel, ResultsPanel, PdfButton } from '../components/MethodLayout'

const COLS = [
  { key: 'x', label: 'x[i]' }, { key: 'gx', label: 'g(x[i])' }, { key: 'error', label: 'Error' },
]

export default function PuntoFijo() {
  const { settings } = useSettings()
  const [mode, setMode] = useState('manual') // 'manual' | 'auto'
  const [g, setG] = useState('')
  const [fAuto, setFAuto] = useState('')
  const [x0, setX0] = useState(0)
  const [prec, setPrec] = useState(2)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const formula = mode === 'manual' ? g : `x - (${fAuto})`

  async function calcular() {
    if (!formula.trim()) { setError('Ingresa una función.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('punto_fijo', buildPayload(formula, settings, { x_0: x0, err: 10 ** (-prec) }))
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="📖 ¿Cómo funciona el método de Punto Fijo?">
      <p>
        <strong>Concepto básico:</strong> Transforma f(x) = 0 en x = g(x). Se toma un valor inicial, se evalúa en g(x),
        y el resultado se convierte en la entrada para la siguiente iteración.
      </p>
      <br />
      <p><strong>Fórmula de iteración:</strong></p>
      <Latex tex={String.raw`x_{i+1} = g(x_i)`} display />
      <br />
      <div className="alert alert-info">
        💡 <strong>Criterio de Convergencia:</strong> |g'(x)| &lt; 1 cerca de la raíz.
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <div className="form-group">
        <label className="form-label">¿Cómo ingresar la función?</label>
        <div className="radio-group" style={{ marginBottom: 12 }}>
          <div className={`radio-opt ${mode === 'manual' ? 'selected' : ''}`} onClick={() => setMode('manual')}>
            Ingresar g(x) despejada
          </div>
          <div className={`radio-opt ${mode === 'auto' ? 'selected' : ''}`} onClick={() => setMode('auto')}>
            Generar g(x) automáticamente
          </div>
        </div>
      </div>

      {mode === 'manual' ? (
        <FormulaInput
          value={g} onChange={setG}
          placeholder="Ejemplo: (x + 2)**(0.5)"
        />
      ) : (
        <div className="form-group">
          <label className="form-label">Función original f(x):</label>
          <input
            className="form-input" value={fAuto} onChange={e => setFAuto(e.target.value)}
            placeholder="Ejemplo: x**2 - x - 2" spellCheck={false}
          />
          <p className="form-caption">Transformación aplicada: g(x) = x - f(x)</p>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Ingresar x₀</label>
        <input className="form-number" type="number" value={x0} step={2} onChange={e => setX0(parseFloat(e.target.value))} />
      </div>
      <PrecisionSlider value={prec} onChange={setPrec} />
      {error && <div className="alert alert-error">{error}</div>}
      {result && <><hr className="divider" /><PdfButton /></>}
    </>
  )

  const resultPanel = result ? (
    <ResultsPanel
      f={formula} raiz={result.raiz} iteraciones={result.iteraciones}
      columns={COLS}
      xMin={result.raiz - 5} xMax={result.raiz + 5}
      chartKey={`pf-${result.raiz}`}
      isPuntoFijo
    />
  ) : <EmptyPanel />

  const code = (
    <pre className="code-block">{`def punto_fijo(x0, err):
    x_actual = x0
    for i in range(100):
        try:
            x_nuevo = g(x_actual)
            error = abs(x_nuevo - x_actual)
            
            if error > 1e6:
                return None
            if error <= err:
                return x_nuevo
            
            x_actual = x_nuevo
        except Exception:
            return None
    return x_actual`}</pre>
  )

  return (
    <MethodLayout
      title="Punto Fijo"
      badge="MÉTODO ABIERTO"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultPanel}
      codeSnippet={code}
    />
  )
}
