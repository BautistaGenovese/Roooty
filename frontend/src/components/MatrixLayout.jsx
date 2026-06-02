import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Expander, VSCodeBlock } from './MethodLayout'

// ─── AUGMENTED MATRIX DISPLAY ────────────────────────────────────────────────
/**
 * Renders a matrix in bracket notation with an optional divider column.
 * Used to display the augmented matrix [A | b] at each step.
 */
export function MatrixDisplay({ matrix, highlightRow = -1, highlightPivotRow = -1, n }) {
  if (!matrix || matrix.length === 0) return null

  const rows = matrix.length
  const cols = matrix[0].length // last col is the b vector

  const cellStyle = (r, c) => ({
    padding: '4px 10px',
    textAlign: 'right',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    fontWeight: r === highlightPivotRow ? 700 : 400,
    color: r === highlightPivotRow
      ? 'var(--blue)'
      : r === highlightRow
        ? 'var(--success)'
        : 'var(--navy)',
    background: r === highlightRow
      ? 'rgba(0,230,118,0.08)'
      : r === highlightPivotRow
        ? 'rgba(59,130,246,0.08)'
        : 'transparent',
    transition: 'background 0.25s',
    borderRight: c === cols - 2 ? '2px solid var(--blue)' : 'none',
    minWidth: '56px',
  })

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      background: 'var(--gray-50)',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      padding: '6px 4px',
      overflowX: 'auto',
      maxWidth: '100%',
    }}>
      {/* Left bracket */}
      <div style={{ fontSize: '2.4rem', color: 'var(--slate)', lineHeight: 1, paddingLeft: 2, fontWeight: 100 }}>⎡<br />⎢<br />⎣</div>

      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {matrix.map((row, r) => (
            <tr key={r}>
              {row.map((val, c) => (
                <td key={c} style={cellStyle(r, c)}>
                  {typeof val === 'number' ? (Math.abs(val) < 1e-9 ? '0' : val.toFixed(4)) : val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Right bracket */}
      <div style={{ fontSize: '2.4rem', color: 'var(--slate)', lineHeight: 1, paddingRight: 2, fontWeight: 100 }}>⎤<br />⎥<br />⎦</div>
    </div>
  )
}

// ─── SOLUTION VECTOR DISPLAY ──────────────────────────────────────────────────
/**
 * Renders the solution vector x = [x1, x2, ..., xn] in a styled box.
 */
export function SolutionVector({ solucion }) {
  if (!solucion || solucion.length === 0) return null

  return (
    <div style={{
      marginTop: '1.2rem',
      padding: '1rem 1.2rem',
      background: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(59,130,246,0.08) 100%)',
      borderRadius: '12px',
      border: '1.5px solid var(--success)',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--success)', marginBottom: '0.7rem' }}>
        ✅ SOLUCIÓN DEL SISTEMA
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {solucion.map((val, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
          }}>
            <span style={{ color: 'var(--slate)', fontSize: '0.82rem' }}>x<sub>{i + 1}</sub> =</span>
            <span style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '1rem' }}>
              {Math.abs(val) < 1e-9 ? '0' : val.toFixed(6)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── STEPS PANEL ──────────────────────────────────────────────────────────────
/**
 * Shows the Gauss-Jordan reduction steps as an interactive accordion.
 * Each step has a description and the current state of the augmented matrix.
 */
export function StepsPanel({ pasos }) {
  const [activeStep, setActiveStep] = useState(null)

  if (!pasos || pasos.length === 0) return null

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <Expander
        title="Ver pasos de la reducción"
        badge={`${pasos.length} PASOS`}
        className="expander--table"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pasos.map((paso, i) => {
            const isActive = activeStep === i
            const isNorm = paso.descripcion.startsWith('Normaliz')
            const isSwap = paso.descripcion.startsWith('Intercambio')
            const isElim = paso.descripcion.startsWith('Eliminación')
            const isDone = paso.descripcion.startsWith('✅')

            const accent = isDone
              ? 'var(--success)'
              : isNorm
                ? 'var(--blue)'
                : isSwap
                  ? 'var(--amber, #f59e0b)'
                  : isElim
                    ? 'var(--purple, #8b5cf6)'
                    : 'var(--slate)'

            return (
              <div key={i} style={{ borderRadius: '8px', border: `1px solid ${isActive ? accent : 'var(--border)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Step header */}
                <button
                  onClick={() => setActiveStep(isActive ? null : i)}
                  style={{
                    width: '100%',
                    background: isActive ? `${accent}14` : 'var(--gray-50)',
                    border: 'none',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    minWidth: '28px', height: '28px', borderRadius: '50%',
                    background: accent, color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800,
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)', flex: 1 }}>
                    {paso.descripcion}
                  </span>
                  <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>{isActive ? '▲' : '▼'}</span>
                </button>

                {/* Step body — augmented matrix */}
                {isActive && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', overflowX: 'auto' }}>
                    <MatrixDisplay
                      matrix={paso.matriz}
                      highlightPivotRow={paso.pivote_fila}
                      highlightRow={paso.fila_modificada}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Expander>
    </div>
  )
}

// ─── NO SOLUTION BANNER ───────────────────────────────────────────────────────
function NoSolutionBanner({ message }) {
  const isSingular = message?.toLowerCase().includes('singular') ||
                     message?.toLowerCase().includes('infinitas')
  return (
    <div style={{
      padding: '1.4rem 1.2rem',
      borderRadius: '12px',
      border: `2px solid ${isSingular ? 'var(--amber, #f59e0b)' : 'var(--error)'}`,
      background: isSingular
        ? 'rgba(245,158,11,0.08)'
        : 'rgba(239,68,68,0.08)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
        {isSingular ? '⚠️' : '❌'}
      </div>
      <div style={{
        fontWeight: 800,
        fontSize: '1rem',
        color: isSingular ? 'var(--amber, #b45309)' : 'var(--error)',
        marginBottom: '0.5rem',
      }}>
        {isSingular
          ? 'Sistema sin solución única'
          : 'El sistema no pudo resolverse'}
      </div>
      <p style={{ fontSize: '0.83rem', color: 'var(--slate)', margin: 0 }}>
        {isSingular
          ? 'La matriz es singular — el sistema puede tener infinitas soluciones o ninguna.'
          : (message || 'Verifica los coeficientes ingresados.')}
      </p>
      {isSingular && (
        <div style={{
          marginTop: '0.8rem',
          display: 'inline-flex',
          gap: '1.2rem',
          fontSize: '0.8rem',
          color: 'var(--slate)',
        }}>
          <span>• <strong>det(A) = 0</strong></span>
          <span>• Filas linealmente dependientes</span>
        </div>
      )}
    </div>
  )
}

// ─── MATRIX RESULTS PANEL ─────────────────────────────────────────────────────
export function MatrixResultsPanel({ result, apiError }) {
  // apiError: string error from the API (singular, etc.)
  if (!result && !apiError) return null

  // If there's an API error (e.g. singular matrix), show the banner
  if (apiError) return <NoSolutionBanner message={apiError} />

  return (
    <div>
      {/* Status + size + steps metrics */}
      <div className="metrics-bar" style={{ marginBottom: '1rem' }}>
        <div className="metric-item">
          <div className="metric-label">Estado</div>
          <div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
            ✅ Resuelto
          </div>
        </div>
        {result.n && (
          <>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-label">Tamaño</div>
              <div className="metric-value">{result.n} × {result.n}</div>
            </div>
          </>
        )}
        {result.solucion && (
          <>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-label">Pasos</div>
              <div className="metric-value">{result.pasos?.length ?? 0}</div>
            </div>
          </>
        )}
      </div>

      {result.solucion && <SolutionVector solucion={result.solucion} />}

      {result.solucion && (
        <p style={{ fontSize: '0.75rem', color: 'var(--slate)', marginTop: '0.8rem' }}>
          💡 Verifica: sustituye los valores en el sistema original para comprobar que Ax = b.
        </p>
      )}
    </div>
  )
}

// ─── MATRIX LAYOUT ────────────────────────────────────────────────────────────
export default function MatrixLayout({ title, badge, teoria, inputs, onCalcular, result, error, codeRaw }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!codeRaw) return
    navigator.clipboard.writeText(codeRaw.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // PDF generation
  const handleGeneratePdf = () => {
    try {
      const doc = new jsPDF({ format: 'letter' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(59, 130, 246)
      doc.text('Reporte de Sistemas de Ecuaciones — Roooty', 14, 20)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(`Método: ${title}`, 14, 30)

      if (result?.solucion) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 200, 100)
        doc.text('Solución:', 14, 40)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        result.solucion.forEach((val, i) => {
          doc.text(`  x${i + 1} = ${val.toFixed(6)}`, 14, 48 + i * 7)
        })

        if (result.pasos?.length) {
          const head = [['Paso', 'Descripción']]
          const body = result.pasos.map((p, i) => [i + 1, p.descripcion])
          autoTable(doc, {
            startY: 48 + result.solucion.length * 7 + 5,
            head, body,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 14 },
          })
        }
      }
      doc.save(`Reporte_${title || 'GaussJordan'}.pdf`)
    } catch (err) {
      console.error(err)
    }
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
            <h4>Parámetros del Sistema</h4>
            <span className="history-param-chip">{badge}</span>
          </div>

          <div>
            {inputs}
          </div>

          <div style={{ paddingTop: '1.5rem' }}>
            <button
              className="btn btn-primary no-pdf"
              onClick={onCalcular}
              disabled={!onCalcular}
              style={{ opacity: !onCalcular ? 0.6 : 1 }}
            >
              {!onCalcular ? 'Calculando…' : 'Resolver Sistema'}
            </button>
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="card">
          {(result || error) ? (
            <MatrixResultsPanel result={result} apiError={error} />
          ) : (
            <div className="empty-panel">
              <div className="empty-panel-icon"></div>
              <h2>Panel de Resultados</h2>
              <p>Ingresa los coeficientes y presiona el botón para resolver el sistema.</p>
              <div className="empty-panel-badge">LISTO PARA CALCULAR</div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleGeneratePdf}>
                Generar reporte en PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Steps panel — full width below the two columns */}
      {result?.pasos && <StepsPanel pasos={result.pasos} />}

      {/* Python code */}
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
