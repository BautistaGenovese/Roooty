import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload, fetchChartData } from '../utils/api'
import { Expander, FormulaInput, PrecisionSlider, IterTable } from '../components/MethodLayout'
import Chart, { ErrorChart, RadarChart2 } from '../components/Chart'

const METODOS = ['Bisección', 'Regula Falsi', 'Newton', 'Secante', 'Punto Fijo']

const ROB = { 'Bisección': 10, 'Regula Falsi': 6.5, 'Secante': 6.5, 'Newton': 4, 'Punto Fijo': 5 }

function buildReq(nombre, f, prec, settings, params) {
  const base = buildPayload(f, settings, { err: 10 ** (-prec), ...params })
  const map = {
    'Bisección': 'biseccion',
    'Regula Falsi': 'regula_falsi',
    'Newton': 'newton',
    'Secante': 'secante',
    'Punto Fijo': 'punto_fijo',
  }
  return { endpoint: map[nombre], payload: base }
}

function ParamsFor({ nombre, id, params, onChange }) {
  if (!nombre) return null

  if (nombre === 'Bisección' || nombre === 'Regula Falsi') {
    return (
      <div className="input-col-2" style={{ marginTop: 8 }}>
        <div className="form-group">
          <label className="form-label">Límite a</label>
          <input className="form-number" type="number" value={params.a ?? -10} step={2}
            onChange={e => onChange({ ...params, a: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">Límite b</label>
          <input className="form-number" type="number" value={params.b ?? 10} step={2}
            onChange={e => onChange({ ...params, b: parseFloat(e.target.value) })} />
        </div>
      </div>
    )
  }

  if (nombre === 'Newton' || nombre === 'Punto Fijo') {
    return (
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">x₀</label>
        <input className="form-number" type="number" value={params.x_0 ?? -10} step={2}
          onChange={e => onChange({ ...params, x_0: parseFloat(e.target.value) })} />
      </div>
    )
  }

  if (nombre === 'Secante') {
    return (
      <div className="input-col-2" style={{ marginTop: 8 }}>
        <div className="form-group">
          <label className="form-label">xₙ</label>
          <input className="form-number" type="number" value={params.x_n ?? -10} step={2}
            onChange={e => onChange({ ...params, x_n: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">xₙ₊₁</label>
          <input className="form-number" type="number" value={params.x_n1 ?? 10} step={2}
            onChange={e => onChange({ ...params, x_n1: parseFloat(e.target.value) })} />
        </div>
      </div>
    )
  }

  return null
}

function getRange(nombre, raiz, params) {
  if (nombre === 'Bisección' || nombre === 'Regula Falsi') {
    return [params.a ?? raiz - 5, params.b ?? raiz + 5]
  }
  return [raiz - 5, raiz + 5]
}

export default function Comparacion() {
  const { settings } = useSettings()
  const [f, setF] = useState('')
  const [prec, setPrec] = useState(2)
  const [metA, setMetA] = useState('')
  const [metB, setMetB] = useState('')
  const [paramsA, setParamsA] = useState({ a: -10, b: 10 })
  const [paramsB, setParamsB] = useState({ a: -10, b: 10 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function ejecutar() {
    if (!f.trim() || !metA || !metB) { setError('Ingresa función y selecciona ambos métodos.'); return }
    if (metA === metB) { setError('Elige métodos distintos para comparar.'); return }
    setLoading(true); setError(null)

    try {
      const { endpoint: epA, payload: plA } = buildReq(metA, f, prec, settings, paramsA)
      const { endpoint: epB, payload: plB } = buildReq(metB, f, prec, settings, paramsB)

      const t1s = performance.now()
      const rA = await apiPost(epA, plA)
      const t1 = performance.now() - t1s

      const t2s = performance.now()
      const rB = await apiPost(epB, plB)
      const t2 = performance.now() - t2s

      const [xMinA, xMaxA] = getRange(metA, rA.raiz, paramsA)
      const [xMinB, xMaxB] = getRange(metB, rB.raiz, paramsB)

      const [cdA, cdB] = await Promise.all([
        fetchChartData(f, xMinA, xMaxA, settings.trigMode),
        fetchChartData(f, xMinB, xMaxB, settings.trigMode),
      ])

      setResult({
        rA, rB, t1, t2,
        cdA, cdB,
        xMinA, xMaxA, xMinB, xMaxB,
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error en uno de los métodos. Revisa los parámetros.')
      setResult(null)
    } finally { setLoading(false) }
  }

  const itA = result?.rA?.iteraciones ?? []
  const itB = result?.rB?.iteraciones ?? []
  const cA = metA === 'Newton' ? 2 * itA.length : 2 + itA.length
  const cB = metB === 'Newton' ? 2 * itB.length : 2 + itB.length

  const minT = result ? Math.min(result.t1, result.t2) : 1
  const sVelA = result ? (minT / result.t1) * 10 : 5
  const sVelB = result ? (minT / result.t2) * 10 : 5
  const minC = result ? Math.min(cA, cB) : 1
  const sCostA = result ? (minC / cA) * 10 : 5
  const sCostB = result ? (minC / cB) * 10 : 5

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
        Análisis Comparativo
      </h1>

      <Expander title="📖 Sobre el Análisis Comparativo">
        <p>
          <strong>Objetivo:</strong> Evaluar el rendimiento relativo de dos algoritmos bajo condiciones idénticas.
          Este panel permite contrastar la velocidad de convergencia y el costo computacional de los métodos seleccionados.
        </p>
      </Expander>

      <div className="card">
        <div className="card-header">
          <h4>Configuración del Análisis</h4>
          <span className="badge">EVALUACIÓN DE RENDIMIENTO</span>
        </div>

        <FormulaInput value={f} onChange={setF} />
        <PrecisionSlider value={prec} onChange={setPrec} />

        <hr className="divider" />

        <div className="two-col-equal">
          {/* MÉTODO A */}
          <div>
            <p style={{ color: 'var(--blue)', fontWeight: 800, marginBottom: 8 }}>MÉTODO A</p>
            <select className="form-select" value={metA} onChange={e => { setMetA(e.target.value); setParamsA({ a: -10, b: 10 }) }}>
              <option value="">Seleccionar algoritmo...</option>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <ParamsFor nombre={metA} id="A" params={paramsA} onChange={setParamsA} />
          </div>

          {/* MÉTODO B */}
          <div>
            <p style={{ color: '#8b5cf6', fontWeight: 800, marginBottom: 8 }}>MÉTODO B</p>
            <select className="form-select" value={metB} onChange={e => { setMetB(e.target.value); setParamsB({ a: -10, b: 10 }) }}>
              <option value="">Seleccionar algoritmo...</option>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <ParamsFor nombre={metB} id="B" params={paramsB} onChange={setParamsB} />
          </div>
        </div>

        <br />
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" onClick={loading ? null : ejecutar} disabled={loading}>
          {loading ? '⏳ Calculando...' : '🚀 Ejecutar Análisis Comparativo'}
        </button>
      </div>

      {/* RESULTS */}
      {result && (
        <>
          <hr className="divider" />

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--slate)', fontWeight: 700, letterSpacing: 1.5, background: '#f8fafc', padding: '6px 18px', borderRadius: 30, border: '1px solid var(--border)' }}>
              🔬 FUNCIÓN EN ANÁLISIS
            </span>
          </div>
          <div style={{ textAlign: 'center', margin: '8px 0 32px' }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--navy)', fontWeight: 700 }}>
              f(x) = {f}
            </code>
          </div>

          {/* GRAPHS */}
          <div className="two-col-equal" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <p style={{ textAlign: 'center', color: 'var(--blue)', fontWeight: 700, marginBottom: 4 }}>{metA.toUpperCase()}</p>
              <Chart
                f={result.cdA} raiz={result.rA.raiz}
                xMin={result.xMinA} xMax={result.xMaxA}
                iteraciones={itA}
                chartKey={`cmp-a-${result.rA.raiz}`}
              />
            </div>
            <div className="card">
              <p style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: 700, marginBottom: 4 }}>{metB.toUpperCase()}</p>
              <Chart
                f={result.cdB} raiz={result.rB.raiz}
                xMin={result.xMinB} xMax={result.xMaxB}
                iteraciones={itB}
                chartKey={`cmp-b-${result.rB.raiz}`}
              />
            </div>
          </div>

          {/* KPI BAR */}
          <div className="kpi-bar">
            <div className="kpi-header">
              <div className="kpi-col blue">{metA}</div>
              <div className="kpi-col label">MÉTRICAS</div>
              <div className="kpi-col purple">{metB}</div>
            </div>
            {[
              [result.rA.raiz.toFixed(6), 'Raíz Encontrada', result.rB.raiz.toFixed(6)],
              [itA.length, 'Iteraciones', itB.length],
              [`${result.t1.toFixed(3)} ms`, 'Tiempo Ejecución', `${result.t2.toFixed(3)} ms`],
              [cA, 'Cálculos de f(x)', cB],
            ].map(([va, lbl, vb]) => (
              <div key={lbl} className="kpi-row">
                <div className="kpi-col">{va}</div>
                <div className="kpi-col label">{lbl}</div>
                <div className="kpi-col">{vb}</div>
              </div>
            ))}
          </div>

          <br />

          {/* ERROR CHART */}
          <div className="card">
            <ErrorChart
              histIzq={itA} histDer={itB}
              nameIzq={metA} nameDer={metB}
              tipoError={settings.tipoError}
            />
          </div>

          <br />

          {/* RADAR */}
          <div className="two-col-equal">
            <div className="card">
              <h4 style={{ marginBottom: 12 }}>🎯 Interpretación del Radar</h4>
              <div className="alert alert-info">
                <p>Este gráfico normaliza las métricas en una escala de eficiencia del 0 al 10.</p>
                <br />
                <p>• <strong>Mayor área sombreada:</strong> Método globalmente más eficiente.</p>
                <br />
                <p>• <strong>Newton</strong> domina en velocidad pero flaquea en robustez.</p>
                <br />
                <p>• <strong>Bisección</strong> prioriza siempre la robustez a costa de velocidad.</p>
              </div>
            </div>
            <div className="card">
              <RadarChart
                nameIzq={metA}
                scoresIzq={[sVelA, sCostA, ROB[metA] ?? 5]}
                nameDer={metB}
                scoresDer={[sVelB, sCostB, ROB[metB] ?? 5]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
