import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import MatrixLayout from '../../components/MatrixLayout'
import { Expander } from '../../components/MethodLayout'
import Latex from '../../components/Latex'
import { useHistory } from '../../hooks/useHistory'
import { useSettings } from '../../hooks/useSettings'

import {
  MIN_N, MAX_N, makeMatrix, makeVector,
  SizeControl, MatrixGrid, PasosRender,
  GaussResultsPanel, generarPDF,
} from '../../components/GaussShared'

// ─── PÁGINA: GAUSS-JORDAN ───────────────────────────────────────────────────
export default function GaussJordan() {
  const { push: pushHistory } = useHistory()
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()

  const [n, setN] = useState(3)
  const [matrix, setMatrix] = useState(makeMatrix(3))
  const [vector, setVector] = useState(makeVector(3))
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Restaurar desde historial URL params ──────────────────────────────
  useEffect(() => {
    const qA = searchParams.get('matA')
    const qb = searchParams.get('vecB')
    if (qA && qb) {
      try {
        const parsedA = JSON.parse(qA)
        const parsedB = JSON.parse(qb)
        const size = parsedB.length
        setN(size)
        // Convertir a strings para el MatrixGrid
        setMatrix(parsedA.map(row => row.map(v => v === 0 ? '' : String(v))))
        setVector(parsedB.map(v => v === 0 ? '' : String(v)))
      } catch (_) { /* ignorar params malformados */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cambiar tamaño ────────────────────────────────────────────────────
  function handleSizeChange(newN) {
    const size = Math.max(MIN_N, Math.min(MAX_N, Number(newN)))
    setN(size)
    setMatrix(prev => Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => prev[i]?.[j] ?? '')))
    setVector(prev => Array.from({ length: size }, (_, i) => prev[i] ?? ''))
    setResultData(null)
  }

  // ── Editar celdas ─────────────────────────────────────────────────────
  function handleMatrixChange(i, j, val) {
    setMatrix(prev => { const c = prev.map(r => [...r]); c[i][j] = val; return c })
  }
  function handleVectorChange(i, val) {
    setVector(prev => { const c = [...prev]; c[i] = val; return c })
  }

  // ── Limpiar ───────────────────────────────────────────────────────────
  function handleClear() {
    setMatrix(makeMatrix(n))
    setVector(makeVector(n))
    setResultData(null)
  }

  // ── Ejemplo precargado ────────────────────────────────────────────────
  function loadPreset() {
    setN(3)
    setMatrix([['2', '1', '-1'], ['-3', '-1', '2'], ['-2', '1', '2']])
    setVector(['8', '-11', '-3'])
    setResultData(null)
  }

  // ── Calcular ──────────────────────────────────────────────────────────
  async function calcular() {
    if (loading) return
    setResultData(null)

    // Parsear strings → números para la API
    const A = matrix.map(row => row.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v }))
    const b = vector.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v })

    setLoading(true)
    try {
      const res = await axios.post('/api/matrices/gauss-jordan', { A, b, cero_maquina: settings.ceroMaquina })
      const data = res.data
      setResultData({ ...data, isError: false })

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
      const detail = e.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : 'Error al calcular. Verifica los coeficientes.'
      setResultData({ isError: true, errorMsg: msg })
    } finally {
      setLoading(false)
    }
  }

  // ─── Teoría ───────────────────────────────────────────────────────────
  const teoria = (
    <div className="gauss-theory-body">
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
    </div>
  )

  // ─── Inputs ───────────────────────────────────────────────────────────
  const inputs = (
    <>
      <SizeControl value={n} onChange={handleSizeChange} onClear={handleClear} />
      <div className="form-group">
        <label className="form-label">Matriz aumentada [A | b]</label>
        <MatrixGrid n={n} matrix={matrix} vector={vector} onMatrixChange={handleMatrixChange} onVectorChange={handleVectorChange} onEnterEnd={calcular} />
      </div>
    </>
  )

  // ─── Código Python ────────────────────────────────────────────────────
  const formatMatrixArray = (m) => `[\n${m.map(row => `        [${row.map(v => v || '0').join(', ')}]`).join(',\n')}\n    ]`
  const formatVectorArray = (v) => `[${v.map(val => val || '0').join(', ')}]`

  const code = `def gauss_jordan(A, b, cero_maquina=1e-12):
    n = len(b)
    aug = [A[i][:] + [b[i]] for i in range(n)]

    for col in range(n):
        # Pivoteo parcial
        max_row = max(range(col, n), key=lambda r: abs(aug[r][col]))
        aug[col], aug[max_row] = aug[max_row], aug[col]

        pivot = aug[col][col]
        if abs(pivot) < cero_maquina:
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

    return [aug[i][n] for i in range(n)]

# Configuración actual de los ajustes
cero_maquina = ${settings.ceroMaquina}

# Sistema a resolver
A = ${formatMatrixArray(matrix)}
b = ${formatVectorArray(vector)}

solucion = gauss_jordan(A, b, cero_maquina=cero_maquina)
print("Solución:", solucion)`

  // ─── CSS overrides ────────────────────────────────────────────────────
  const styleOverride = (
    <style>{`
      .gauss-theory-body .expander-body {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .gauss-theory-body .katex-display {
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 4px;
      }
    `}</style>
  )

  // ─── Botón PDF ────────────────────────────────────────────────────────
  const pdfButton = resultData ? (
    <div style={{ marginTop: '1rem' }}>
      <button
        className="btn btn-secondary"
        style={{ width: '100%' }}
        onClick={() => generarPDF(resultData, n, matrix, vector, 'Eliminación de Gauss-Jordan')}
      >Generar reporte en PDF</button>
    </div>
  ) : null

  return (
    <div>
      {styleOverride}
      <MatrixLayout
        title="Eliminación de Gauss-Jordan"
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
        codeRaw={code}
        hidePdf={true}
        extra={
          resultData && !resultData.isError && resultData.pasos ? (
            <PasosRender pasos={resultData.pasos} />
          ) : null
        }
      />
    </div>
  )
}
