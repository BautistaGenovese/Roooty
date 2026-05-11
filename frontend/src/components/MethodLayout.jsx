import { useState, useRef, useEffect } from 'react'
import Chart from './Chart'
import { fetchChartData } from '../utils/api'
import { useSettings } from '../hooks/useSettings'

// ─── EXPANDER ─────────────────────────────────────────────────────────────────
export function Expander({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="expander" style={{ marginBottom: '1rem' }}>
      <div className="expander-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`expander-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="expander-body">{children}</div>}
    </div>
  )
}

// ─── ITERATIONS TABLE ─────────────────────────────────────────────────────────
export function IterTable({ rows, columns }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Iter</th>
            {columns.map(c => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{i}</td>
              {columns.map(c => (
                <td key={c.key}>
                  {row[c.key] != null ? (typeof row[c.key] === 'number' ? row[c.key].toFixed(8) : row[c.key]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── PRECISION SLIDER ─────────────────────────────────────────────────────────
export function PrecisionSlider({ value, onChange }) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label className="form-label">Precisión</label>
        <span style={{ fontSize: '0.82rem', color: 'var(--blue)', fontWeight: 700 }}>
          10<sup>{-value}</sup>
        </span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
      />
    </div>
  )
}

// ─── FORMULA INPUT ────────────────────────────────────────────────────────────
export function FormulaInput({ value, onChange, placeholder = 'Ejemplo: x**2 + 11*x - 6' }) {
  return (
    <div className="form-group">
      <label className="form-label">Función f(x):</label>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
      <p className="form-caption">Usa <code>( )</code> para agrupar. Ejemplo: <code>e^(1-x)</code> para e<sup>1-x</sup>.</p>
    </div>
  )
}

// ─── EMPTY PANEL ──────────────────────────────────────────────────────────────
export function EmptyPanel() {
  return (
    <div className="empty-panel">
      <div className="empty-panel-icon">📊</div>
      <h2>Panel de Resultados</h2>
      <p>Ingresa una función y presiona el botón para visualizar el análisis.</p>
      <div className="empty-panel-badge">ROOOTY ESTÁ LISTO PARA CALCULAR</div>
    </div>
  )
}

// ─── METRICS BAR ──────────────────────────────────────────────────────────────
export function MetricsBar({ raiz, iters }) {
  return (
    <div className="metrics-bar">
      <div className="metric-item">
        <div className="metric-label">Raíz encontrada</div>
        <div className="metric-value">{raiz.toFixed(8)}</div>
      </div>
      <div className="metric-divider" />
      <div className="metric-item">
        <div className="metric-label">Iteraciones</div>
        <div className="metric-value">{iters}</div>
      </div>
    </div>
  )
}

// ─── PDF BUTTON ───────────────────────────────────────────────────────────────
export function PdfButton() {
  return (
    <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => alert('Función PDF disponible próximamente.')}>
      📝 Generar reporte en PDF
    </button>
  )
}

// ─── RESULTS PANEL ────────────────────────────────────────────────────────────
export function ResultsPanel({
  f, raiz, iteraciones, columns,
  xMin, xMax, chartKey,
  showToggle = true, isPuntoFijo = false, isRegresion = false,
  regresionChart = null, regresionData = null,
  extraMetrics = null,
}) {
  const [showIters, setShowIters] = useState(true)
  const [chartData, setChartData] = useState(null)
  const { settings } = useSettings()

  useEffect(() => {
    if (!f || raiz == null || isRegresion) return
    fetchChartData(f, xMin, xMax, settings.trigMode)
      .then(setChartData)
      .catch(console.error)
  }, [f, raiz, xMin, xMax, isRegresion, settings.trigMode])

  return (
    <div>
      <div className="formula-display" style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--slate)', fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 4 }}>
          FUNCIÓN EVALUADA
        </span>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--navy)', fontWeight: 700 }}>
          {isRegresion ? 'Regresión Lineal' : `f(x) = ${f}`}
        </code>
      </div>

      {extraMetrics || <MetricsBar raiz={raiz} iters={iteraciones?.length ?? 0} />}

      <div style={{ marginTop: 12 }}>
        <Chart
          f={isRegresion ? regresionChart : chartData}
          raiz={raiz}
          xMin={xMin} xMax={xMax}
          iteraciones={isRegresion ? regresionData : (showIters ? iteraciones : null)}
          chartKey={chartKey}
          isPuntoFijo={isPuntoFijo}
          isRegresion={isRegresion}
        />
      </div>

      {showToggle && !isRegresion && (
        <div className="toggle-wrap" style={{ marginTop: 8 }} onClick={() => setShowIters(s => !s)}>
          <div className={`toggle-switch ${showIters ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
          <span className="toggle-label">Mostrar iteraciones en el gráfico</span>
        </div>
      )}

      {iteraciones && iteraciones.length > 0 && (
        <Expander title="Ver tabla de iteraciones">
          <IterTable rows={iteraciones} columns={columns} />
        </Expander>
      )}
    </div>
  )
}

// ─── METHOD PAGE LAYOUT ───────────────────────────────────────────────────────
export default function MethodLayout({ title, badge, teoria, inputs, onCalcular, result, codeSnippet }) {
  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
        Método {title}
      </h1>

      {teoria}

      <div className="two-col">
        {/* LEFT — INPUTS */}
        <div className="card">
          <div className="card-header">
            <h4>Parámetros</h4>
            <span className="badge">{badge}</span>
          </div>

          {inputs}

          <button className="btn btn-primary" onClick={onCalcular}>
            🚀 Calcular y Graficar
          </button>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="card">
          {result}
        </div>
      </div>

      {codeSnippet && (
        <div style={{ marginTop: '2rem' }}>
          <hr className="divider" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
            Código en Python
          </h2>
          {codeSnippet}
        </div>
      )}
    </div>
  )
}
