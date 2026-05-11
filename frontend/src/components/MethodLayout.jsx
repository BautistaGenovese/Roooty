import { useState, useRef, useEffect } from 'react'
import Chart from './Chart'
import { fetchChartData } from '../utils/api'
import { useSettings } from '../hooks/useSettings'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import Latex from './Latex'

export function formatMathToLatex(f) {
  if (!f) return '';
  let tex = f;
  tex = tex.replace(/\*\*/g, '^');
  tex = tex.replace(/\*/g, ' \\cdot ');
  const funcs = ['sin', 'cos', 'tan', 'exp', 'log', 'ln', 'sqrt'];
  funcs.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\b`, 'g');
    tex = tex.replace(regex, `\\${fn}`);
  });
  return tex;
}

export function Expander({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="expander" style={{ marginBottom: '1rem' }}>
      <div className="expander-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`expander-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      <div className={`expander-body-wrapper ${open ? 'open' : ''}`} style={{ display: open ? 'block' : 'none' }}>
        <div className="expander-body">{children}</div>
      </div>
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
export function PdfButton({ title, f, params, result, columns }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ format: 'letter' });
      const pw = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // var(--blue)
      doc.text(`Reporte de Análisis Numérico - Rooty`, pw / 2, 20, { align: 'center' });

      // Divider
      doc.setDrawColor(226, 232, 240); // var(--border)
      doc.setLineWidth(0.5);
      doc.line(14, 25, pw - 14, 25);

      // Info text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59); // navy-dark
      
      let y = 35;
      if (title && f) {
        doc.text(`Método de ${title}: f(x) = ${f}`, 14, y);
        y += 8;
      }
      
      if (params) {
        const paramStr = Object.entries(params).map(([k,v]) => `${k}: ${v}`).join(', ');
        doc.text(`Parámetros: ${paramStr}`, 14, y);
        y += 8;
      }

      if (result && result.raiz !== undefined && result.raiz !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 230, 118); // var(--success)
        doc.text(`Raíz encontrada: x = ${Number(result.raiz).toFixed(6)}`, 14, y);
        y += 15;
      } else {
        y += 7;
      }

      // Chart
      const chartEl = document.getElementById('chart-pdf-container');
      if (chartEl) {
        const canvas = await html2canvas(chartEl, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pw - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 14, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;
      }

      // Table
      if (result && result.iteraciones && columns) {
        const head = [ ['Iter', ...columns.map(c => c.label)] ];
        const body = result.iteraciones.map((row, i) => [
          i,
          ...columns.map(c => row[c.key] != null ? (typeof row[c.key] === 'number' ? row[c.key].toFixed(6) : row[c.key]) : '—')
        ]);

        autoTable(doc, {
          startY: y,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'center' },
          bodyStyles: { halign: 'center' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14 }
        });
      }

      doc.save(`Reporte_${title || 'Metodo'}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <button className="btn btn-secondary" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? '⏳ Generando reporte...' : '📝 Generar reporte en PDF'}
      </button>
    </div>
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
        <div style={{ color: 'var(--navy)' }}>
          {isRegresion ? (
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>Regresión Lineal</code>
          ) : (
            <Latex tex={formatMathToLatex(f)} display />
          )}
        </div>
      </div>

      {extraMetrics || <MetricsBar raiz={raiz} iters={iteraciones?.length ?? 0} />}

      <div style={{ marginTop: 12 }}>
        <div id="chart-pdf-container" style={{ padding: '10px' }}>
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
      </div>

      {showToggle && !isRegresion && (
        <div className="toggle-wrap no-pdf" style={{ marginTop: '1rem', marginBottom: '1rem' }} onClick={() => setShowIters(s => !s)}>
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
    <div id="pdf-content" className="page-content-wrap">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>
        Método {title}
      </h1>

      <div className="no-pdf">
        {teoria}
      </div>

      <div className="two-col">
        {/* LEFT — INPUTS */}
        <div className="card">
          <div className="card-header">
            <h4>Parámetros</h4>
            <span className="badge">{badge}</span>
          </div>

          <div>
            {inputs}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary no-pdf" onClick={onCalcular}>
              🚀 Calcular y Graficar
            </button>
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="card">
          {result}
        </div>
      </div>

      {codeSnippet && (
        <div className="no-pdf card" style={{ marginTop: '2rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.2rem' }}>Código en Python</h4>
          </div>
          {codeSnippet}
        </div>
      )}
    </div>
  )
}
