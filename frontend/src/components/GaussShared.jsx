import { useState, useEffect } from 'react'
import { generateMatrixPdf } from '../utils/pdfGenerator'
import { Expander } from './MethodLayout'
import { MatrixDisplay } from './MatrixLayout'

// ─── CONSTANTES ─────────────────────────────────────────────────────────────
export const MIN_N = 2
export const MAX_N = 8

export const makeMatrix = (n) => Array.from({ length: n }, () => Array(n).fill(''))
export const makeVector = (n) => Array(n).fill('')

// ─── SIZE CONTROL (estilo Gauss-Jordan + Limpiar arriba) ────────────────────
export function SizeControl({ value, onChange, onClear }) {
  const [display, setDisplay] = useState(String(value))
  useEffect(() => { setDisplay(String(value)) }, [value])

  return (
    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
      <label className="form-label" style={{ margin: 0 }}>Dimensión N</label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}
          disabled={value <= MIN_N}
          onClick={() => { const next = value - 1; setDisplay(String(next)); onChange(next) }}
        >−</button>

        <input
          type="text"
          inputMode="numeric"
          className="form-number"
          id="gauss-size"
          value={display}
          style={{ width: '52px', textAlign: 'center', padding: '5px 6px' }}
          onChange={e => {
            const raw = e.target.value
            setDisplay(raw)
            const val = parseInt(raw, 10)
            if (!isNaN(val) && val >= MIN_N && val <= MAX_N) onChange(val)
          }}
          onBlur={() => {
            const val = parseInt(display, 10)
            if (isNaN(val) || val < MIN_N || val > MAX_N) setDisplay(String(value))
          }}
        />

        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}
          disabled={value >= MAX_N}
          onClick={() => { const next = value + 1; setDisplay(String(next)); onChange(next) }}
        >+</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
          × {value} &nbsp;·&nbsp; mín {MIN_N}, máx {MAX_N}
        </span>

        {onClear && (
          <button
            className="btn-clear-matrix"
            onClick={onClear}
            title="Limpiar matriz"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MATRIX GRID [A | b]  (estilo Eliminación Gaussiana) ────────────────────
function GridRow({ i, n, matrix, vector, onMatrixChange, onVectorChange, onEnterEnd }) {
  const handleKeyDown = (e, ri, cj) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      let nextI = ri, nextJ = cj + 1
      if (nextJ > n) { nextI = ri + 1; nextJ = 0 }
      if (nextI >= n) {
        if (ri === n - 1 && cj === n && onEnterEnd) onEnterEnd()
        return
      }
      const nextId = nextJ < n ? `gauss-m-${nextI}-${nextJ}` : `gauss-v-${nextI}`
      document.getElementById(nextId)?.focus()
    }
  }

  return (
    <>
      {Array.from({ length: n }, (_, j) => (
        <input
          key={j} id={`gauss-m-${i}-${j}`} type="number" className="form-number"
          placeholder="0" value={matrix[i][j]}
          style={{ textAlign: 'center', padding: '7px 4px' }}
          onKeyDown={(e) => handleKeyDown(e, i, j)}
          onChange={(e) => onMatrixChange(i, j, e.target.value)}
        />
      ))}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--slate)', fontWeight: 700, fontSize: '1rem', userSelect: 'none',
      }}>│</div>
      <input
        id={`gauss-v-${i}`} type="number" className="form-number"
        placeholder="0" value={vector[i]}
        style={{ textAlign: 'center', padding: '7px 4px', borderColor: '#3b82f6', borderWidth: '2px' }}
        onKeyDown={(e) => handleKeyDown(e, i, n)}
        onChange={(e) => onVectorChange(i, e.target.value)}
      />
    </>
  )
}

