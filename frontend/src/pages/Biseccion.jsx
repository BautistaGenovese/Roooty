import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload } from '../utils/api'
import Latex from '../components/Latex'
import MethodLayout, { Expander, FormulaInput, PrecisionSlider, EmptyPanel, ResultsPanel, PdfButton, VSCodeBlock, CompareButton } from '../components/MethodLayout'

const COLS = [
  { key: 'a', label: 'a[i]' }, { key: 'b', label: 'b[i]' },
  { key: 'x', label: 'x[i]' }, { key: 'fx', label: 'f(x[i])' },
  { key: 'dx', label: 'Dx[i]' }, { key: 'error', label: 'Error' },
]

export default function Biseccion() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [f, setF] = useState('')
  const [a, setA] = useState(-10)
  const [b, setB] = useState(10)
  const [prec, setPrec] = useState(2)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const pf = searchParams.get('f')
    const pa = searchParams.get('a')
    const pb = searchParams.get('b')
    if (pf) setF(pf)
    if (pa !== null) setA(parseFloat(pa))
    if (pb !== null) setB(parseFloat(pb))
  }, [])

  async function calcular() {
    if (!f.trim()) { setError('Ingresa una función.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('biseccion', buildPayload(f, settings, { a, b, err: 10 ** (-prec) }))
      setResult({ ...data, usedF: f, usedA: a, usedB: b })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona el método de Bisección?">
      <p>
        <strong>Concepto básico:</strong> Es un método de búsqueda cerrada que se basa en el <strong>Teorema del Valor Intermedio</strong>.
        Divide repetidamente a la mitad un intervalo conocido que contiene la raíz.
      </p>
      <br />
      <p><strong>Fórmula de iteración (Punto medio):</strong></p>
      <Latex tex={String.raw`x_i = \dfrac{a + b}{2}`} display />
      <br />
      <div className="alert alert-info">
        <strong>Condición de Cambio de Signo:</strong> Obligatoriamente, <Latex tex="f(a) \cdot f(b) < 0" />.
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <FormulaInput value={f} onChange={setF} />
      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Límite a</label>
          <input className="form-number" type="number" value={a} step={2} onChange={e => setA(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Límite b</label>
          <input className="form-number" type="number" value={b} step={2} onChange={e => setB(parseFloat(e.target.value))} />
        </div>
      </div>
      <PrecisionSlider value={prec} onChange={setPrec} />
      {error && <div className="alert alert-error">{error}</div>}
      {result && (
        <>
          <PdfButton title="Bisección" f={f} params={{ 'Límite a': a, 'Límite b': b, 'Tolerancia': `1e-${prec}` }} result={result} columns={COLS} />
          <CompareButton f={f} prec={prec} metA="Bisección" paramsA={{ a, b }} />
        </>
      )}
    </>
  )

  const resultPanel = result ? (
    <ResultsPanel
      f={result.usedF} raiz={result.raiz} iteraciones={result.iteraciones}
      columns={COLS} xMin={result.usedA} xMax={result.usedB}
      chartKey={`bis-${result.raiz}`}
    />
  ) : <EmptyPanel />

  const code = `def biseccion(a, b, err=1e-${prec}):
    fa = f(a); fb = f(b)
    
    if fa * fb >= 0:
        return None
    
    x_anterior = a
    for i in range(${settings.maxIters}):
        x = (a + b) / 2
        fx = f(x)
        
        if abs(fx) < ${settings.ceroMaquina}:
            return x
        if abs(x - x_anterior) < err and i > 0:
            break
            
        if fx * fa < 0:
            b = x; fb = fx
        else:
            a = x; fa = fx
            
        x_anterior = x
    return x`

  return (
    <MethodLayout
      title="Bisección"
      badge="MÉTODO CERRADO"
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
