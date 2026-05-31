/**
 * Página: Regla de Simpson 3/8
 *
 * Usa IntegralChart para mostrar las cúbicas interpoladas (naranja),
 * la curva f(x) real (azul) y los nodos x_i (verde).
 * Valida que n sea múltiplo de 3 con advertencia visual en tiempo real.
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

function multiplo3Cercano(v) {
  const r = Math.max(3, Math.round(v / 3) * 3)
  return r === 0 ? 3 : r
}

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
            titulo="Cúbicas (S 3/8)"
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

export default function Simpson38() {
  const { settings } = useSettings()

  const [f, setF]   = useState('')
  const [a, setA]   = useState(0)
  const [b, setB]   = useState(1)
  const [n, setN]   = useState(9)

  const [resultado, setResultado] = useState(null)
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)

  const nEsMultiplo3 = Number(n) > 0 && Number(n) % 3 === 0

  async function calcular() {
    if (!f.trim())    { setError('Ingresa una función f(x).'); return }
    if (!nEsMultiplo3) {
      setError(`Simpson 3/8 requiere n múltiplo de 3. Prueba con n=${multiplo3Cercano(Number(n))}.`)
      return
    }
    if (a >= b) { setError('El límite inferior a debe ser menor que b.'); return }
    setLoading(true); setError(null)
    try {
      const data = await apiPost('integracion/simpson38', {
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
    <Expander title="¿Cómo funciona la Regla de Simpson 3/8?">
      <p>
        <strong>Concepto:</strong> Aproxima la función mediante <em>polinomios de grado 3</em> (cúbicas)
        sobre grupos de tres subintervalos. Precisión de orden 4.
      </p>
      <br />
      <p><strong>Espaciado:</strong></p>
      <Latex tex={String.raw`h = \dfrac{b - a}{n}`} display />
      <br />
      <p><strong>Fórmula compuesta:</strong></p>
      <Latex
        tex={String.raw`\int_a^b f(x)\,dx \approx \frac{3h}{8}\left[f(x_0) + 3\sum_{i \neq 3k}f(x_i) + 2\sum_{i = 3k}f(x_i) + f(x_n)\right]`}
        display
      />
      <br />
      <div className="alert alert-info">
        <strong>Restricción:</strong> <em>n</em> debe ser <strong>múltiplo de 3</strong> (3, 6, 9, 12…).
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
          <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--slate)' }}>(múltiplo de 3)</span>
        </label>
        <input
          className="form-number" type="number" min={3} step={3} value={n}
          onChange={e => setN(parseInt(e.target.value))}
          style={{ borderColor: !nEsMultiplo3 && Number(n) > 0 ? 'var(--error, #ef4444)' : undefined }}
        />
        {!nEsMultiplo3 && Number(n) > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--error, #ef4444)', marginTop: 4 }}>
            ⚠ n={n} no es múltiplo de 3. Prueba con n={multiplo3Cercano(Number(n))}.
          </p>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </>
  )

  const codeRaw = `def simpson_38(f, a, b, n):
    if n % 3 != 0:
        raise ValueError("n debe ser múltiplo de 3")
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    fxs = [f(x) for x in xs]
    total = fxs[0] + fxs[-1]
    for i in range(1, n):
        total += 2 * fxs[i] if i % 3 == 0 else 3 * fxs[i]
    return (3 * h / 8) * total

resultado = simpson_38(lambda x: x**3, a=${a}, b=${b}, n=${nEsMultiplo3 ? n : multiplo3Cercano(Number(n))})
print(f"Integral ≈ {resultado:.8f}")`

  return (
    <MethodLayout
      title="Regla de Simpson 3/8"
      badge="INTEGRACIÓN NUMÉRICA"
      teoria={teoria}
      inputs={inputs}
      onCalcular={loading ? null : calcular}
      result={resultado ? <IntegralResultPanel resultado={resultado} /> : <EmptyPanel />}
      codeRaw={codeRaw}
    />
  )
}
