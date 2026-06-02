import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Expander, VSCodeBlock } from './MethodLayout'

// Variable names for unknowns: x, y, z, w, v, u, then x7, x8...
const VAR_NAMES = ['x', 'y', 'z', 'w', 'v', 'u']
const varLabel = i => VAR_NAMES[i] ?? `x${i + 1}`

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

<<<<<<< HEAD
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
export default function MatrixLayout({ title, badge, teoria, inputs, onCalcular, result, error, codeRaw, matrixA, vectorB }) {
=======
// ─── MATRIX LAYOUT ──────────────────────────────────────────────────────────────
export default function MatrixLayout({ title, badge, teoria, inputs, onCalcular, result, resultContent, codeRaw, iteraciones, columns, extra, hidePdf }) {
>>>>>>> 23cddc20078d5332f145062866712271a2e3b6ad
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
<<<<<<< HEAD
      const doc = new jsPDF({ format: 'letter' })
      const n = matrixA?.length || 0
      // Page usable width for letter (215.9mm) with 14mm margins
      const pageW = 215.9
      const marginL = 14

      // Helper: format a number for display
      const fmt = v => {
        const num = Number(v)
        if (Math.abs(num) < 1e-9) return '0'
        // Show up to 4 sig digits, trim trailing zeros
        return parseFloat(num.toFixed(4)).toString()
=======
      const doc = new jsPDF({ format: 'letter' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      doc.text(`Reporte de Sistemas de Ecuaciones - Rooty`, 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`Método: ${title}`, 14, 30);
      
      if (iteraciones && columns) {
        // Si la primera columna ya es identificadora (variable name), omitir 'Iter'
        const firstColIsLabel = iteraciones.length > 0 && typeof iteraciones[0][columns[0]?.key] === 'string';
        const head = firstColIsLabel
          ? [ columns.map(c => c.label) ]
          : [ ['#', ...columns.map(c => c.label)] ];
        const body = iteraciones.map((row, i) => [
          ...(firstColIsLabel ? [] : [i]),
          ...columns.map(c => {
            const v = row[c.key];
            if (v == null) return '—';
            return typeof v === 'number' ? v.toFixed(6) : String(v);
          })
        ]);

        autoTable(doc, {
          startY: 40,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
>>>>>>> 23cddc20078d5332f145062866712271a2e3b6ad
      }

      // ── Draw augmented matrix [A|b] with bracket lines ──────────────────────
      const drawAugMatrix = (startX, startY) => {
        const usableW = pageW - marginL * 2
        // Dynamic cell width: fit all columns plus separator
        const cellW = Math.min(24, (usableW - 10) / (n + 2))
        const cellH = 9       // mm per row
        const serifL = 3      // bracket serif length mm
        const pad = 1         // inner padding mm
        const sepGap = 2      // gap around | separator mm
        const fs = Math.max(7, Math.min(9, Math.floor(cellW * 0.38)))

        // X positions
        const matStartX = startX + serifL + pad
        const matW = n * cellW
        const sepX = matStartX + matW + sepGap        // vertical separator x
        const bX = sepX + sepGap                      // b-column left edge
        const bCenterX = bX + cellW / 2
        const rbX = bX + cellW + pad + serifL         // right bracket x
        const totalH = n * cellH

        // ── Column headers (variable names + b) ──────────────────────────────
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(fs - 0.5)
        doc.setTextColor(80, 80, 180)
        for (let j = 0; j < n; j++) {
          doc.text(varLabel(j), matStartX + (j + 0.5) * cellW, startY - 1.5, { align: 'center' })
        }
        doc.text('b', bCenterX, startY - 1.5, { align: 'center' })

        // ── Numbers ───────────────────────────────────────────────────────────
        doc.setFont('courier', 'normal')
        doc.setFontSize(fs)
        doc.setTextColor(30, 41, 59)
        for (let i = 0; i < n; i++) {
          const rowY = startY + i * cellH + cellH * 0.65
          for (let j = 0; j < n; j++) {
            doc.text(fmt(matrixA[i][j]), matStartX + (j + 0.5) * cellW, rowY, { align: 'center' })
          }
          doc.text(fmt(vectorB[i]), bCenterX, rowY, { align: 'center' })
        }

        // ── Separator line ────────────────────────────────────────────────────
        doc.setLineWidth(0.35)
        doc.setDrawColor(100, 100, 200)
        doc.line(sepX, startY, sepX, startY + totalH)

        // ── Left bracket [ ────────────────────────────────────────────────────
        doc.setLineWidth(0.8)
        doc.setDrawColor(30, 41, 59)
        const lb = startX
        doc.line(lb, startY, lb + serifL, startY)              // top serif →
        doc.line(lb, startY, lb, startY + totalH)              // vertical
        doc.line(lb, startY + totalH, lb + serifL, startY + totalH)  // bottom serif →

        // ── Right bracket ] ───────────────────────────────────────────────────
        const rb = rbX
        doc.line(rb - serifL, startY, rb, startY)              // top serif ←
        doc.line(rb, startY, rb, startY + totalH)              // vertical
        doc.line(rb - serifL, startY + totalH, rb, startY + totalH)  // bottom serif ←

        return startY + totalH + 6  // next Y
      }

      // ── Title ──────────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(59, 130, 246)
      doc.text('Reporte de Sistemas de Ecuaciones — Roooty', marginL, 20)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(`Método: ${title}`, marginL, 30)

      let curY = 38

      // ── System of equations ────────────────────────────────────────────────
      if (matrixA && vectorB && n > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(30, 41, 59)
        doc.text('Sistema de ecuaciones:', marginL, curY)
        curY += 7

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        for (let i = 0; i < n; i++) {
          let terms = ''
          let firstNonZero = true
          for (let j = 0; j < n; j++) {
            const c = Number(matrixA[i][j])
            if (c === 0) continue
            const abs = Math.abs(c)
            const sign = firstNonZero
              ? (c < 0 ? '-' : '')
              : (c > 0 ? ' + ' : ' - ')
            const coefStr = abs === 1 ? '' : fmt(abs)
            terms += `${sign}${coefStr}${varLabel(j)}`
            firstNonZero = false
          }
          if (!terms) terms = '0'
          doc.text(`  ${terms} = ${fmt(vectorB[i])}`, marginL, curY)
          curY += 6
        }
        curY += 4

        // ── Augmented matrix drawn with brackets ────────────────────────────
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(30, 41, 59)
        doc.text('Matriz aumentada [A | b]:', marginL, curY)
        curY += 6
        curY = drawAugMatrix(marginL, curY)
      }

      // ── Solution ───────────────────────────────────────────────────────────
      if (result?.solucion) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(0, 150, 80)
        doc.text('Solución:', marginL, curY)
        curY += 6
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        result.solucion.forEach((val, i) => {
          doc.text(`  ${varLabel(i)} = ${Number(val).toFixed(6)}`, marginL, curY)
          curY += 6
        })
        curY += 4

        // ── Steps table ────────────────────────────────────────────────────
        if (result.pasos?.length) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(30, 41, 59)
          doc.text('Pasos de la reducción:', marginL, curY)
          curY += 2
          const head = [['Paso', 'Descripción']]
          const body = result.pasos.map((p, i) => [i + 1, p.descripcion])
          autoTable(doc, {
            startY: curY,
            head, body,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: marginL, right: marginL },
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
<<<<<<< HEAD
          {(result || error) ? (
            <MatrixResultsPanel result={result} apiError={error} />
=======
          {(resultContent != null || result != null) ? (
            resultContent != null
              ? resultContent
              : <MatrixResultsPanel result={result} iteraciones={iteraciones} columns={columns} />
>>>>>>> 23cddc20078d5332f145062866712271a2e3b6ad
          ) : (
            <div className="empty-panel">
              <div className="empty-panel-icon"></div>
              <h2>Panel de Resultados</h2>
              <p>Ingresa los coeficientes y presiona el botón para resolver el sistema.</p>
              <div className="empty-panel-badge">LISTO PARA CALCULAR</div>
            </div>
          )}

<<<<<<< HEAD
          {result && (
=======
          {(resultContent != null || result != null) && !hidePdf && (
>>>>>>> 23cddc20078d5332f145062866712271a2e3b6ad
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
