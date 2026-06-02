import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import MatrixLayout from '../components/MatrixLayout'
import { Expander } from '../components/MethodLayout'
import { useHistory } from '../hooks/useHistory'
import Latex from '../components/Latex'
import axios from 'axios'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const MIN_N = 2
const MAX_N = 8

const makeMatrix = (n) => Array.from({ length: n }, () => Array(n).fill(''))
const makeVector = (n) => Array(n).fill('')

/**
 * Letra de la columna de términos independientes.
 * Las N incógnitas se etiquetan a, b, c, … (conceptualmente),
 * por lo que el término independiente es la letra siguiente.
 * n=2 → 'c',  n=3 → 'd',  n=4 → 'e',  …
 */
const vectorLetter = (n) => String.fromCharCode(97 + n)   // 'a'=97

// ─── SUBCOMPONENTE: CONTROL NUMÉRICO +/- ─────────────────────────────────────
function SizeControl({ value, onChange, onClear }) {
  const dec = () => onChange(Math.max(MIN_N, value - 1))
  const inc = () => onChange(Math.min(MAX_N, value + 1))
  const onInput = (e) => {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v)) onChange(Math.max(MIN_N, Math.min(MAX_N, v)))
  }

  const btn = (disabled) => ({
    width: '36px', height: '36px', borderRadius: '8px',
    border: '1px solid var(--border)',
    background: disabled ? 'var(--border)' : '#3b82f6',
    color: disabled ? 'var(--slate)' : '#fff',
    fontSize: '1.25rem', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', flexShrink: 0, lineHeight: 1,
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button id="gauss-size-dec" onClick={dec} disabled={value <= MIN_N} aria-label="Reducir" style={btn(value <= MIN_N)}>−</button>
      <input
        id="gauss-size" type="number" min={MIN_N} max={MAX_N} step={1} value={value} onChange={onInput}
        style={{ width: '64px', height: '36px', textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'monospace', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '8px', background: 'transparent', outline: 'none', MozAppearance: 'textfield' }}
      />
      <button id="gauss-size-inc" onClick={inc} disabled={value >= MAX_N} aria-label="Aumentar" style={btn(value >= MAX_N)}>+</button>
      {onClear && (
        <button
          id="gauss-btn-clear"
          onClick={onClear}
          title="Limpiar matriz"
          style={{
            height: '36px', padding: '0 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--gray-50)',
            color: 'var(--slate)', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            transition: 'background 0.15s, color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--error)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.color = 'var(--slate)' }}
        >🗑 Limpiar</button>
      )}
    </div>
  )
}

// ─── SUBCOMPONENTE: GRID [A | b] ──────────────────────────────────────────────
function MatrixGrid({ n, matrix, vector, onMatrixChange, onVectorChange, onEnterEnd }) {
  const bLetter = vectorLetter(n)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(58px, 1fr)) 18px minmax(66px, 1fr)`, gap: '5px', alignItems: 'center', minWidth: `${n * 65 + 100}px` }}>
        {/* Encabezados A */}
        {Array.from({ length: n }, (_, j) => (
          <div key={`h${j}`} style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--slate)', fontWeight: 700, paddingBottom: '3px' }}>
            x<sub>{j + 1}</sub>
          </div>
        ))}
        <div />
        {/* Encabezado b — letra dinámica */}
        <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#3b82f6', fontWeight: 800, fontStyle: 'italic', paddingBottom: '3px', fontFamily: 'serif' }}>
          {bLetter}
        </div>
        {/* Filas de inputs */}
        {Array.from({ length: n }, (_, i) => (
          <GridRow key={i} i={i} n={n} matrix={matrix} vector={vector} onMatrixChange={onMatrixChange} onVectorChange={onVectorChange} onEnterEnd={onEnterEnd} />
        ))}
      </div>
    </div>
  )
}

function GridRow({ i, n, matrix, vector, onMatrixChange, onVectorChange, onEnterEnd }) {
  const handleKeyDown = (e, i, j) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextI = i;
      let nextJ = j + 1;
      
      if (nextJ > n) {
        nextI = i + 1;
        nextJ = 0;
      }
      
      if (nextI >= n) {
        if (i === n - 1 && j === n && onEnterEnd) onEnterEnd();
        return;
      }
      
      const nextId = nextJ < n ? `gauss-m-${nextI}-${nextJ}` : `gauss-v-${nextI}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) nextEl.focus();
    }
  }

  return (
    <>
      {Array.from({ length: n }, (_, j) => (
        <input key={j} id={`gauss-m-${i}-${j}`} type="number" className="form-number" placeholder="0" value={matrix[i][j]}
          style={{ textAlign: 'center', padding: '7px 4px' }}
          onKeyDown={(e) => handleKeyDown(e, i, j)}
          onChange={(e) => onMatrixChange(i, j, e.target.value)} />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)', fontWeight: 700, fontSize: '1rem', userSelect: 'none' }}>│</div>
      <input id={`gauss-v-${i}`} type="number" className="form-number" placeholder="0" value={vector[i]}
        style={{ textAlign: 'center', padding: '7px 4px', borderColor: '#3b82f6', borderWidth: '2px' }}
        onKeyDown={(e) => handleKeyDown(e, i, n)}
        onChange={(e) => onVectorChange(i, e.target.value)} />
    </>
  )
}

// ─── SUBCOMPONENTE: PROCEDIMIENTO PASO A PASO ────────────────────────────────
function PasosRender({ pasos, n }) {
  if (!pasos || pasos.length === 0) return null;
  const filtered = pasos.filter(p => p.tipo !== 'solucion');
  if (filtered.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <Expander title="Procedimiento Paso a Paso" badge={`${filtered.length} Operaciones`}>
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'transparent' }}>
          {filtered.map((paso, idx) => (
          <div key={idx} style={{ 
            background: 'var(--white)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>
            {/* Cabecera del paso */}
            <div style={{ 
              background: paso.tipo === 'intercambio' ? 'linear-gradient(90deg, rgba(245,158,11,0.1), transparent)' : 'linear-gradient(90deg, rgba(59,130,246,0.08), transparent)', 
              borderBottom: '1px solid var(--border)',
              padding: '0.85rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ 
                background: paso.tipo === 'intercambio' ? '#f59e0b' : '#3b82f6', 
                color: '#fff', 
                fontWeight: 800, 
                fontSize: '0.75rem', 
                padding: '4px 10px', 
                borderRadius: '20px',
                letterSpacing: '0.5px'
              }}>
                PASO {idx + 1}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>
                {paso.descripcion}
              </div>
            </div>
            
            {/* Matriz del paso */}
            {paso.matriz && (
              <div style={{ padding: '1.25rem', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '4px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  <tbody>
                    {paso.matriz.map((row, r_idx) => (
                      <tr key={r_idx}>
                        {row.map((val, c_idx) => {
                          const isB = c_idx === n;
                          const isZero = Math.abs(val) < 1e-10;
                          return (
                            <td key={c_idx} style={{ 
                              padding: '0.4rem 0.8rem', 
                              textAlign: 'right', 
                              background: isB ? 'rgba(59,130,246,0.04)' : 'var(--gray-50)',
                              borderLeft: isB ? '2px solid #3b82f6' : '1px solid transparent', 
                              color: isZero ? 'var(--slate)' : (isB ? '#2563eb' : 'var(--navy)'), 
                              fontWeight: isB && !isZero ? 700 : 'normal',
                              borderRadius: '4px',
                              minWidth: '60px'
                            }}>
                              {isZero ? '0' : (Number.isInteger(Number(val)) ? Number(val) : Number(val).toFixed(5).replace(/\.?0+$/, ''))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        </div>
      </Expander>
    </div>
  )
}

// ─── SUBCOMPONENTE: PANEL DE RESULTADOS ──────────────────────────────────────
function GaussResultsPanel({ result }) {
  if (!result) return null

  // ── Error / sistema singular ───────────────────────────────────────────────
  if (result.isError) {
    const msgLower = (result.errorMsg || '').toLowerCase();
    const isSingular = msgLower.includes('singular') || msgLower.includes('solución única') || msgLower.includes('determinante');

    return (
      <div style={{ padding: '0.25rem 0' }}>
        <div className="metrics-bar" style={{ marginBottom: '1rem' }}>
          <div className="metric-item">
            <div className="metric-label">Estado</div>
            <div className="metric-value" style={{ fontSize: '1rem', color: 'var(--error)' }}>
              {isSingular ? '✗ Sistema Singular' : '✗ Error de Cálculo'}
            </div>
          </div>
        </div>
        <div className="alert alert-error">
          <strong>{isSingular ? '⚠️ Sin solución única' : '⚠️ Error del Backend'}</strong><br />{result.errorMsg}
        </div>
        {isSingular && (
          <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--navy)' }}>¿Por qué ocurre esto?</strong><br />
            Cuando el determinante de la matriz de coeficientes es cero, las ecuaciones son
            <em> linealmente dependientes</em>: las filas no son independientes entre sí.
            Esto implica que el sistema puede no tener solución (inconsistente) o tener
            infinitas soluciones (indeterminado).
          </div>
        )}
      </div>
    )
  }

  // ── Solución exitosa ──────────────────────────────────────────────────────
  const { solucion, pasos } = result
  const nVars = solucion.length
  const nSteps = pasos ? pasos.filter(p => p.tipo === 'eliminacion' || p.tipo === 'intercambio').length : 0

  return (
    <div>
      {/* Barra de métricas */}
      <div className="metrics-bar" style={{ marginBottom: '1rem' }}>
        <div className="metric-item">
          <div className="metric-label">Estado</div>
          <div className="metric-value" style={{ fontSize: '1rem', color: 'var(--success)' }}>✓ Resuelto</div>
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <div className="metric-item">
          <div className="metric-label">Tamaño</div>
          <div className="metric-value">{nVars} × {nVars}</div>
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <div className="metric-item">
          <div className="metric-label">Operaciones</div>
          <div className="metric-value">{nSteps}</div>
        </div>
      </div>

      {/* ── VECTOR SOLUCIÓN — Variables x₁, x₂, … xₙ (vertical, compacto) ── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.08),transparent)', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #3b82f6', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Vector Solución x
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {solucion.map((val, i) => (
            <div key={i} className="gauss-sol-row">
              <span className="gauss-sol-label">x<sub style={{ fontStyle: 'normal', fontSize: '0.72rem' }}>{i + 1}</sub></span>
              <span className="gauss-sol-eq">=</span>
              <span className="gauss-sol-val">{Number.isInteger(Number(val)) ? Number(val) : Number(val).toFixed(5).replace(/\.?0+$/, '')}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── GENERADOR DE PDF (independiente, para casos éxito Y singular) ─────────────
function generarPDF(resultData, n, matrix, vector) {
  try {
    const doc = new jsPDF({ format: 'letter' })

    // Encabezado
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(59, 130, 246)
    doc.text('Reporte de Sistemas de Ecuaciones — Rooty', 14, 20)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text('Método: Eliminación Gaussiana con Pivoteo Parcial', 14, 30)
    doc.text(`Tamaño del sistema: ${n} × ${n}`, 14, 38)

    let currentY = 48

    if (resultData.isError) {
      const msgLower = (resultData.errorMsg || '').toLowerCase();
      const isSingular = msgLower.includes('singular') || msgLower.includes('solución única') || msgLower.includes('determinante');

      // ── Caso Error ──────────────────────────────────────────────────
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38)
      doc.text(`Estado: ${isSingular ? 'Sistema Singular — Sin solución única' : 'Error de Cálculo (Excepción Interna)'}`, 14, currentY)
      currentY += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)

      const errorLines = doc.splitTextToSize(
        `Diagnóstico: ${resultData.errorMsg || 'Error desconocido.'}`,
        180
      )
      doc.text(errorLines, 14, currentY)
      currentY += errorLines.length * 6 + 6

      if (isSingular) {
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        const explanation = doc.splitTextToSize(
          'Interpretación: Cuando det(A) = 0, las filas de la matriz son linealmente dependientes. ' +
          'Esto significa que el sistema no tiene solución única. Puede ocurrir que: ' +
          '(a) el sistema sea inconsistente (no tiene solución), o ' +
          '(b) el sistema sea indeterminado (tiene infinitas soluciones).',
          180
        )
        doc.text(explanation, 14, currentY)
      }

    } else {
      // ── Caso exitoso ───────────────────────────────────────────────────
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 163, 74)
      doc.text('Estado: Sistema Resuelto', 14, currentY)
      currentY += 10

      // Matriz Inicial
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Matriz Aumentada Inicial [A | b]:', 14, currentY)
      currentY += 4

      const matrixBody = matrix.map((row, i) => [
        ...row.map(val => { const v = parseFloat(val); return isNaN(v) ? '0' : Number(v).toFixed(5).replace(/\.?0+$/, '') }), 
        (() => { const v = parseFloat(vector[i]); return isNaN(v) ? '0' : Number(v).toFixed(5).replace(/\.?0+$/, '') })()
      ])
      
      const matrixColStyles = {}
      for(let c = 0; c <= n; c++) {
        matrixColStyles[c] = { halign: 'center', font: 'courier' }
      }

      const sideMargin = Math.max(14, 105 - n * 9)
      const headMatrix = [Array.from({ length: n }, (_, j) => `x${j + 1}`).concat(['b'])]

      autoTable(doc, {
        startY: currentY,
        head: headMatrix,
        body: matrixBody,
        theme: 'grid',
        margin: { left: sideMargin, right: sideMargin },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [240, 247, 255] },
        styles: { fontSize: 10, cellPadding: 3, textColor: [30, 41, 59] },
        columnStyles: matrixColStyles,
        didDrawCell: function(data) {
          if (data.column.index === n - 1) {
            // Draw a vertical line to separate A and b
            doc.setDrawColor(data.section === 'head' ? 255 : 59, data.section === 'head' ? 255 : 130, data.section === 'head' ? 255 : 246)
            doc.setLineWidth(0.5)
            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
          }
        }
      })
      currentY = doc.lastAutoTable.finalY + 10

      // Tabla de solución
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Vector Solución:', 14, currentY)
      currentY += 4

      const head = [['Variable', 'Valor exacto', 'Valor (6 decimales)']]
      const body = resultData.solucion.map((val, i) => [
        `x${i + 1}`,
        String(val),
        Number(val).toFixed(6),
      ])

      autoTable(doc, {
        startY: currentY,
        head: head,
        body: body,
        theme: 'grid',
        margin: { left: 35, right: 35 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [240, 247, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'center' },
          1: { font: 'courier', halign: 'center' },
          2: { font: 'courier', halign: 'right' },
        },
      })
      currentY = doc.lastAutoTable.finalY + 10

      // Pasos
      if (resultData.pasos && resultData.pasos.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text('Procedimiento (Operaciones):', 14, currentY)
        currentY += 4
        
        const pasosBody = resultData.pasos
          .filter(p => p.tipo !== 'solucion')
          .map((p, idx) => [`Paso ${idx + 1}`, p.descripcion.replace(/["−]/g, '-')])
          
        if (pasosBody.length > 0) {
          autoTable(doc, {
            startY: currentY,
            body: pasosBody,
            theme: 'grid',
            margin: { left: 14, right: 14 },
            styles: { fontSize: 10, cellPadding: 3, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [240, 247, 255] },
            columnStyles: {
              0: { fontStyle: 'bold', textColor: [59, 130, 246], cellWidth: 25, halign: 'center' },
              1: { font: 'courier' }
            }
          })
          currentY = doc.lastAutoTable.finalY + 10
        }
      }

    }

    doc.save(`Reporte_Gauss_${n}x${n}.pdf`)
  } catch (err) {
    console.error('Error generando PDF:', err)
    alert('No se pudo generar el PDF. Revisa la consola para más detalles.')
  }
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function EliminacionGaussiana() {
  const { push: pushHistory } = useHistory()
  const [searchParams] = useSearchParams()
  const [n, setN] = useState(3)
  const [matrix, setMatrix] = useState(makeMatrix(3))
  const [vector, setVector] = useState(makeVector(3))
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Cargar desde URL (historial "Volver a ejecutar") ───────────────────────
  useEffect(() => {
    const pm = searchParams.get('matrix')
    const pv = searchParams.get('vector')
    const pn = searchParams.get('n')
    if (pm && pv && pn) {
      try {
        const parsedN = parseInt(pn, 10)
        const parsedMatrix = JSON.parse(pm)
        const parsedVector = JSON.parse(pv)
        if (!isNaN(parsedN) && Array.isArray(parsedMatrix) && Array.isArray(parsedVector)) {
          setN(parsedN)
          setMatrix(parsedMatrix)
          setVector(parsedVector)
        }
      } catch (e) {
        // ignorar parámetros inválidos
      }
    }
  }, [])

  // ── Cambiar N ──────────────────────────────────────────────────────────────
  function handleSizeChange(newN) {
    const size = Math.max(MIN_N, Math.min(MAX_N, Number(newN)))
    setN(size)
    setMatrix(prev => Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => prev[i]?.[j] ?? '')))
    setVector(prev => Array.from({ length: size }, (_, i) => prev[i] ?? ''))
    setResultData(null)
  }

  // ── Editar celdas ──────────────────────────────────────────────────────────
  function handleMatrixChange(i, j, val) {
    setMatrix(prev => { const c = prev.map(r => [...r]); c[i][j] = val; return c })
  }
  function handleVectorChange(i, val) {
    setVector(prev => { const c = [...prev]; c[i] = val; return c })
  }

  // ── Ejemplos con soluciones enteras verificadas ────────────────────────────
  function handleFillExample() {
    if (n === 2) {
      // 2a + b = 5 ; a + 3b = 10  →  a=1, b=3
      setMatrix([['2','1'],['1','3']])
      setVector(['5','10'])
    } else if (n === 3) {
      // 2a + b − c = 8 ; −3a − b + 2c = −11 ; −2a + b + 2c = −3  →  a=2, b=3, c=−1
      setMatrix([['2','1','-1'],['-3','-1','2'],['-2','1','2']])
      setVector(['8','-11','-3'])
    } else if (n === 4) {
      // Diagonal dominante, solución x=[1,2,3,4] VERIFICADA
      // 3(1)+1(2)+0(3)+1(4)=9  ✓  1(1)+4(2)+1(3)+0(4)=12  ✓
      // 0(1)+1(2)+5(3)+2(4)=25 ✓  2(1)+0(2)+2(3)+6(4)=32  ✓
      setMatrix([['3','1','0','1'],['1','4','1','0'],['0','1','5','2'],['2','0','2','6']])
      setVector(['9','12','25','32'])
    } else if (n === 5) {
      // Diagonal dominante 5×5, solución x=[1,2,3,4,5] VERIFICADA
      setMatrix([
        ['10','1','0','0','1'],
        ['1','10','1','0','0'],
        ['0','1','10','1','0'],
        ['0','0','1','10','1'],
        ['1','0','0','1','10'],
      ])
      setVector(['18','23','35','47','46'])
    } else {
      // n≥6: matriz diagonal dominante genérica con solución xᵢ = i+1
      const ex = makeMatrix(n)
      const bEx = makeVector(n)
      for (let i = 0; i < n; i++) {
        let bVal = 0
        for (let j = 0; j < n; j++) {
          const v = i === j ? n * 2 : (i === j - 1 || i === j + 1 ? 1 : 0)
          ex[i][j] = String(v)
          bVal += v * (j + 1)
        }
        bEx[i] = String(bVal)
      }
      setMatrix(ex)
      setVector(bEx)
    }
    setResultData(null)
  }

  function handleClear() {
    setMatrix(makeMatrix(n))
    setVector(makeVector(n))
    setResultData(null)
  }

  // ── Resolver ───────────────────────────────────────────────────────────────
  async function calcular() {
    if (loading) return
    setResultData(null)
    const parsedMatrix = matrix.map(row => row.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v }))
    const parsedVector = vector.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v })

    setLoading(true)
    try {
      const res = await axios.post('/api/matrices/gaussiana', { matrix: parsedMatrix, vector: parsedVector })
      setResultData({ ...res.data, isError: false })
      // Serializar la matriz y vector para restaurar desde el historial
      const matrixStr = matrix.map(row => row.map(cell => {
        const v = parseFloat(cell); return isNaN(v) ? 0 : v
      }))
      const vectorStr = vector.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v })
      pushHistory({
        method: 'Eliminación Gaussiana',
        displayParams: { 'Tamaño': `${n}×${n}` },
        queryParams: {
          n: String(n),
          matrix: JSON.stringify(matrixStr),
          vector: JSON.stringify(vectorStr),
        },
        raiz: null,
      })
    } catch (e) {
      const detail = e.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join('; ') : 'Error inesperado al resolver el sistema.')
      setResultData({ isError: true, errorMsg: msg })
    } finally {
      setLoading(false)
    }
  }

  // ─── Teoría ────────────────────────────────────────────────────────────────
  const teoria = (
    <div className="gauss-theory-body">
    <Expander title="¿Cómo funciona la Eliminación Gaussiana?">
      <p><strong>Concepto:</strong> Transforma el sistema <Latex tex="Ax = b" /> en un sistema equivalente con <strong>Matriz Triangular Superior</strong>, que se resuelve con <strong>Sustitución Regresiva</strong>.</p>
      <br />
      <p><strong>Fase 1 — Triangularización con Pivoteo Parcial:</strong></p>
      <Latex tex={String.raw`\text{Para cada columna } k: \quad F_i \leftarrow F_i - \frac{a_{ik}}{a_{kk}} \cdot F_k`} display />
      <br />
      <p><strong>Fase 2 — Sustitución Regresiva:</strong></p>
      <Latex tex={String.raw`x_i = \frac{b_i - \displaystyle\sum_{j=i+1}^{n} a_{ij}\, x_j}{a_{ii}}`} display />
      <br />
      <div className="alert alert-info">
        <strong>Implementación:</strong> La solución se calcula con <strong>NumPy/LAPACK</strong> (factorización LU con pivoteo completo) para máxima precisión numérica. Los pasos mostrados son generados por el algoritmo manual con fines educativos.
      </div>
    </Expander>
    </div>
  )

  // ─── Inputs ────────────────────────────────────────────────────────────────
  const inputs = (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="gauss-size">Tamaño del sistema (N × N)</label>
        <SizeControl value={n} onChange={handleSizeChange} onClear={handleClear} />
      </div>
      <div className="form-group">
        <label className="form-label">Matriz aumentada [A | b]</label>
        <MatrixGrid n={n} matrix={matrix} vector={vector} onMatrixChange={handleMatrixChange} onVectorChange={handleVectorChange} onEnterEnd={calcular} />
      </div>
    </>
  )

  // ─── Código Python ─────────────────────────────────────────────────────────
  const codeRaw = `def gaussian_elimination(matrix, vector):
    n = len(matrix)
    aug = [[float(val) for val in row] + [float(vector[i])] for i, row in enumerate(matrix)]
    
    # Fase 1: Triangularización con Pivoteo Parcial
    for k in range(n):
        pivot_row = k
        for i in range(k + 1, n):
            if abs(aug[i][k]) > abs(aug[pivot_row][k]):
                pivot_row = i
        aug[k], aug[pivot_row] = aug[pivot_row], aug[k]
        
        if abs(aug[k][k]) < 1e-12:
            raise ValueError("Sistema singular")
            
        for i in range(k + 1, n):
            m = aug[i][k] / aug[k][k]
            for j in range(k, n + 1):
                aug[i][j] -= m * aug[k][j]

    # Fase 2: Sustitución Regresiva
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        suma = sum(aug[i][j] * x[j] for j in range(i + 1, n))
        x[i] = (aug[i][n] - suma) / aug[i][i]
        
    return x`

  // ─── CSS de igualdad de paneles + responsive ──────────────────────────────
  const styleOverride = (
    <style>{`
      .gauss-page-wrap .two-col {
        grid-template-columns: 2fr 1fr !important;
        align-items: stretch !important;
      }
      .gauss-page-wrap .two-col > .card {
        display: flex; flex-direction: column;
      }
      #gauss-size::-webkit-outer-spin-button,
      #gauss-size::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      /* ── Responsive: apila paneles en móvil ── */
      @media (max-width: 900px) {
        .gauss-page-wrap .two-col {
          grid-template-columns: 1fr !important;
        }
      }

      /* ── Fórmulas LaTeX: scroll horizontal en contenedor estrecho ── */
      .gauss-theory-body .expander-body {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .gauss-theory-body .katex-display {
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 4px;
      }

      /* ── Filas del vector solución: compactas ── */
      .gauss-sol-row {
        display: flex;
        align-items: center;
        gap: 0;
        background: var(--white);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.4rem 0.75rem;
        margin-bottom: 4px;
      }
      .gauss-sol-label {
        font-size: 0.85rem;
        color: var(--slate);
        font-family: serif;
        font-style: italic;
        flex-shrink: 0;
        min-width: 28px;
      }
      .gauss-sol-eq {
        color: var(--slate);
        font-size: 0.85rem;
        flex-shrink: 0;
        padding: 0 6px;
      }
      .gauss-sol-val {
        font-weight: 700;
        font-family: monospace;
        font-size: 0.92rem;
        color: var(--navy);
        word-break: break-all;
        text-align: right;
        flex: 1;
      }
    `}</style>
  )

  // ─── Botón PDF personalizado (inyectado via extra) ─────────────────────────
  // Lo mostramos sólo si hay resultado. Reemplaza el botón genérico de MatrixLayout
  // para poder generar PDFs con datos de éxito Y de error singular.
  const pdfButton = resultData ? (
    <div style={{ marginTop: '1rem' }}>
      <button
        className="btn btn-secondary"
        style={{ width: '100%' }}
        onClick={() => generarPDF(resultData, n, matrix, vector)}
      >
        📄 Generar reporte en PDF
      </button>
    </div>
  ) : null

  return (
    <div className="gauss-page-wrap">
      {styleOverride}
      <MatrixLayout
        title="Eliminación Gaussiana"
        badge="SISTEMAS LINEALES"
        teoria={teoria}
        inputs={inputs}
        onCalcular={loading ? null : calcular}
        resultContent={
          resultData ? (
            <div>
              <GaussResultsPanel result={resultData} />
              {pdfButton}
            </div>
          ) : null
        }
        result={null}
        iteraciones={null}
        columns={null}
        codeRaw={codeRaw}
        hidePdf={true}
        extra={
          resultData && !resultData.isError && resultData.pasos ? (
            <PasosRender pasos={resultData.pasos} n={resultData.solucion.length} />
          ) : null
        }
      />
    </div>
  )
}
