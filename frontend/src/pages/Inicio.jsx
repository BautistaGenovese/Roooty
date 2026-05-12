import { Link, useNavigate } from 'react-router-dom'

export default function Inicio() {
  const navigate = useNavigate()

  function tryExample(path, params) {
    const qs = new URLSearchParams(params).toString()
    navigate(`${path}?${qs}`)
  }

  return (
    <div className="page-inicio-wrap">
      {/* HERO */}
      <div className="hero-banner">
        <div className="hero-text">
          <span className="hero-badge">VERSIÓN BETA 🚀</span>
          <h1 className="hero-title">
            <span className="logo-sigma">Σ</span>
            ROOOTY
          </h1>
          <p className="hero-subtitle">
            Tu plataforma corporativa de Análisis Numérico diseñada para la precisión y el aprendizaje paso a paso.
          </p>
        </div>

        <div className="hero-anim">
          {/* f(x) = x³ - x - 2 | root ≈ 1.5214
              x range: -1.5 → 2.1  mapped to SVGx: 30 → 275
              y range: -4   → 6    mapped to SVGy: 165 → 10
              SVGx = 30 + (mx+1.5)/3.6 * 245
              SVGy = 165 - (my+4)/10  * 155  */}
          <svg viewBox="0 0 300 180" className="curve-svg">
            {/* Subtle grid */}
            {[55, 103, 150].map(y => <line key={`hy${y}`} x1="28" y1={y} x2="278" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
            {[100, 167, 234].map(x => <line key={`vx${x}`} x1={x} y1="10" x2={x} y2="168" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}

            {/* X-axis  (y=0 → SVGy=103) */}
            <line x1="22" y1="103" x2="278" y2="103" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            {/* Y-axis  (x=0 → SVGx=132) */}
            <line x1="132" y1="8" x2="132" y2="170" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

            {/* Axis arrowheads */}
            <polygon points="278,100 285,103 278,106" fill="rgba(255,255,255,0.35)" />
            <polygon points="129,8 132,1 135,8" fill="rgba(255,255,255,0.35)" />

            {/* Axis labels */}
            <text x="273" y="115" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="var(--font-mono)">x</text>
            <text x="136" y="13" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="var(--font-mono)">y</text>

            {/* Tick marks on X-axis */}
            {[[-1, 64], [1, 200], [1.52, 234]].map(([v, sx]) => (
              <g key={v}>
                <line x1={sx} y1="100" x2={sx} y2="106" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <text x={sx - 4} y="115" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="var(--font-mono)">{v}</text>
              </g>
            ))}

            {/* f(x) = x³ - x - 2  — pre-computed polyline points */}
            <polyline
              fill="none"
              stroke="var(--blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="
                30,163
                44,148  57,138  71,131  84,128
                98,128  111,130 125,133 138,136
                152,138 165,140 179,140 192,137
                206,130 219,120 233,105
                241,93  246,84
                260,57  273,23
              "
            />

            {/* Root dot at x≈1.52, y=0 → SVG(234, 103) */}
            <circle cx="234" cy="103" r="5" fill="var(--success)">
              <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Root label */}
            <text x="250" y="95" fill="var(--success)" fontSize="9" fontFamily="var(--font-main)" fontWeight="700">x* ≈ 1.52</text>

            {/* f(x) label beside the curve */}
            <text x="235" y="30" fill="white" fontSize="10" fontFamily="var(--font-mono)" opacity="0.9">f(x)</text>
          </svg>
        </div>
      </div>

      {/* WHY ROOOTY */}
      <h2 style={{ textAlign: 'center', color: 'var(--navy)', fontWeight: 800, marginBottom: 8 }}>
        ¿Por qué elegir Roooty?
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--slate)', marginBottom: '1.5rem' }}>
        Elevamos el estándar del análisis numérico académico frente a las herramientas tradicionales.
      </p>

      <div className="feature-grid">
        <div className="feature-card blue">
          <h4>📑 Paso a paso gratis</h4>
          Ellos te cobran la suscripción PRO para ver el 'paso a paso'. Roooty te da la tabla de iteraciones completa y el error de forma <strong>totalmente gratis</strong>.
        </div>
        <div className="feature-card green">
          <h4>🎯 Aritmética finita</h4>
          No permitimos errores mágicos. Simula aritmética finita (truncamiento) y maneja el número de cifras significativas (K) a tu gusto.
        </div>
        <div className="feature-card yellow">
          <h4>📄 Reportes Académicos</h4>
          Olvidate de arrastrar celdas en Excel. Ingresa la función, toca un botón y tenés tu PDF profesional listo para entregar en el TP.
        </div>
      </div>

      <br />
      <hr className="divider" />
      <br />

      {/* COMPARISON TABLE */}
      <h3 style={{ color: 'var(--navy)', marginBottom: '1rem' }}>Tabla Comparativa</h3>
      <div className="comp-table" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>CARACTERÍSTICA</th>
              <th>WOLFRAMALPHA</th>
              <th>EXCEL / GEOGEBRA</th>
              <th style={{ color: 'var(--navy)' }}>ROOOTY</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Pasos de iteración', 'Pago (Pro)', 'Limitado / Manual', 'Gratis & Ilimitado'],
              ['Aritmética Finita', 'Automático', 'Estándar Rígido', 'Configurable (K bits)'],
              ['Exportación Directa', 'Solo imagen', 'Manual / Formatos fijos', 'PDF Dinámico'],
            ].map(([feat, wa, ex, rt]) => (
              <tr key={feat}>
                <td style={{ color: 'var(--navy-dark)', fontWeight: 600 }}>{feat}</td>
                <td style={{ color: 'var(--error)' }}>{wa}</td>
                <td style={{ color: 'var(--slate)' }}>{ex}</td>
                <td className="highlight">{rt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br /><br />

      {/* GUÍA DE MÉTODOS */}
      <h2 style={{ textAlign: 'center', color: 'var(--navy)', fontWeight: 800, marginBottom: 8 }}>
        🎛️ ¿Qué método usar?
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--slate)', marginBottom: '2rem' }}>
        No todos los métodos son iguales. Elegí el correcto según tu función y contexto.
      </p>

      {/* CLOSED METHODS */}
      <p className="sidebar-section-label" style={{ marginBottom: '1rem' }}>🔒 MÉTODOS CERRADOS — Requieren intervalo [a, b] con cambio de signo</p>
      <div className="methods-grid" style={{ marginBottom: '2rem' }}>
        <Link to="/biseccion" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card">
            <div className="method-guide-header">
              <strong>📉 Bisección</strong>
              <span className="badge">Garantiza convergencia</span>
            </div>
            <p className="method-guide-desc">Divide el intervalo a la mitad en cada paso. Lento pero <strong>siempre converge</strong> si hay un cambio de signo.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>La función es continua pero complicada de derivar</li>
                <li>Necesitás una respuesta garantizada sin importar la velocidad</li>
                <li>Estás analizando una función con comportamiento irregular</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              <code>f(x) = x³ - x - 2</code> en <code>[1, 2]</code>
              <button
                className="try-example-btn"
                onClick={e => { e.preventDefault(); tryExample('/biseccion', { f: 'x**3 - x - 2', a: 1, b: 2 }) }}
              >▶ Probar ejemplo</button>
            </div>
          </div>
        </Link>

        <Link to="/regula-falsi" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card">
            <div className="method-guide-header">
              <strong>📐 Regula Falsi</strong>
              <span className="badge">Más rápido que Bisección</span>
            </div>
            <p className="method-guide-desc">Usa una línea secante en vez de la mitad exacta. Converge más rápido que bisección, pero puede ser lento en algunos casos.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>Querés más velocidad que bisección con la misma garantía de convergencia</li>
                <li>La función es casi lineal en el intervalo</li>
                <li>Tenés un intervalo claro con cambio de signo</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              <code>f(x) = e^x - 3x</code> en <code>[1, 2]</code>
              <button
                className="try-example-btn"
                onClick={e => { e.preventDefault(); tryExample('/regula-falsi', { f: 'exp(x) - 3*x', a: 1, b: 2 }) }}
              >▶ Probar ejemplo</button>
            </div>
          </div>
        </Link>
      </div>

      {/* OPEN METHODS */}
      <p className="sidebar-section-label" style={{ marginBottom: '1rem' }}>⚡ MÉTODOS ABIERTOS — Solo necesitan un punto inicial, convergen más rápido</p>
      <div className="methods-grid" style={{ marginBottom: '2rem' }}>
        <Link to="/newton" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card method-guide-card--highlight">
            <div className="method-guide-header">
              <strong>🎢 Newton-Raphson</strong>
              <span className="badge badge-purple">Convergencia cuadrática</span>
            </div>
            <p className="method-guide-desc">Usa la derivada para aproximarse a la raíz en muy pocas iteraciones. El más <strong>rápido de todos</strong>, cuando converge.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>Podés calcular la derivada analítica de f(x)</li>
                <li>Tenés una buena aproximación inicial cercana a la raíz</li>
                <li>Necesitás máxima precisión con pocas iteraciones (ej. sistemas en tiempo real)</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              <code>f(x) = cos(x) - x</code> desde <code>x₀ = 1</code>
              <button
                className="try-example-btn"
                onClick={e => { e.preventDefault(); tryExample('/newton', { f: 'cos(x) - x', x0: 1 }) }}
              >▶ Probar ejemplo</button>
            </div>
          </div>
        </Link>

        <Link to="/secante" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card">
            <div className="method-guide-header">
              <strong>🎯 Secante</strong>
              <span className="badge">Sin derivada analítica</span>
            </div>
            <p className="method-guide-desc">Variante de Newton que usa dos puntos para aproximar la derivada. Casi tan rápido, pero sin necesitar derivar.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>La derivada es difícil de calcular a mano</li>
                <li>La función viene de datos experimentales (sin fórmula exacta)</li>
                <li>Querés velocidad de Newton sin el costo de derivar</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              <code>f(x) = x·sin(x) - 1</code> desde <code>x₀=1, x₁=2</code>
              <button
                className="try-example-btn"
                onClick={e => { e.preventDefault(); tryExample('/secante', { f: 'x*sin(x) - 1', xn: 1, xn1: 2 }) }}
              >▶ Probar ejemplo</button>
            </div>
          </div>
        </Link>

        <Link to="/punto-fijo" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card">
            <div className="method-guide-header">
              <strong>📍 Punto Fijo</strong>
              <span className="badge">Convergencia condicional</span>
            </div>
            <p className="method-guide-desc">Reformula f(x)=0 como x=g(x) e itera. Converge solo si |g'(x)| &lt; 1 cerca de la raíz.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>La función puede reescribirse fácilmente como x=g(x)</li>
                <li>Estás analizando la estabilidad de un sistema iterativo</li>
                <li>Se usa como base para entender otros métodos</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              <code>x = (x² + 2) / 3</code> → raíz de <code>x²-3x+2=0</code>
              <button
                className="try-example-btn"
                onClick={e => { e.preventDefault(); tryExample('/punto-fijo', { g: '(x**2 + 2) / 3', x0: 0 }) }}
              >▶ Probar ejemplo</button>
            </div>
          </div>
        </Link>
      </div>

      {/* TOOLS */}
      <p className="sidebar-section-label" style={{ marginBottom: '1rem' }}>🔧 HERRAMIENTAS</p>
      <div className="methods-grid" style={{ marginBottom: '2rem' }}>
        <Link to="/regresion" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card">
            <div className="method-guide-header">
              <strong>📊 Regresión Lineal</strong>
              <span className="badge">Modelado de datos</span>
            </div>
            <p className="method-guide-desc">Ajusta una línea a un conjunto de datos usando mínimos cuadrados. Calcula pendiente, ordenada y R².</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>Tenés datos experimentales y querés encontrar una tendencia</li>
                <li>Necesitás predecir valores intermedios o futuros</li>
                <li>Querés medir la correlación entre dos variables</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              Datos de temperatura vs. resistencia: <code>(10,20), (20,30), (30,45)...</code>
            </div>
          </div>
        </Link>

        <Link to="/comparacion" style={{ textDecoration: 'none' }}>
          <div className="method-guide-card" style={{ borderStyle: 'dashed', borderColor: 'var(--blue)' }}>
            <div className="method-guide-header">
              <strong style={{ color: 'var(--blue)' }}>⚔️ Comparación de Métodos</strong>
              <span className="badge">Multi-método</span>
            </div>
            <p className="method-guide-desc">Ejecuta múltiples métodos sobre la misma función y compará iteraciones, error y velocidad de convergencia en paralelo.</p>
            <div className="method-guide-when">
              <span className="method-when-label">✅ Ideal cuando:</span>
              <ul>
                <li>No sabés qué método es el más eficiente para tu función</li>
                <li>Necesitás justificar la elección del método en un informe</li>
                <li>Querés visualizar la velocidad de convergencia de cada uno</li>
              </ul>
            </div>
            <div className="method-guide-example">
              <span className="method-ex-label">📌 Ejemplo típico:</span>
              Comparar Bisección vs. Newton en <code>f(x) = x³ - 2x - 5</code>
            </div>
          </div>
        </Link>
      </div>

      <br />
      <hr className="divider" />
      <br />

      {/* EQUIPO */}
      <h3 style={{ textAlign: 'center', color: 'var(--navy)', marginBottom: 8 }}>
        👥 El Escuadrón detrás del Código
      </h3>
      <p style={{ textAlign: 'center', color: 'var(--slate)', marginBottom: '1.5rem', maxWidth: '700px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
        El desarrollo de esta plataforma ha sido impulsado por un equipo comprometido con la excelencia académica y la precisión algorítmica:
      </p>

      <div className="escuadron">
        {[
          { initials: 'BG', name: 'Bautista', bg: 'var(--bg)', color: 'var(--font-main)', isLead: true },
          { initials: 'IG', name: 'Ignacio', bg: '#e0f2fe', color: '#0284c7' },
          { initials: 'JG', name: 'Juan', bg: '#f3e8ff', color: '#9333ea' },
          { initials: 'TK', name: 'Trini', bg: '#ffedd5', color: '#ea580c' },
          { initials: 'BR', name: 'Brisa', bg: '#dcfce7', color: '#16a34a' },
          { initials: 'MV', name: 'Micaías', bg: '#f1f5f9', color: '#475569' },
          { initials: 'MM', name: 'Manuel', bg: '#fef9c3', color: '#ca8a04' },
        ].map(({ initials, name, bg, color, isLead }) => (
          <div key={name} className="integrante">
            <div className={`avatar ${isLead ? 'lead-dev' : ''}`} style={{ background: bg, color }}>{initials}</div>
            <span className="integrante-name">{name}</span>
          </div>
        ))}
      </div>

      <br /><br />

      <div className="alert alert-error">
        💡 <strong>TIP DE SUPERVIVENCIA</strong><br />
        Recuerda que los métodos abiertos no garantizan la convergencia. Si la app te dice que el método divergió, no te asustes: intenta cambiar tu valor inicial o revisa la Configuración Global.
      </div>
    </div>
  )
}
