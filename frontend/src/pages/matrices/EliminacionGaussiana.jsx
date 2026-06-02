import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import MatrixLayout from '../../components/MatrixLayout'
import { Expander } from '../../components/MethodLayout'
import { useHistory } from '../../hooks/useHistory'
import Latex from '../../components/Latex'
import axios from 'axios'

import {
  MIN_N, MAX_N, makeMatrix, makeVector,
  SizeControl, MatrixGrid, PasosRender,
  GaussResultsPanel, generarPDF,
} from '../../components/GaussShared'
import { useSettings } from '../../hooks/useSettings'

// ─── PÁGINA: ELIMINACIÓN GAUSSIANA ──────────────────────────────────────────
export default function EliminacionGaussiana() {
  const { push: pushHistory } = useHistory()
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [n, setN] = useState(3)
  const [matrix, setMatrix] = useState(makeMatrix(3))
  const [vector, setVector] = useState(makeVector(3))
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Cargar desde URL (historial "Volver a ejecutar") ────────────────────
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
          // Convertir a strings para el MatrixGrid
          setMatrix(parsedMatrix.map(row => row.map(String)))
          setVector(parsedVector.map(String))
        }
      } catch (e) { /* ignorar parámetros inválidos */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cambiar N ──────────────────────────────────────────────────────────
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

  // ── Ejemplos con soluciones enteras verificadas ───────────────────────
  function handleFillExample() {
    if (n === 2) {
      setMatrix([['2', '1'], ['1', '3']])
      setVector(['5', '10'])
    } else if (n === 3) {
      setMatrix([['2', '1', '-1'], ['-3', '-1', '2'], ['-2', '1', '2']])
      setVector(['8', '-11', '-3'])
    } else if (n === 4) {
      setMatrix([['3', '1', '0', '1'], ['1', '4', '1', '0'], ['0', '1', '5', '2'], ['2', '0', '2', '6']])
      setVector(['9', '12', '25', '32'])
    } else if (n === 5) {
      setMatrix([
        ['10', '1', '0', '0', '1'],
        ['1', '10', '1', '0', '0'],
        ['0', '1', '10', '1', '0'],
        ['0', '0', '1', '10', '1'],
        ['1', '0', '0', '1', '10'],
      ])
      setVector(['18', '23', '35', '47', '46'])
    } else {
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

  // ── Resolver ──────────────────────────────────────────────────────────
  async function calcular() {
    if (loading) return
    setResultData(null)
    const parsedMatrix = matrix.map(row => row.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v }))
    const parsedVector = vector.map(cell => { const v = parseFloat(cell); return isNaN(v) ? 0 : v })

    setLoading(true)
    try {
      const res = await axios.post('/api/matrices/gaussiana', { matrix: parsedMatrix, vector: parsedVector, cero_maquina: settings.ceroMaquina })
      setResultData({ ...res.data, isError: false })
      pushHistory({
        method: 'Eliminación Gaussiana',
        displayParams: { 'Tamaño': `${n}×${n}` },
        queryParams: {
          n: String(n),
          matrix: JSON.stringify(parsedMatrix),
          vector: JSON.stringify(parsedVector),
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

  // ─── Teoría ───────────────────────────────────────────────────────────
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

  const codeRaw = `def gaussian_elimination(matrix, vector, cero_maquina=1e-12):
    n = len(matrix)
    aug = [[float(val) for val in row] + [float(vector[i])] for i, row in enumerate(matrix)]
    
    # Fase 1: Triangularización con Pivoteo Parcial
    for k in range(n):
        pivot_row = k
        for i in range(k + 1, n):
            if abs(aug[i][k]) > abs(aug[pivot_row][k]):
                pivot_row = i
        aug[k], aug[pivot_row] = aug[pivot_row], aug[k]
        
        if abs(aug[k][k]) < cero_maquina:
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
        
    return x

# Configuración actual de los ajustes
cero_maquina = ${settings.ceroMaquina}

# Sistema a resolver
A = ${formatMatrixArray(matrix)}
b = ${formatVectorArray(vector)}

solucion = gaussian_elimination(A, b, cero_maquina=cero_maquina)
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
        onClick={() => generarPDF(resultData, n, matrix, vector, 'Eliminación Gaussiana con Pivoteo Parcial')}
      >Generar reporte en PDF</button>
    </div>
  ) : null

  return (
    <div>
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
            <PasosRender pasos={resultData.pasos} n={resultData.solucion?.length} />
          ) : null
        }
      />
    </div>
  )
}
