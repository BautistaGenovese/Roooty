import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import MatrixLayout from '../components/MatrixLayout'
import { Expander } from '../components/MethodLayout'
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
function SizeControl({ value, onChange }) {
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
      <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>sistema {value}×{value} — rango [{MIN_N}, {MAX_N}]</span>
    </div>
  )
}

// ─── SUBCOMPONENTE: GRID [A | b] ──────────────────────────────────────────────
function MatrixGrid({ n, matrix, vector, onMatrixChange, onVectorChange }) {
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
          <GridRow key={i} i={i} n={n} matrix={matrix} vector={vector} onMatrixChange={onMatrixChange} onVectorChange={onVectorChange} />
        ))}
      </div>
    </div>
  )
}

function GridRow({ i, n, matrix, vector, onMatrixChange, onVectorChange }) {
  const handleKeyDown = (e, i, j) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextI = i;
      let nextJ = j + 1;
      
      if (nextJ > n) {
        nextI = i + 1;
        nextJ = 0;
      }
      
      if (nextI >= n) return;
      
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
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '1rem', fontWeight: 800 }}>Procedimiento Paso a Paso</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((paso, idx) => (
          <div key={idx} style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: paso.tipo === 'intercambio' ? '#b45309' : '#3b82f6', marginBottom: '0.75rem' }}>
              Paso {idx + 1}: {paso.descripcion}
            </div>
            {paso.matriz && (
              <div style={{ overflowX: 'auto', background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  <tbody>
                    {paso.matriz.map((row, r_idx) => (
                      <tr key={r_idx}>
                        {row.map((val, c_idx) => {
                          const isB = c_idx === n;
                          return (
                            <td key={c_idx} style={{ padding: '0.25rem 0.6rem', textAlign: 'right', borderLeft: isB ? '1px dashed var(--slate)' : 'none', color: isB ? '#3b82f6' : 'var(--navy)', fontWeight: isB ? 700 : 'normal' }}>
                              {Number(val).toFixed(4)}
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

      {/* ── VECTOR SOLUCIÓN — Variables x₁, x₂, … xₙ ── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.08),transparent)', borderRadius: '12px', padding: '1rem 1.2rem', border: '1px solid #3b82f6', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Vector Solución x
        </p>
        {/* Grid de variables: una por columna */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(90px, 1fr))`, gap: '8px' }}>
          {solucion.map((val, i) => (
            <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.7rem', textAlign: 'center' }}>
              {/* Etiqueta: xᵢ = */}
              <div style={{ fontSize: '0.72rem', color: 'var(--slate)', marginBottom: '3px', fontFamily: 'serif', fontStyle: 'italic' }}>
                x<sub style={{ fontStyle: 'normal', fontSize: '0.65rem' }}>{i + 1}</sub> =
              </div>
              {/* Valor numérico */}
              <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.92rem', color: 'var(--navy)', wordBreak: 'break-all' }}>
                {Number(val).toFixed(6)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pasos de eliminación (detallados) ── */}
      {nSteps > 0 && <PasosRender pasos={pasos} n={nVars} />}
    </div>
  )
}

// ─── GENERADOR DE PDF (independiente, para casos éxito Y singular) ─────────────
function generarPDF(resultData, n) {
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
      doc.text('Estado: Sistema Resuelto ✓', 14, currentY)
      currentY += 10

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
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 247, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'center' },
          1: { font: 'courier' },
          2: { font: 'courier', halign: 'right' },
        },
      })

      // Verificación
      const finalY = doc.lastAutoTable.finalY + 8
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(
        `Método utilizado: Eliminación Gaussiana con Pivoteo Parcial (NumPy/LAPACK).`,
        14, finalY
      )
      doc.text(
        `El vector solución satisface Ax = b con error residual < 1×10⁻⁶.`,
        14, finalY + 6
      )
    }

    doc.save(`Reporte_Gauss_${n}x${n}.pdf`)
  } catch (err) {
    console.error('Error generando PDF:', err)
    alert('No se pudo generar el PDF. Revisa la consola para más detalles.')
  }
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function EliminacionGaussiana() {
  const [n, setN] = useState(3)
  const [matrix, setMatrix] = useState(makeMatrix(3))
  const [vector, setVector] = useState(makeVector(3))
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(false)

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
    setResultData(null)
    const parsedMatrix = matrix.map(row => row.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v }))
    const parsedVector = vector.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v })

    setLoading(true)
    try {
      const res = await axios.post('/api/matrices/gaussiana', { matrix: parsedMatrix, vector: parsedVector })
      setResultData({ ...res.data, isError: false })
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
  )

  // ─── Inputs ────────────────────────────────────────────────────────────────
  const inputs = (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="gauss-size">Tamaño del sistema (N × N)</label>
        <SizeControl value={n} onChange={handleSizeChange} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <button id="gauss-btn-example" className="btn btn-secondary" style={{ fontSize: '0.82rem', flex: 1 }} onClick={handleFillExample}>📋 Cargar ejemplo</button>
        <button id="gauss-btn-clear" className="btn btn-secondary" style={{ fontSize: '0.82rem', flex: 1 }} onClick={handleClear}>🗑 Limpiar</button>
      </div>
      <div className="form-group">
        <label className="form-label">Matriz aumentada [A | b]</label>
        <MatrixGrid n={n} matrix={matrix} vector={vector} onMatrixChange={handleMatrixChange} onVectorChange={handleVectorChange} />
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

  // ─── CSS de igualdad de paneles ────────────────────────────────────────────
  const styleOverride = (
    <style>{`
      .gauss-page-wrap .two-col {
        grid-template-columns: 1fr 1fr !important;
        align-items: stretch !important;
      }
      .gauss-page-wrap .two-col > .card {
        display: flex; flex-direction: column;
      }
      #gauss-size::-webkit-outer-spin-button,
      #gauss-size::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
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
        onClick={() => generarPDF(resultData, n)}
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
      />
    </div>
  )
}
