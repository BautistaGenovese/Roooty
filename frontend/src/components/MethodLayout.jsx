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

export function Expander({ title, children, className = '', badge = null }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`expander ${className}`} style={{ marginBottom: '1rem' }}>
      <div className="expander-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {badge && (
            <span className="badge" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>{badge}</span>
          )}
          <span className={`expander-arrow ${open ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      <div className={`expander-body-wrapper ${open ? 'open' : ''}`} style={{ display: open ? 'block' : 'none' }}>
        <div className="expander-body">{children}</div>
      </div>
    </div>
  )
}

export function VSCodeBlock({ code }) {
  const KEYWORDS = new Set([
    'def','if','else','elif','for','while','return','import','from',
    'as','None','True','False','break','continue','in','pass','with',
    'try','except','finally','raise','range','abs','and','or','not','is',
    'lambda','class','global','nonlocal','del','yield','assert','print',
  ])

  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const tokenize = (src) => {
    const tokens = []
    let i = 0
    while (i < src.length) {
      if (src[i] === '#') {
        const end = src.indexOf('\n', i)
        const val = end === -1 ? src.slice(i) : src.slice(i, end)
        tokens.push({ type: 'comment', value: val })
        i += val.length
        continue
      }
      if (src[i] === '"' || src[i] === "'") {
        const q = src[i]
        let j = i + 1
        while (j < src.length && src[j] !== q) {
          if (src[j] === '\\') j++
          j++
        }
        tokens.push({ type: 'string', value: src.slice(i, j + 1) })
        i = j + 1
        continue
      }
      if (/\d/.test(src[i]) || (src[i] === '.' && /\d/.test(src[i + 1] || ''))) {
        let j = i
        while (j < src.length && /[\d.eE]/.test(src[j])) j++
        tokens.push({ type: 'number', value: src.slice(i, j) })
        i = j
        continue
      }
      if (/[a-zA-Z_]/.test(src[i])) {
        let j = i
        while (j < src.length && /\w/.test(src[j])) j++
        const word = src.slice(i, j)
        if (KEYWORDS.has(word))   tokens.push({ type: 'keyword',  value: word })
        else if (src[j] === '(') tokens.push({ type: 'function', value: word })
        else                      tokens.push({ type: 'plain',    value: word })
        i = j
        continue
      }
      if (/[+\-*/%=<>!&|^~]/.test(src[i])) {
        let j = i + 1
        if (j < src.length && /[=<>&|]/.test(src[j])) j++
        tokens.push({ type: 'operator', value: src.slice(i, j) })
        i = j
        continue
      }
      tokens.push({ type: 'plain', value: src[i] })
      i++
    }
    return tokens
  }

  const lines = code.trimEnd().replace(/^\n/, '').split('\n')

  return (
    <div className="code-block">
      {lines.map((line, i) => {
        const lineHtml = tokenize(line)
          .map(({ type, value }) => {
            const v = esc(value)
            return type === 'plain' ? v : `<span class="${type}">${v}</span>`
          })
          .join('')
        
        return (
          <div key={i} className="code-line">
            <span className="line-number">{i + 1}</span>
            <div className="line-content" dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }} />
          </div>
        )
      })}
    </div>
  )
}



// ─── ITERATIONS TABLE ─────────────────────────────────────────────────────────
export function IterTable({ rows, columns }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="table-wrap" style={{ fontSize: '0.78rem' }}>
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
  isPuntoFijo = false, isRegresion = false,
  regresionChart = null, regresionData = null,
  extraMetrics = null,
}) {
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
      <div className="formula-display" style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--slate)', fontWeight: 700, letterSpacing: 1.2, display: 'block', opacity: 0.8 }}>
          FUNCIÓN EVALUADA
        </span>
        <div style={{ color: 'var(--navy)', marginTop: '-2px' }}>
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
            chartKey={chartKey}
            isPuntoFijo={isPuntoFijo}
            isRegresion={isRegresion}
          />
        </div>
      </div>
    </div>
  )
}

// ─── METHOD PAGE LAYOUT ───────────────────────────────────────────────────────
export default function MethodLayout({ title, badge, teoria, inputs, onCalcular, result, codeRaw, iteraciones, columns }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!codeRaw) return
    navigator.clipboard.writeText(codeRaw.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
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

      {/* ITERATION TABLE — outside the cards, full width */}
      {iteraciones && iteraciones.length > 0 && (
        <div className="no-pdf" style={{ marginTop: '1.5rem' }}>
          <Expander
            className="expander--table"
            title="📊 Ver tabla de iteraciones"
            badge={`${iteraciones.length} PASOS`}
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
