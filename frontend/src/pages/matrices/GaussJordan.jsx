import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import MatrixLayout from '../../components/MatrixLayout'
import { Expander } from '../../components/MethodLayout'
import Latex from '../../components/Latex'
import { useHistory } from '../../hooks/useHistory'

// ─── Constantes ────────────────────────────────────────────────────────────────
const MIN_SIZE = 2
const MAX_SIZE = 6

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeMatrix(n) {
  return Array.from({ length: n }, () => Array(n).fill(0))
}
function makeVector(n) {
  return Array(n).fill(0)
}
// 0 shows as '' (placeholder visible), any other number as string
const toDisplay = v => (v === 0 ? '' : String(v))

// ─── Augmented Input Grid ─────────────────────────────────────────────────────
// Renders [A | b] as one unified grid so Enter traverses the full row:
//   A[i][0] → A[i][1] → ... → A[i][n-1] → b[i] → A[i+1][0] → ...
function AugmentedInputGrid({ n, A, b, onChangeA, onChangeB }) {
  // Refs keyed: "A-i-j" for matrix cells, "b-i" for vector cells
  const inputRefs = useRef({})

  // Local display state — reset via React key (parent increments resetKey)
  const [dispA, setDispA] = useState(() => A.map(row => row.map(toDisplay)))
  const [dispB, setDispB] = useState(() => b.map(toDisplay))

  // Re-sync when n changes (resize without full remount)
  useEffect(() => {
    setDispA(A.map(row => row.map(toDisplay)))
    setDispB(b.map(toDisplay))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  // ── Focus helper ──────────────────────────────────────────────────────────────
  // col: 0..n-1 = matrix A columns, col === n = b column
  function moveFocus(row, col) {
    const key = col === n ? `b-${row}` : `A-${row}-${col}`
    inputRefs.current[key]?.focus()
  }

  function handleKeyDown(row, col, e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (col < n - 1) {
        moveFocus(row, col + 1)          // next A column
      } else if (col === n - 1) {
        moveFocus(row, n)                 // jump to b[row]
      } else {
        // col === n  →  b column, go to first A cell of next row
        if (row + 1 < n) moveFocus(row + 1, 0)
      }
      return
    }

    // Backspace on an empty cell → move backwards (reverse of Enter)
    if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault()
      if (col === n) {
        // b column → last A column of same row
        moveFocus(row, n - 1)
      } else if (col > 0) {
        // A column > 0 → previous A column
        moveFocus(row, col - 1)
      } else {
        // A column 0 → b column of previous row
        if (row > 0) moveFocus(row - 1, n)
      }
    }
  }

  // ── Change handlers ───────────────────────────────────────────────────────────
  function handleChangeA(i, j, raw) {
    raw = raw.replace(',', '.')
    if (!/^-?\d*\.?\d*$/.test(raw)) return

    setDispA(prev => {
      const d = prev.map(r => [...r])
      d[i][j] = raw
      return d
    })
    const v = raw === '' || raw === '-' ? 0 : parseFloat(raw)
    if (!isNaN(v)) onChangeA(i, j, v)
  }

  function handleChangeB(i, raw) {
    raw = raw.replace(',', '.')
    if (!/^-?\d*\.?\d*$/.test(raw)) return

    setDispB(prev => { const d = [...prev]; d[i] = raw; return d })
    const v = raw === '' || raw === '-' ? 0 : parseFloat(raw)
    if (!isNaN(v)) onChangeB(i, v)
  }

  // ── Shared input style ────────────────────────────────────────────────────────
  const inputStyle = {
    textAlign: 'center',
    minWidth: 0,
    padding: '6px 4px',
  }

  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr) 24px 80px`,
        gap: '6px',
        marginBottom: '4px',
      }}>
        {/* Header for A */}
        <div style={{ gridColumn: `1 / span ${n}`, textAlign: 'center' }}>
          <span className="form-label" style={{ fontSize: '0.75rem', margin: 0 }}>
            Matriz A ({n}×{n})
          </span>
        </div>
        {/* Spacer for divider */}
        <div />
        {/* Header for b */}
        <div style={{ textAlign: 'center' }}>
          <span className="form-label" style={{ fontSize: '0.75rem', margin: 0 }}>
            b
          </span>
        </div>
      </div>

      {/* Rows: A cells + divider + b cell */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr) 24px 80px`,
        gap: '6px',
        alignItems: 'center',
      }}>
        {Array.from({ length: n }, (_, i) => (
          <React.Fragment key={i}>
            {/* A[i][0..n-1] */}
            {Array.from({ length: n }, (_, j) => (
              <input
                key={`A-${i}-${j}`}
                ref={el => { inputRefs.current[`A-${i}-${j}`] = el }}
                type="text"
                inputMode="decimal"
                className="form-number"
                style={inputStyle}
                value={dispA[i]?.[j] ?? ''}
                placeholder="0"
                onChange={e => handleChangeA(i, j, e.target.value)}
                onKeyDown={e => handleKeyDown(i, j, e)}
              />
            ))}

            {/* Visual divider */}
            <div style={{
              textAlign: 'center',
              color: 'var(--blue)',
              fontWeight: 700,
              fontSize: '1.2rem',
              userSelect: 'none',
              opacity: 0.6,
            }}>
              |
            </div>

            {/* b[i] */}
            <input
              key={`b-${i}`}
              ref={el => { inputRefs.current[`b-${i}`] = el }}
              type="text"
              inputMode="decimal"
              className="form-number"
              style={{ ...inputStyle, background: 'rgba(59,130,246,0.06)', borderColor: 'var(--blue)' }}
              value={dispB[i] ?? ''}
              placeholder="0"
              onChange={e => handleChangeB(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, n, e)}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GaussJordan() {
  const { push: pushHistory } = useHistory()
  const [searchParams] = useSearchParams()

  const [n, setN] = useState(3)
  const [A, setA] = useState(makeMatrix(3))
  const [b, setBvec] = useState(makeVector(3))
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetKey, setResetKey] = useState(0) // forces AugmentedInputGrid re-mount

  // ── Restore from history URL params on mount ──────────────────────────────────
  useEffect(() => {
    const qA = searchParams.get('matA')
    const qb = searchParams.get('vecB')
    if (qA && qb) {
      try {
        const parsedA = JSON.parse(qA)
        const parsedB = JSON.parse(qb)
        setN(parsedB.length)
        setA(parsedA)
        setBvec(parsedB)
        setResetKey(k => k + 1)
      } catch (_) { /* ignore malformed params */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resize ────────────────────────────────────────────────────────────────────
  function resizeTo(newN) {
    setN(newN)
    setA(prev => {
      const m = makeMatrix(newN)
      for (let i = 0; i < Math.min(newN, prev.length); i++)
        for (let j = 0; j < Math.min(newN, prev[i].length); j++)
          m[i][j] = prev[i][j]
      return m
    })
    setBvec(prev => {
      const v = makeVector(newN)
      for (let i = 0; i < Math.min(newN, prev.length); i++) v[i] = prev[i]
      return v
    })
    setResult(null)
    setError(null)
    setResetKey(k => k + 1)
  }

  // ── Clear all ─────────────────────────────────────────────────────────────────
  function clearAll() {
    setA(makeMatrix(n))
    setBvec(makeVector(n))
    setResult(null)
    setError(null)
    setResetKey(k => k + 1)
  }

  // ── Update callbacks ──────────────────────────────────────────────────────────
  function updateA(i, j, v) {
    setA(prev => { const m = prev.map(r => [...r]); m[i][j] = v; return m })
  }
  function updateB(i, v) {
    setBvec(prev => { const vec = [...prev]; vec[i] = v; return vec })
  }

  // ── Preset example ────────────────────────────────────────────────────────────
  // System: 2x+y-z=8, -3x-y+2z=-11, -2x+y+2z=-3  →  x=[2, 3, -1]
  function loadPreset() {
    setN(3)
    setA([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]])
    setBvec([8, -11, -3])
    setResult(null)
    setError(null)
    setResetKey(k => k + 1)
  }

  // ── Calculate ─────────────────────────────────────────────────────────────────
  async function calcular() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post('/api/matrices/gauss-jordan', { A, b })
      const data = res.data
      setResult(data)

      pushHistory({
        method: 'Gauss-Jordan',
        displayParams: {
          'Sistema': `${n}×${n}`,
          'b': `[${b.map(v => Number(v).toFixed(2)).join(', ')}]`,
        },
        queryParams: {
          matA: JSON.stringify(A),
          vecB: JSON.stringify(b),
        },
        raiz: data.solucion
          ? data.solucion.map(v => Number(v).toFixed(4)).join(', ')
          : null,
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular. Verifica los coeficientes.')
    } finally {
      setLoading(false)
    }
  }

  // ── Theory ────────────────────────────────────────────────────────────────────
  const teoria = (
    <Expander title="¿Cómo funciona Gauss-Jordan?">
      <p>
        <strong>Objetivo:</strong> Resolver el sistema <Latex tex="Ax = b" /> transformando
        la matriz aumentada <Latex tex="[A \mid b]" /> en la forma <Latex tex="[I \mid x]" />,
        donde <Latex tex="I" /> es la matriz identidad.
      </p>
      <br />
      <ol style={{ paddingLeft: '1.2rem', lineHeight: 2 }}>
        <li>Seleccionar el <strong>pivote</strong> con mayor valor absoluto (pivoteo parcial).</li>
        <li><strong>Normalizar</strong> la fila pivote:&nbsp;
          <Latex tex={String.raw`F_i \leftarrow \frac{F_i}{a_{ii}}`} display />
        </li>
        <li><strong>Eliminar</strong> en todas las demás filas:&nbsp;
          <Latex tex={String.raw`F_j \leftarrow F_j - a_{ji} \cdot F_i`} display />
        </li>
        <li>Repetir hasta obtener la identidad.</li>
      </ol>
      <div className="alert alert-info" style={{ marginTop: '0.8rem' }}>
        <strong>Diferencia con Gauss:</strong> elimina en <em>ambas</em> direcciones,
        sin necesidad de sustitución regresiva.
      </div>
    </Expander>
  )

  // ── Inputs ────────────────────────────────────────────────────────────────────
  // Local display string so the user can clear the field and retype
  const [nDisplay, setNDisplay] = useState(String(n))

  const sizeInput = (
    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      <label className="form-label" style={{ margin: 0 }}>Dimensión N</label>

      {/* Stepper row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Decrement */}
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}
          disabled={n <= MIN_SIZE}
          onClick={() => { const next = n - 1; setNDisplay(String(next)); resizeTo(next) }}
        >−</button>

        {/* Free-type input */}
        <input
          type="text"
          inputMode="numeric"
          className="form-number"
          value={nDisplay}
          style={{ width: '52px', textAlign: 'center', padding: '5px 6px' }}
          onChange={e => {
            const raw = e.target.value
            setNDisplay(raw)
            const val = parseInt(raw, 10)
            if (!isNaN(val) && val >= MIN_SIZE && val <= MAX_SIZE) resizeTo(val)
          }}
          onBlur={() => {
            // If the user leaves the field with an out-of-range or empty value, snap back
            const val = parseInt(nDisplay, 10)
            if (isNaN(val) || val < MIN_SIZE || val > MAX_SIZE) setNDisplay(String(n))
          }}
        />

        {/* Increment */}
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}
          disabled={n >= MAX_SIZE}
          onClick={() => { const next = n + 1; setNDisplay(String(next)); resizeTo(next) }}
        >+</button>
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
        × {n} &nbsp;·&nbsp; mín {MIN_SIZE}, máx {MAX_SIZE}
      </span>
    </div>
  )

  const inputs = (
    <>
      {sizeInput}

      <p style={{ fontSize: '0.78rem', color: 'var(--slate)', margin: '0.4rem 0 0.8rem' }}>
        Ingresa fila por fila.{' '}
        <kbd style={{ fontSize: '0.73rem', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--gray-50)' }}>
          Enter
        </kbd>{' '}
        recorre toda la fila incluyendo b.
      </p>

      <AugmentedInputGrid
        key={resetKey}
        n={n}
        A={A}
        b={b}
        onChangeA={updateA}
        onChangeB={updateB}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', color: 'var(--error)', borderColor: 'var(--error)' }}
          onClick={clearAll}
        >
          🗑️ Limpiar todo
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
    </>
  )

  // ── Python code ───────────────────────────────────────────────────────────────
  const code = `def gauss_jordan(A, b):
    n = len(b)
    aug = [A[i][:] + [b[i]] for i in range(n)]

    for col in range(n):
        # Pivoteo parcial
        max_row = max(range(col, n), key=lambda r: abs(aug[r][col]))
        aug[col], aug[max_row] = aug[max_row], aug[col]

        pivot = aug[col][col]
        if abs(pivot) < 1e-12:
            raise ValueError("Sistema singular o sin solucion unica")

        # Normalizar fila pivote
        aug[col] = [v / pivot for v in aug[col]]

        # Eliminar en todas las demas filas (arriba y abajo)
        for row in range(n):
            if row == col:
                continue
            factor = aug[row][col]
            aug[row] = [aug[row][j] - factor * aug[col][j]
                        for j in range(n + 1)]

    return [aug[i][n] for i in range(n)]`

  return (
    <MatrixLayout
      title="Eliminación de Gauss-Jordan"
      badge="SISTEMAS LINEALES"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={result}
      error={error}
      codeRaw={code}
      matrixA={A}
      vectorB={b}
    />
  )
}
