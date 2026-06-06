import { useState } from 'react'
import { generateMatrixPdf, generateTablePdf } from '../utils/pdfGenerator'
import { Expander, VSCodeBlock } from './MethodLayout'

// Variable names for unknowns: x, y, z, w, v, u, then x7, x8...
const VAR_NAMES = ['x', 'y', 'z', 'w', 'v', 'u']
const varLabel = i => VAR_NAMES[i] ?? `x${i + 1}`

// ─── AUGMENTED MATRIX DISPLAY ────────────────────────────────────────────────
/**
 * Renders a matrix in bracket notation with an optional divider column.
 * Used to display the augmented matrix [A | b] at each step.
 */
export function MatrixDisplay({ matrix, highlightRow = -1, highlightPivotRow = -1 }) {
  if (!matrix || matrix.length === 0) return null

  const rows = matrix.length
  const cols = matrix[0].length // last col is the b vector

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', padding: '0 16px', width: '100%', maxWidth: '850px' }}>
        {/* CSS Brackets */}
        <div className="matrix-bracket matrix-bracket-left" />
        <div className="matrix-bracket matrix-bracket-right" />

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <tbody>
            {matrix.map((row, r) => {
              const isPivot = r === highlightPivotRow
              const isMod = r === highlightRow
              return (
                <tr key={r} className={`matrix-row ${isMod ? 'is-mod' : ''} ${isPivot ? 'is-pivot' : ''}`}>
                  {row.map((val, c) => {
                    const isB = c === cols - 1
                    const v = typeof val === 'string' ? parseFloat(val) : val
                    const displayVal = (typeof v === 'number' && !isNaN(v)) 
                      ? (Math.abs(v) < 1e-9 ? '0' : (Number.isInteger(v) ? v : Number(v.toFixed(5)))) 
                      : val

                    return (
                      <td key={c} className={`matrix-cell ${isB ? 'is-b' : ''}`}>
                        {displayVal}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
            <span style={{ color: 'var(--slate)', fontSize: '0.82rem' }}>{varLabel(i)} =</span>
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
              <div key={i} style={{ borderRadius: '8px', border: `1px solid ${accent}`, overflow: 'hidden' }}>
                {/* Step header */}
                <div
                  style={{
                    background: `${accent}18`,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{
                    minWidth: '28px', height: '28px', borderRadius: '50%',
                    background: accent, color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800,
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)', flex: 1 }}>
                    {paso.descripcion}
                  </span>
                </div>

                {/* Step body — augmented matrix always visible */}
                <div style={{ padding: '12px 14px', background: 'var(--surface)', overflowX: 'auto' }}>
                  <MatrixDisplay
                    matrix={paso.matriz}
                    highlightPivotRow={paso.pivote_fila}
                    highlightRow={paso.fila_modificada}
                  />
                </div>
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
export default function MatrixLayout({ title, badge, teoria, inputs, onCalcular, result, error, resultContent, codeRaw, matrixA, vectorB, iteraciones, columns, extra, hidePdf }) {
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
      if (!matrixA && iteraciones && columns) {
        generateTablePdf({ title, iteraciones, columns })
      } else {
        generateMatrixPdf({ title, n: matrixA?.length || 0, matrix: matrixA, vector: vectorB, result })
      }
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

      <div className="two-col two-col--matrix">
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
        {/* resultContent toma prioridad: permite que páginas como Gauss inyecten
            su propio panel sin que MatrixResultsPanel pise el renderizado. */}
        <div className="card">
          {/* resultContent takes priority (EliminacionGaussiana injects its own panel).
              Falls back to MatrixResultsPanel when result or error is present. */}
          {(resultContent != null || result != null || error) ? (
            resultContent != null
              ? resultContent
              : <MatrixResultsPanel result={result} apiError={error} />
          ) : (
            <div className="empty-panel">
              <div className="empty-panel-icon"></div>
              <h2>Panel de Resultados</h2>
              <p>Ingresa los coeficientes y presiona el botón para resolver el sistema.</p>
              <div className="empty-panel-badge">LISTO PARA CALCULAR</div>
            </div>
          )}

          {(resultContent != null || result != null || error) && !hidePdf && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleGeneratePdf}>
                Generar reporte en PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extra content (steps panel, etc.) — full width below the two columns */}
      {extra}

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
