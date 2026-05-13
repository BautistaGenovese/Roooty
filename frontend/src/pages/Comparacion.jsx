import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { apiPost, buildPayload, fetchChartData } from '../utils/api'
import { Expander, FormulaInput, PrecisionSlider, IterTable, formatMathToLatex } from '../components/MethodLayout'
import Chart, { ErrorChart, RadarChart2, ComparisonBarChart } from '../components/Chart'
import Latex from '../components/Latex'

const METODOS = ['Bisección', 'Regula Falsi', 'Newton', 'Secante', 'Punto Fijo']

const ROB = { 'Bisección': 10, 'Regula Falsi': 7, 'Secante': 6.5, 'Newton': 4, 'Punto Fijo': 5 }



function VerdictCard({ metA, metB, itA, itB, t1, t2, cA, cB, rA, rB }) {
  let winner = null;
  let reason = "";
  let diff = 0;

  if (itA.length < itB.length) {
    winner = metA;
    diff = itB.length - itA.length;
    reason = `Convergió en ${diff} iteraciones menos que su rival.`;
  } else if (itB.length < itA.length) {
    winner = metB;
    diff = itA.length - itB.length;
    reason = `Convergió en ${diff} iteraciones menos que su rival.`;
  } else {
    if (cA < cB) {
      winner = metA;
      reason = "Mismas iteraciones, pero con un menor costo computacional.";
    } else if (cB < cA) {
      winner = metB;
      reason = "Mismas iteraciones, pero con un menor costo computacional.";
    } else {
      winner = t1 < t2 ? metA : metB;
      reason = "Eficiencia idéntica, pero con una ejecución ligeramente más veloz.";
    }
  }

  return (
    <div className="verdict-card">
      <div className="verdict-header">
        <p className="verdict-label">VEREDICTO DEL ANÁLISIS</p>
        <h3 className="verdict-title">El método más eficiente es {winner}</h3>
        <p className="verdict-reason">{reason}</p>
      </div>
      
      <div className="verdict-divider" />
      
      <div className="verdict-footer">
        <div className="verdict-root-item">
          <span className="root-label">Raíz {metA}</span>
          <span className="root-value" style={{ color: 'var(--blue)' }}>{rA.toFixed(6)}</span>
        </div>
        <div className="verdict-root-item">
          <span className="root-label">Raíz {metB}</span>
          <span className="root-value" style={{ color: '#8b5cf6' }}>{rB.toFixed(6)}</span>
        </div>
      </div>
    </div>
  )
}

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
          <input className="form-number" type="number" value={params.a ?? -10} step={1}
            onChange={e => onChange({ ...params, a: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">Límite b</label>
          <input className="form-number" type="number" value={params.b ?? 10} step={1}
            onChange={e => onChange({ ...params, b: parseFloat(e.target.value) })} />
        </div>
      </div>
    )
  }

  if (nombre === 'Newton' || nombre === 'Punto Fijo') {
    return (
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Punto inicial x₀</label>
        <input className="form-number" type="number" value={params.x_0 ?? 0} step={1}
          onChange={e => onChange({ ...params, x_0: parseFloat(e.target.value) })} />
      </div>
    )
  }

  if (nombre === 'Secante') {
    return (
      <div className="input-col-2" style={{ marginTop: 8 }}>
        <div className="form-group">
          <label className="form-label">Punto xₙ</label>
          <input className="form-number" type="number" value={params.x_n ?? 0} step={1}
            onChange={e => onChange({ ...params, x_n: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">Punto xₙ₊₁</label>
          <input className="form-number" type="number" value={params.x_n1 ?? 1} step={1}
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
  const [prec, setPrec] = useState(4)
  const [metA, setMetA] = useState('')
  const [metB, setMetB] = useState('')
  const [paramsA, setParamsA] = useState({ a: -10, b: 10, x_0: 0, x_n: 0, x_n1: 1 })
  const [paramsB, setParamsB] = useState({ a: -10, b: 10, x_0: 0, x_n: 0, x_n1: 1 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const pf = searchParams.get('f')
    const pprec = searchParams.get('prec')
    const pmetA = searchParams.get('metA')

    if (pf) setF(pf)
    if (pprec) setPrec(parseInt(pprec))
    if (pmetA) setMetA(pmetA)

    const newPA = { ...paramsA }
    let changed = false
    if (searchParams.get('a')) { newPA.a = parseFloat(searchParams.get('a')); changed = true }
    if (searchParams.get('b')) { newPA.b = parseFloat(searchParams.get('b')); changed = true }
    if (searchParams.get('x_0')) { newPA.x_0 = parseFloat(searchParams.get('x_0')); changed = true }
    if (searchParams.get('x_n')) { newPA.x_n = parseFloat(searchParams.get('x_n')); changed = true }
    if (searchParams.get('x_n1')) { newPA.x_n1 = parseFloat(searchParams.get('x_n1')); changed = true }
    if (changed) setParamsA(newPA)
  }, [searchParams])

  async function ejecutar() {
    if (!f.trim() || !metA || !metB) { setError('Ingresa función y selecciona ambos métodos.'); return }

    // Validar si son idénticos en método y parámetros
    if (metA === metB) {
      const pA = JSON.stringify(paramsA);
      const pB = JSON.stringify(paramsB);
      if (pA === pB) {
        setError('Para comparar el mismo algoritmo, debes usar parámetros o puntos iniciales diferentes.');
        return;
      }
    }

    setLoading(true); setError(null)

    try {
      const { endpoint: epA, payload: plA } = buildReq(metA, f, prec, settings, paramsA)
      const { endpoint: epB, payload: plB } = buildReq(metB, f, prec, settings, paramsB)

      const [rA_wrap, rB_wrap] = await Promise.all([
        (async () => {
          const start = performance.now()
          const res = await apiPost(epA, plA)
          return { res, t: performance.now() - start }
        })(),
        (async () => {
          const start = performance.now()
          const res = await apiPost(epB, plB)
          return { res, t: performance.now() - start }
        })()
      ])

      const rA = rA_wrap.res
      const t1 = rA_wrap.t
      const rB = rB_wrap.res
      const t2 = rB_wrap.t

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
  const cA = Math.max(1, metA === 'Newton' ? 2 * itA.length : 2 + itA.length)
  const cB = Math.max(1, metB === 'Newton' ? 2 * itB.length : 2 + itB.length)

  const t1_safe = Math.max(0.001, result?.t1 ?? 1)
  const t2_safe = Math.max(0.001, result?.t2 ?? 1)

  const minT = result ? Math.min(t1_safe, t2_safe) : 1
  const sVelA = result ? (minT / t1_safe) * 10 : 5
  const sVelB = result ? (minT / t2_safe) * 10 : 5
  const minC = result ? Math.min(cA, cB) : 1
  const sCostA = result ? (minC / cA) * 10 : 5
  const sCostB = result ? (minC / cB) * 10 : 5

  return (
    <div className="page-content-wrap">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
        Análisis Comparativo
      </h1>

      <Expander title="Sobre el Análisis Comparativo">
        <p>
          <strong>Objetivo:</strong> Evaluar el rendimiento relativo de dos algoritmos bajo condiciones idénticas.
          Este panel permite contrastar la velocidad de convergencia y el costo computacional de los métodos seleccionados.
        </p>
      </Expander>

      <div className="card" style={{ marginBottom: '2.5rem' }}>
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
            <select className="form-select" value={metA} onChange={e => { setMetA(e.target.value) }}>
              <option value="">Seleccionar algoritmo...</option>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <ParamsFor nombre={metA} id="A" params={paramsA} onChange={setParamsA} />
          </div>

          {/* MÉTODO B */}
          <div>
            <p style={{ color: '#8b5cf6', fontWeight: 800, marginBottom: 8 }}>MÉTODO B</p>
            <select className="form-select" value={metB} onChange={e => { setMetB(e.target.value) }}>
              <option value="">Seleccionar algoritmo...</option>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <ParamsFor nombre={metB} id="B" params={paramsB} onChange={setParamsB} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" onClick={loading ? null : ejecutar} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Calculando...' : 'Ejecutar Análisis Comparativo'}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {result && (
        <>
          <hr className="divider" />

          <div className="analysis-f-box">
            <span className="analysis-badge">🔬 Función en Análisis</span>
            <div className="analysis-f-display">
              <Latex tex={`f(x) = ${formatMathToLatex(f)}`} />
            </div>
          </div>

          <VerdictCard
            metA={metA} metB={metB}
            itA={itA} itB={itB}
            t1={result.t1} t2={result.t2}
            cA={cA} cB={cB}
            rA={result.rA.raiz} rB={result.rB.raiz}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 16, color: 'var(--slate)', letterSpacing: 0.5 }}>ITERACIONES</h4>
              <ComparisonBarChart
                nameA={metA} valA={itA.length}
                nameB={metB} valB={itB.length}
              />
            </div>
            <div className="card">
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 16, color: 'var(--slate)', letterSpacing: 0.5 }}>COSTO (EVALUACIONES f(x))</h4>
              <ComparisonBarChart
                nameA={metA} valA={cA}
                nameB={metB} valB={cB}
              />
            </div>
            <div className="card">
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 16, color: 'var(--slate)', letterSpacing: 0.5 }}>TIEMPO DE EJECUCIÓN (ms)</h4>
              <ComparisonBarChart
                nameA={metA} valA={result.t1}
                nameB={metB} valB={result.t2}
                isTime
              />
            </div>
          </div>

          {/* GRAPHS */}
          <div className="two-col-equal" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <p style={{ textAlign: 'center', color: 'var(--blue)', fontWeight: 700, marginBottom: 8 }}>{metA.toUpperCase()}</p>
              <Chart
                f={result.cdA} raiz={result.rA.raiz}
                xMin={result.xMinA} xMax={result.xMaxA}
                iteraciones={itA}
                chartKey={`cmp-a-${result.rA.raiz}`}
              />
            </div>
            <div className="card">
              <p style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: 700, marginBottom: 8 }}>{metB.toUpperCase()}</p>
              <Chart
                f={result.cdB} raiz={result.rB.raiz}
                xMin={result.xMinB} xMax={result.xMaxB}
                iteraciones={itB}
                chartKey={`cmp-b-${result.rB.raiz}`}
              />
            </div>
          </div>

          {/* ERROR CHART */}
          <div className="card" style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ marginBottom: 16 }}>Evolución del Error</h4>
            <ErrorChart
              histIzq={itA} histDer={itB}
              nameIzq={metA} nameDer={metB}
              tipoError={settings.tipoError}
            />
          </div>



          {/* RADAR */}
          <div className="two-col-equal">
            <div className="card">
              <h4 style={{ marginBottom: 12 }}>Interpretación del Radar</h4>
              <div className="alert alert-info" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                <p>Este gráfico normaliza las métricas en una escala de eficiencia del 0 al 10.</p>
                <br />
                <p>• <strong>Área sombreada:</strong> Representa el "dominio" del método. A mayor área, más equilibrado es el algoritmo.</p>
                <p>• <strong>Velocidad:</strong> Tiempo de respuesta bruto.</p>
                <p>• <strong>Costo:</strong> Inverso de la cantidad de evaluaciones de la función.</p>
                <p>• <strong>Robustez:</strong> Capacidad teórica de converger ante malas aproximaciones.</p>
              </div>
            </div>
            <div className="card">
              <RadarChart2
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