export function MatrixGrid({ n, matrix, vector, onMatrixChange, onVectorChange, onEnterEnd }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, minmax(58px, 1fr)) 18px minmax(66px, 1fr)`,
        gap: '5px', alignItems: 'center',
        minWidth: `${n * 65 + 100}px`,
      }}>
        {/* Encabezados A */}
        {Array.from({ length: n }, (_, j) => (
          <div key={`h${j}`} style={{
            textAlign: 'center', fontSize: '0.78rem',
            color: 'var(--slate)', fontWeight: 700, paddingBottom: '3px',
          }}>
            x<sub>{j + 1}</sub>
          </div>
        ))}
        <div />
        {/* Encabezado b */}
        <div style={{
          textAlign: 'center', fontSize: '0.95rem', color: '#3b82f6',
          fontWeight: 800, fontStyle: 'italic', paddingBottom: '3px', fontFamily: 'serif',
        }}>b</div>
        {/* Filas */}
        {Array.from({ length: n }, (_, i) => (
          <GridRow key={i} i={i} n={n}
            matrix={matrix} vector={vector}
            onMatrixChange={onMatrixChange}
            onVectorChange={onVectorChange}
            onEnterEnd={onEnterEnd}
          />
        ))}
      </div>
    </div>
  )
}

// ─── PASOS RENDER (Refactorizado para modo oscuro / estético) ─────────────────
function getStepAccent(paso) {
  const desc = (paso.descripcion || '').toLowerCase()
  if (desc.startsWith('✅') || desc.includes('identidad')) return 'var(--success, #16a34a)'
  if (paso.tipo === 'intercambio' || desc.startsWith('intercambio')) return 'var(--amber, #f59e0b)'
  if (paso.tipo === 'normalizacion' || desc.startsWith('normaliz')) return '#3b82f6'
  if (paso.tipo === 'eliminacion' || desc.startsWith('eliminaci') || desc.startsWith('eliminación')) return '#8b5cf6'
  return '#3b82f6'
}

export function PasosRender({ pasos }) {
  if (!pasos || pasos.length === 0) return null
  const filtered = pasos.filter(p => p.tipo !== 'solucion')
  if (filtered.length === 0) return null

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <Expander className="expander--table" title="Procedimiento Paso a Paso" badge={`${filtered.length} PASOS`}>
        <div className="gauss-steps-container">
          {filtered.map((paso, i) => {
            const accent = getStepAccent(paso)
            return (
              <div key={i} className="gauss-step-card">
                {/* Cabecera del paso */}
                <div className="gauss-step-header">
                  <span className="gauss-step-number" style={{ background: accent }}>
                    {i + 1}
                  </span>
                  <span className="gauss-step-desc">
                    {paso.descripcion}
                  </span>
                </div>
                {/* Matriz del paso */}
                {paso.matriz && (
                  <div className="gauss-step-matrix">
                    <MatrixDisplay
                      matrix={paso.matriz}
                      highlightPivotRow={paso.pivote_fila ?? -1}
                      highlightRow={paso.fila_modificada ?? -1}
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

// ─── PANEL DE RESULTADOS (combinación de ambos estilos) ─────────────────────
const fmtVal = (val) => {
  const n = Number(val)
  return Number.isInteger(n) ? n : Number(n.toFixed(5).replace(/\.?0+$/, ''))
}

export function GaussResultsPanel({ result }) {
  if (!result) return null

  // ── Error / sistema singular ────────────────────────────────────────────
  if (result.isError) {
    const msgLower = (result.errorMsg || '').toLowerCase()
    const isSingular = msgLower.includes('singular') || msgLower.includes('solución única') || msgLower.includes('determinante')

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
          <strong>{isSingular ? '⚠️ Sin solución única' : '⚠️ Error del Backend'}</strong><br />
          {result.errorMsg}
        </div>
        {isSingular && (
          <div style={{
            marginTop: '1rem', padding: '0.85rem', borderRadius: '10px',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6,
          }}>
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

  // ── Solución exitosa ──────────────────────────────────────────────────
  const { solucion, pasos } = result
  const nVars = solucion.length
  const nPasos = pasos ? pasos.filter(p => p.tipo !== 'solucion').length : 0

  return (
    <div>
      {/* Barra de métricas */}
      <div className="metrics-bar" style={{ marginBottom: '1rem' }}>
        <div className="metric-item">
          <div className="metric-label">Estado</div>
          <div className="metric-value" style={{ fontSize: '1rem', color: 'var(--success)' }}>✓ Resuelto</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-label">Tamaño</div>
          <div className="metric-value">{nVars} × {nVars}</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-label">Operaciones</div>
          <div className="metric-value">{nPasos}</div>
        </div>
      </div>

      {/* Vector Solución — distribución uniforme en grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,.08), transparent)',
        borderRadius: '12px', padding: '0.85rem 1rem',
        border: '1px solid #3b82f6',
      }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6',
          marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>Vector Solución x</p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {solucion.map((val, i) => (
            <div key={i} className="gauss-sol-row">
              <span className="gauss-sol-label">x<sub style={{ fontStyle: 'normal', fontSize: '0.72rem' }}>{i + 1}</sub></span>
              <span className="gauss-sol-eq">=</span>
              <span className="gauss-sol-val">{fmtVal(val)}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--slate)', marginTop: '0.8rem' }}>
        💡 Verifica: sustituye los valores en el sistema original para comprobar que Ax = b.
      </p>
    </div>
  )
}

// ─── GENERADOR DE PDF (delegado al generador unificado) ─────────────────────
export function generarPDF(resultData, n, matrix, vector, methodName = 'Eliminación Gaussiana') {
  generateMatrixPdf({ title: methodName, n, matrix, vector, result: resultData })
}
