import { useState } from 'react'
import { Expander, VSCodeBlock, IterTable } from './MethodLayout'
import Chart from './Chart'

// ─── ODE RESULTS PANEL ────────────────────────────────────────────────────────
export function ODEResultsPanel({
  result, dataPoints,
}) {
  return (
    <div>
      <div className="metrics-bar" style={{ marginBottom: '1rem' }}>
        <div className="metric-item">
          <div className="metric-label">Puntos Calculados</div>
          <div className="metric-value">{dataPoints?.length || 0}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div id="chart-pdf-container" style={{ padding: '10px' }}>
          {/* We pass dataPoints as f to Chart since it expects f.x and f.y for the curve */}
          <Chart f={{ x: dataPoints?.map(p => p.x) || [], y: dataPoints?.map(p => p.y) || [] }} hideZoom={true} />
        </div>
      </div>
    </div>
  )
}

// ─── ODE LAYOUT ───────────────────────────────────────────────────────────────
export default function ODELayout({ title, badge, teoria, inputs, onCalcular, result, codeRaw, iteraciones, columns, extra }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!codeRaw) return
    navigator.clipboard.writeText(codeRaw.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-content-wrap">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
        {title}
      </h1>

      <div className="no-pdf">
        {teoria}
      </div>

      <div className="two-col">
        {/* LEFT — INPUTS */}
        <div className="card">
          <div className="card-header">
            <h4>Parámetros de la EDO</h4>
            <span className="history-param-chip">{badge}</span>
          </div>

          <div>
            {inputs}
          </div>

          <div style={{ paddingTop: '1.5rem' }}>
            <button className="btn btn-primary no-pdf" onClick={onCalcular}>
              Resolver EDO y Graficar
            </button>
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="card">
          {result ? (
            <ODEResultsPanel result={result} dataPoints={result.dataPoints} />
          ) : (
            <div className="empty-panel">
              <div className="empty-panel-icon"></div>
              <h2>Panel de Resultados</h2>
              <p>Ingresa la ecuación diferencial y presiona el botón para visualizar el análisis.</p>
              <div className="empty-panel-badge">LISTO PARA CALCULAR</div>
            </div>
          )}
        </div>
      </div>

      {extra}

      {iteraciones && iteraciones.length > 0 && (
        <div className="no-pdf" style={{ marginTop: '1.5rem' }}>
          <Expander
            className="expander--table"
            title="Ver tabla de iteraciones"
            badge={`${iteraciones.length} PUNTOS`}
          >
            <IterTable rows={iteraciones} columns={columns} />
          </Expander>
        </div>
      )}

      {codeRaw && (
        <div className="no-pdf card card--flush" style={{ marginTop: '2rem' }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '1.2rem' }}>Código en Python</h4>
            <button onClick={handleCopy} className="btn-copy-code">
              {copied ? '✅ Copiado' : '📋 Copiar código'}
            </button>
          </div>
          <div className="code-container-flush">
            <VSCodeBlock code={codeRaw} />
          </div>
        </div>
      )}
    </div>
  )
}
