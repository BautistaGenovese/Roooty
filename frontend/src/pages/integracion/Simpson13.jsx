/**
 * Página: Regla de Simpson 1/3
 *
 * Usa IntegralChart para mostrar las parábolas interpoladas (naranja),
 * la curva f(x) real (azul) y los nodos x_i (verde).
 * Valida que n sea PAR con advertencia visual en tiempo real.
 */

import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { apiPost } from '../../utils/api'
import Latex from '../../components/Latex'
import MethodLayout, {
  Expander,
  FormulaInput,
  EmptyPanel,
} from '../../components/MethodLayout'
import IntegralChart from './IntegralChart'

const COLS = [
  { key: 'x',  label: 'xᵢ'    },
  { key: 'fx', label: 'f(xᵢ)' },
]

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

      <div className="metrics-bar">
        <div className="metric-item" style={{ flex: 1 }}>
          <div className="metric-label">∫ f(x) dx ≈</div>
          <div className="metric-value" style={{ fontSize: '1.6rem' }}>{Number(integral).toFixed(8)}</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-label">Nodos evaluados</div>
          <div className="metric-value">{puntos.length}</div>
        </div>
      </div>

      {curva_f && aproximacion && (
        <div style={{ marginTop: '1.2rem', padding: '8px 0' }}>
          <IntegralChart
            curvaF={curva_f}
            aproximacion={aproximacion}
            nodos={puntos}
            titulo="Parábolas (S 1/3)"
          />
        </div>
      )}

      {puntos.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Expander className="expander--table" title="Ver tabla de nodos evaluados" badge={`${puntos.length} PUNTOS`}>
            <div className="table-wrap" style={{ fontSize: '0.78rem' }}>
              <table>
                <thead>
                  <tr><th>i</th>{COLS.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {puntos.map((row, i) => (
                    <tr key={i}>
                      <td>{i}</td>
                      {COLS.map(c => (
                        <td key={c.key}>{row[c.key] != null ? Number(row[c.key]).toFixed(8) : '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Expander>
        </div>
      )}
    </div>
  )
}

export default function Simpson13() {
  const { settings } = useSettings()

  const [f, setF]   = useState('')
  const [a, setA]   = useState(0)
  const [b, setB]   = useState(1)
  const [n, setN]   = useState(10)

  const [resultado, setResultado] = useState(null)
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)

  const nEsPar = Number(n) % 2 === 0

  async function calcular() {
    if (!f.trim())  { setError('Ingresa una función f(x).'); return }
    if (!nEsPar)    { setError(`Simpson 1/3 requiere n PAR. Prueba con n=${Number(n) + 1}.`); return }
    if (Number(n) <= 0) { setError('n debe ser mayor que 0.'); return }
    if (a >= b)     { setError('El límite inferior a debe ser menor que b.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('integracion/simpson13', {
        f, a: Number(a), b: Number(b), n: Number(n), trig_mode: settings.trigMode,
      })
      setResultado(data)
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
        Proporciona mayor precisión que el Trapecio para el mismo número de evaluaciones.
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
          onChange={e => setN(parseInt(e.target.value))}
          style={{ borderColor: !nEsPar ? 'var(--error, #ef4444)' : undefined }}
        />
        {!nEsPar && Number(n) > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--error, #ef4444)', marginTop: 4 }}>
            ⚠ n={n} es impar. Prueba con n={Number(n) + 1}.
          </p>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </>
  )

  const codeRaw = `def simpson_13(f, a, b, n):
    if n % 2 != 0:
        raise ValueError("n debe ser par")
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    fxs = [f(x) for x in xs]
    suma_imp = sum(fxs[i] for i in range(1, n, 2))   # coef. 4
    suma_par = sum(fxs[i] for i in range(2, n, 2))   # coef. 2
    return (h / 3) * (fxs[0] + 4*suma_imp + 2*suma_par + fxs[-1])

resultado = simpson_13(lambda x: x**2, a=${a}, b=${b}, n=${nEsPar ? n : Number(n) + 1})
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
    />
  )
}
