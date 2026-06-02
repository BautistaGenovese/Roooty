/**
 * Página: Regla del Trapecio
 *
 * Arreglos aplicados respecto a la versión anterior:
 *  1. TABLA: se mueve al MethodLayout (props iteraciones/columns) usando IterTable
 *     compartido — renderizado fuera de las cards, idéntico a Bisección/Newton.
 *  2. METRICS-BAR: padding-left en el segundo metric-item para evitar
 *     superposición con el divider vertical.
 *  3. HISTORIAL: pushHistory() al contexto global tras cálculo exitoso.
 *  4. PDF: PdfButton integrado en el panel de inputs tras el resultado.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import { useHistory } from '../../hooks/useHistory'
import { apiPost } from '../../utils/api'
import Latex from '../../components/Latex'
import MethodLayout, {
  Expander,
  FormulaInput,
  EmptyPanel,
  IterTable,
  PdfButton,
} from '../../components/MethodLayout'
import IntegralChart from './IntegralChart'

// ── Columnas de la tabla — misma estructura que COLS en Biseccion.jsx ────────
const COLS = [
  { key: 'x',  label: 'xᵢ'    },
  { key: 'fx', label: 'f(xᵢ)' },
]

// ── Panel de resultados (solo gráfico + métricas, sin tabla inline) ──────────
function IntegralResultPanel({ resultado }) {
  const { integral, puntos, metodo, curva_f, aproximacion } = resultado

  return (
    <div>
      {/* Encabezado */}
      <div className="formula-display" style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{
          fontSize: '0.7rem', color: 'var(--slate)', fontWeight: 700,
          letterSpacing: 1.2, display: 'block', opacity: 0.8,
        }}>
          RESULTADO DE LA INTEGRAL
        </span>
        <div style={{ color: 'var(--navy)', marginTop: '4px' }}>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>
            {metodo}
          </code>
        </div>
      </div>

      {/* Métricas — FIX #2: gap + paddingLeft para evitar superposición con divider */}
      <div className="metrics-bar" style={{ gap: '16px' }}>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-label">∫ f(x) dx ≈</div>
          <div className="metric-value" style={{ fontSize: '1.6rem' }}>
            {Number(integral).toFixed(8)}
          </div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item" style={{ paddingLeft: '16px' }}>
          <div className="metric-label">Nodos evaluados</div>
          <div className="metric-value">{puntos.length}</div>
        </div>
      </div>

      {/* Gráfico */}
      {curva_f && aproximacion && (
        <div id="chart-pdf-container" style={{ marginTop: '1.2rem', padding: '8px 0' }}>
          <IntegralChart
            curvaF={curva_f}
            aproximacion={aproximacion}
            nodos={puntos}
            titulo="Trapecios"
          />
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Trapecio() {
  const { settings } = useSettings()
  const { push: pushHistory } = useHistory()
  const [searchParams] = useSearchParams()

  const [f, setF]   = useState('')
  const [a, setA]   = useState(0)
  const [b, setB]   = useState(1)
  const [n, setN]   = useState(10)

  const [resultado, setResultado] = useState(null)
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)

  const MAX_OPTIMO = 500
  const MAX_ABSOLUTO = MAX_OPTIMO + 10

  const handleNChange = (e) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) {
      setN('')
      return
    }
    if (val > MAX_ABSOLUTO) {
      setN(MAX_ABSOLUTO)
    } else {
      setN(val)
    }
  }

  // Leer parámetros de la URL ("Volver a ejecutar" desde Historial)
  useEffect(() => {
    const pf = searchParams.get('f')
    const pa = searchParams.get('a')
    const pb = searchParams.get('b')
    const pn = searchParams.get('n')
    if (pf) setF(pf)
    if (pa !== null) setA(parseFloat(pa))
    if (pb !== null) setB(parseFloat(pb))
    if (pn !== null) setN(parseInt(pn))
  }, [])

  async function calcular() {
    if (!f.trim()) { setError('Ingresa una función f(x).'); return }
    if (n <= 0)    { setError('El número de intervalos n debe ser mayor que 0.'); return }
    if (a >= b)    { setError('El límite inferior a debe ser menor que b.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('integracion/trapecio', {
        f, a: Number(a), b: Number(b), n: Number(n), trig_mode: settings.trigMode,
      })
      setResultado(data)

      // FIX #3: Despachar al historial global
      pushHistory({
        method: 'Trapecio',
        displayParams: { 'f(x)': f, a, b, n },
        queryParams: { f, a, b, n },
        raiz: data.integral,   // usamos "raiz" como campo genérico del resultado principal
      })
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Error al calcular. Verifica la función.')
      setResultado(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona la Regla del Trapecio?">
      <p>
        <strong>Concepto:</strong> Aproxima el área bajo la curva dividiendo [a, b]
        en <em>n</em> subintervalos iguales y reemplazando cada arco por un trapecio.
      </p>
      <br />
      <p><strong>Espaciado:</strong></p>
      <Latex tex={String.raw`h = \dfrac{b - a}{n}`} display />
      <br />
      <p><strong>Fórmula compuesta:</strong></p>
      <Latex
        tex={String.raw`\int_a^b f(x)\,dx \approx \frac{h}{2}\left[f(x_0) + 2\sum_{i=1}^{n-1}f(x_i) + f(x_n)\right]`}
        display
      />
      <br />
      <div className="alert alert-info">
        <strong>Nota:</strong> No tiene restricción sobre <em>n</em>. Mayor <em>n</em> → mayor precisión.
      </div>
    </Expander>
  )

  const inputs = (
    <>
      <FormulaInput value={f} onChange={setF} placeholder="Ejemplo: x**2 + sin(x)" />
      <div className="input-col-2">
        <div className="form-group">
          <label className="form-label">Límite inferior a</label>
          <input className="form-number" type="number" value={a} step={0.5}
            onChange={e => setA(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Límite superior b</label>
          <input className="form-number" type="number" value={b} step={0.5}
            onChange={e => setB(parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          Número de intervalos n
          <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--slate)' }}>
            (cualquier entero &gt; 0)
          </span>
        </label>
        <input 
          className="form-number" 
          type="number" 
          min={1} 
          max={Number(n) > MAX_OPTIMO ? MAX_ABSOLUTO : undefined}
          step={1} 
          value={n}
          onChange={handleNChange} 
        />
        {Number(n) > MAX_OPTIMO && (
          <p style={{ fontSize: '0.78rem', color: '#d97706', marginTop: 4, fontWeight: 600 }}>
            ⚠️ Alerta de rendimiento: Un número de intervalos mayor a {MAX_OPTIMO} puede ralentizar la app. Se ha activado el modo de tolerancia máxima (+10 intervalos).
          </p>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* FIX #4: Botón de PDF — idéntico al patrón de Bisección */}
      {resultado && (
        <PdfButton
          title="Trapecio"
          f={f}
          params={{ 'Límite a': a, 'Límite b': b, 'Intervalos n': n }}
          result={{ raiz: resultado.integral, iteraciones: resultado.puntos }}
          columns={COLS}
        />
      )}
    </>
  )

  const codeRaw = `import math

# Ajuste global
trig_mode = "${settings.trigMode}"
# Nota: La implementación en Python de trig_mode puede requerir
#       convertir a radianes/grados según corresponda.

def trapecio(f_func, a, b, n):
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    fxs = [f_func(x) for x in xs]

    # Coeficientes: 1, 2, 2, ..., 2, 1
    integral = (h / 2) * (fxs[0] + 2 * sum(fxs[1:-1]) + fxs[-1])
    return integral

def f(x):
    # Aquí deberías implementar tu función: ${f || 'f(x)'}
    # Por ejemplo, eval() o tu propio parseo
    return x**2 # Reemplazar con la función real

# Ejemplo con los parámetros actuales
resultado = trapecio(f, a=${a}, b=${b}, n=${n})
print(f"Integral ≈ {resultado:.8f}")`

  const resultPanel = resultado
    ? <IntegralResultPanel resultado={resultado} />
    : <EmptyPanel />

  return (
    <MethodLayout
      title="Regla del Trapecio"
      badge="INTEGRACIÓN NUMÉRICA"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultPanel}
      codeRaw={codeRaw}
      /* FIX #1: Tabla delegada al MethodLayout — se renderiza fuera de
         las cards con IterTable + Expander, idéntico a Bisección/Newton */
      iteraciones={resultado?.puntos}
      columns={COLS}
    />
  )
}
