/**
 * Página: Regla de Simpson 1/3
 *
 * Arreglos aplicados:
 *  1. TABLA: delegada a MethodLayout (iteraciones/columns) → IterTable compartido.
 *  2. METRICS-BAR: gap + paddingLeft para separar del divider.
 *  3. HISTORIAL: pushHistory al contexto global tras cálculo exitoso.
 *  4. PDF: PdfButton integrado en inputs.
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
  PdfButton,
} from '../../components/MethodLayout'
import IntegralChart from './IntegralChart'

const COLS = [
  { key: 'x',  label: 'xᵢ'    },
  { key: 'fx', label: 'f(xᵢ)' },
]

// ── Panel de resultados (sin tabla inline) ───────────────────────────────────
function IntegralResultPanel({ resultado }) {
  const { integral, puntos, metodo, curva_f, aproximacion } = resultado
  return (
    <div>
      <div className="formula-display" style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--slate)', fontWeight: 700, letterSpacing: 1.2, display: 'block', opacity: 0.8 }}>
          RESULTADO DE LA INTEGRAL
        </span>
        <div style={{ color: 'var(--navy)', marginTop: '4px' }}>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>{metodo}</code>
        </div>
      </div>

      {/* FIX #2: gap + paddingLeft evita superposición con divider */}
      <div className="metrics-bar" style={{ gap: '16px' }}>
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-label">∫ f(x) dx ≈</div>
          <div className="metric-value" style={{ fontSize: '1.6rem' }}>{Number(integral).toFixed(8)}</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item" style={{ paddingLeft: '16px' }}>
          <div className="metric-label">Nodos evaluados</div>
          <div className="metric-value">{puntos.length}</div>
        </div>
      </div>

      {curva_f && aproximacion && (
        <div id="chart-pdf-container" style={{ marginTop: '1.2rem', padding: '8px 0' }}>
          <IntegralChart
            curvaF={curva_f}
            aproximacion={aproximacion}
            nodos={puntos}
            titulo="Parábolas (S 1/3)"
          />
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Simpson13() {
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

  const nEsPar = Number(n) % 2 === 0

  async function calcular() {
    if (!f.trim())      { setError('Ingresa una función f(x).'); return }
    if (!nEsPar)        { setError(`Simpson 1/3 requiere n PAR. Prueba con n=${Number(n) + 1}.`); return }
    if (Number(n) <= 0) { setError('n debe ser mayor que 0.'); return }
    if (a >= b)         { setError('El límite inferior a debe ser menor que b.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('integracion/simpson13', {
        f, a: Number(a), b: Number(b), n: Number(n), trig_mode: settings.trigMode,
      })
      setResultado(data)

      // FIX #3: Despachar al historial global
      pushHistory({
        method: 'Simpson 1/3',
        displayParams: { 'f(x)': f, a, b, n },
        queryParams: { f, a, b, n },
        raiz: data.integral,
      })
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Error al calcular. Verifica la función.')
      setResultado(null)
    } finally { setLoading(false) }
  }

  const teoria = (
    <Expander title="¿Cómo funciona la Regla de Simpson 1/3?">
      <p>
        <strong>Concepto:</strong> Aproxima la función mediante <em>parábolas</em> sobre pares de subintervalos.
        Mayor precisión que el Trapecio para el mismo número de evaluaciones.
      </p>
      <br />
      <p><strong>Espaciado:</strong></p>
      <Latex tex={String.raw`h = \dfrac{b - a}{n}`} display />
      <br />
      <p><strong>Fórmula compuesta:</strong></p>
      <Latex
        tex={String.raw`\int_a^b f(x)\,dx \approx \frac{h}{3}\left[f(x_0) + 4\sum_{\text{impar}}f(x_i) + 2\sum_{\text{par}}f(x_i) + f(x_n)\right]`}
        display
      />
      <br />
      <div className="alert alert-info">
        <strong>Restricción:</strong> <em>n</em> debe ser <strong>PAR</strong>.
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
          <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--slate)' }}>(debe ser PAR)</span>
        </label>
        <input
          className="form-number" type="number" min={2} step={2} value={n}
          onChange={handleNChange}
          max={Number(n) > MAX_OPTIMO ? MAX_ABSOLUTO : undefined}
          style={{ borderColor: !nEsPar && Number(n) > 0 ? 'var(--error, #ef4444)' : undefined }}
        />
        {!nEsPar && Number(n) > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--error, #ef4444)', marginTop: 4 }}>
            ⚠ n={n} es impar. Prueba con n={Number(n) + 1}.
          </p>
        )}
        {Number(n) > MAX_OPTIMO && (
          <p style={{ fontSize: '0.78rem', color: '#d97706', marginTop: 4, fontWeight: 600 }}>
            ⚠️ Alerta de rendimiento: Un número de intervalos mayor a {MAX_OPTIMO} puede ralentizar la app. Se ha activado el modo de tolerancia máxima (+10 intervalos).
          </p>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* FIX #4: PdfButton */}
      {resultado && (
        <PdfButton
          title="Simpson 1/3"
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

def simpson_13(f_func, a, b, n):
    if n % 2 != 0:
        raise ValueError("n debe ser par")
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    fxs = [f_func(x) for x in xs]
    suma_imp = sum(fxs[i] for i in range(1, n, 2))   # coef. 4
    suma_par = sum(fxs[i] for i in range(2, n, 2))   # coef. 2
    return (h / 3) * (fxs[0] + 4*suma_imp + 2*suma_par + fxs[-1])

def f(x):
    # Función a evaluar: ${f || 'f(x)'}
    return x**2

resultado = simpson_13(f, a=${a}, b=${b}, n=${nEsPar ? n : Number(n) + 1})
print(f"Integral ≈ {resultado:.8f}")`

  return (
    <MethodLayout
      title="Regla de Simpson 1/3"
      badge="INTEGRACIÓN NUMÉRICA"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultado ? <IntegralResultPanel resultado={resultado} /> : <EmptyPanel />}
      codeRaw={codeRaw}
      /* FIX #1: Tabla delegada al MethodLayout con IterTable compartido */
      iteraciones={resultado?.puntos}
      columns={COLS}
    />
  )
}
