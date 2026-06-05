/**
 * IntegralChart.jsx
 *
 * Gráfico SVG nativo para visualizar la integración numérica.
 * Mantiene exactamente el mismo sistema de diseño que Chart.jsx:
 * variables CSS de ROOOTY Lab, tooltips, zoom, dark mode, responsive.
 *
 * Trazas renderizadas (de abajo hacia arriba en z-order):
 *   1. Relleno sombreado — área aproximada (fill hacia y=0, naranja/rojo)
 *   2. Línea de aproximación — trapecios / parábolas / cúbicas (naranja)
 *   3. Línea f(x) real — curva suave y continua (azul, var(--blue))
 *   4. Nodos x_i — círculos en cada punto evaluado (verde, var(--success))
 *
 * Props:
 *   curvaF      : { x: number[], y: number[] }  — 500 pts de f(x)
 *   aproximacion: { x: number[], y: number[] }  — poligonal / polinomio
 *   nodos       : { x: number, fx: number }[]   — puntos de la tabla
 *   titulo      : string                         — etiqueta de leyenda
 */

import { useState, useMemo, useCallback, useEffect } from 'react'

// ── Paleta (idéntica a Chart.jsx) ────────────────────────────────────────────
const C = {
  blue   : 'var(--blue)',
  orange : '#f97316',           // Aproximación  → naranja cálido
  green  : 'var(--success)',    // Nodos
  muted  : 'var(--slate)',
  border : 'var(--border)',
  surface: 'var(--bg)',
  bg     : 'var(--white)',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtAxis = v => {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0))
    return v.toExponential(1)
  return parseFloat(v.toFixed(3)).toString()
}

function zipXY(xs, ys) {
  if (!xs || !ys) return []
  return xs
    .map((x, i) => ({ x, y: ys[i] }))
    .filter(d => d.y != null && isFinite(d.y))
}

/** Calcula rango con padding del 10 % */
function computeRange(allYs, allXs) {
  const xs = allXs.filter(isFinite)
  const ys = allYs.filter(isFinite)
  if (!xs.length || !ys.length) return null

  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)

  const xPad = (xMax - xMin) * 0.05 || 0.5
  const yPad = (yMax - yMin) * 0.12 || 0.5

  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: Math.min(yMin - yPad, -yPad),   // siempre incluir y=0
    yMax: yMax + yPad,
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function IntegralChart({ curvaF, aproximacion, nodos, titulo }) {
  const [containerEl, setContainerEl] = useState(null)
  const [W, setW]                     = useState(800)
  const [hovered, setHovered]         = useState(null)   // { x, y, label }
  const [hoveredNode, setHoveredNode] = useState(null)   // { x, y }
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 })

  // ── ResizeObserver ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerEl) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        if (e.contentRect.width > 0) setW(e.contentRect.width)
      }
    })
    ro.observe(containerEl)
    return () => ro.disconnect()
  }, [containerEl])

  // ── Puntos parseados ───────────────────────────────────────────────────────
  const ptsCurva = useMemo(() => zipXY(curvaF?.x,      curvaF?.y),      [curvaF])
  const ptsAprox = useMemo(() => zipXY(aproximacion?.x, aproximacion?.y), [aproximacion])
  const ptsNodos = useMemo(() =>
    (nodos ?? []).map(n => ({ x: n.x, y: n.fx })).filter(d => isFinite(d.y)),
    [nodos]
  )

  // ── Rango del viewport ─────────────────────────────────────────────────────
  const range = useMemo(() => {
    const allX = [...ptsCurva.map(p => p.x), ...ptsAprox.map(p => p.x)]
    const allY = [...ptsCurva.map(p => p.y), ...ptsAprox.map(p => p.y), 0]
    return computeRange(allY, allX)
  }, [ptsCurva, ptsAprox])

  // ── Dimensiones SVG ────────────────────────────────────────────────────────
  const H    = Math.max(260, W * (7 / 16))
  const pad  = { t: 20, r: 20, b: 36, l: W < 500 ? 42 : 68 }
  const innW = W - pad.l - pad.r
  const innH = H - pad.t - pad.b

  // ── Proyección ─────────────────────────────────────────────────────────────
  const { xMinZ, xMaxZ, yMinZ, yMaxZ, xRangeZ, yRangeZ } = useMemo(() => {
    if (!range) return { xMinZ: 0, xMaxZ: 1, yMinZ: -1, yMaxZ: 1, xRangeZ: 1, yRangeZ: 2 }
    const xR0 = (range.xMax - range.xMin)
    const yR0 = (range.yMax - range.yMin)
    return {
      xMinZ : range.xMin, xMaxZ: range.xMax,
      yMinZ : range.yMin, yMaxZ: range.yMax,
      xRangeZ: xR0, yRangeZ: yR0,
    }
  }, [range])

  const cx = useCallback(x => pad.l + ((x - xMinZ) / xRangeZ) * innW,
    [pad.l, xMinZ, xRangeZ, innW])
  const cy = useCallback(y => pad.t + innH - ((y - yMinZ) / yRangeZ) * innH,
    [pad.t, yMinZ, yRangeZ, innH])

  // ── Paths SVG ──────────────────────────────────────────────────────────────
  const pathCurva = useMemo(() =>
    ptsCurva.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(p.x).toFixed(1)},${cy(p.y).toFixed(1)}`).join(' '),
    [ptsCurva, cx, cy]
  )

  const pathAprox = useMemo(() =>
    ptsAprox.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(p.x).toFixed(1)},${cy(p.y).toFixed(1)}`).join(' '),
    [ptsAprox, cx, cy]
  )

  // Path de relleno: igual que aproximacion pero cerrando al eje y=0
  const pathFill = useMemo(() => {
    if (ptsAprox.length < 2) return ''
    const zeroY = cy(0).toFixed(1)
    const first  = `M${cx(ptsAprox[0].x).toFixed(1)},${zeroY}`
    const stroke = ptsAprox.map(p => `L${cx(p.x).toFixed(1)},${cy(p.y).toFixed(1)}`).join(' ')
    const close  = `L${cx(ptsAprox.at(-1).x).toFixed(1)},${zeroY} Z`
    return `${first} ${stroke} ${close}`
  }, [ptsAprox, cx, cy])

  // ── Ticks ─────────────────────────────────────────────────────────────────
  const xTicks = useMemo(() => {
    const ticks = []
    for (let i = 0; i <= 6; i++) ticks.push(xMinZ + (i * xRangeZ) / 6)
    return ticks
  }, [xMinZ, xRangeZ])

  const yTicks = useMemo(() => {
    const ticks = []
    for (let i = 0; i <= 4; i++) ticks.push(yMinZ + (i * yRangeZ) / 4)
    return ticks
  }, [yMinZ, yRangeZ])

  const zeroYPx = cy(0)

  // ── Hover sobre la curva f(x) o Nodos ─────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    const rect   = e.currentTarget.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const svgX   = (e.clientX - rect.left) * scaleX
    const svgY   = (e.clientY - rect.top)  * scaleY

    if (svgX < pad.l || svgX > W - pad.r) { 
      setHovered(null)
      setHoveredNode(null)
      return 
    }

    for (const p of ptsNodos) {
      const px = cx(p.x)
      const py = cy(p.y)
      const dist = Math.sqrt(Math.pow(svgX - px, 2) + Math.pow(svgY - py, 2))
      if (dist < 20) {
        setHoveredNode({ x: p.x, y: p.y })
        setHovered(null)
        setMousePos({ x: svgX, y: svgY })
        return
      }
    }

    setHoveredNode(null)
    const xVal = xMinZ + ((svgX - pad.l) / innW) * xRangeZ
    let nearest = null, minDist = Infinity
    for (const p of ptsCurva) {
      const d = Math.abs(p.x - xVal)
      if (d < minDist) { minDist = d; nearest = p }
    }
    if (nearest) {
      setHovered({ x: nearest.x, y: nearest.y, label: 'f(x)' })
      setMousePos({ x: svgX, y: svgY })
    }
  }, [ptsCurva, ptsNodos, xMinZ, xRangeZ, W, H, innW, pad.l, pad.r, cx, cy])

  // ── Guard: no datos ────────────────────────────────────────────────────────
  if (!range || ptsCurva.length < 2) return null

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>

      {/* (Zoom eliminado según requerimientos) */}

      {/* ── LEYENDA ── */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <LegendItem color={C.blue}   label="f(x) real"           dash={false} />
        <LegendItem color={C.orange} label={titulo ?? 'Aproximación'} dash={false} fill />
        <LegendItem color={C.green}  label="Nodos xᵢ"            dot />
      </div>

      {/* ── SVG ── */}
      <div ref={setContainerEl} style={{ position: 'relative', width: '100%', height: H }}>
        <svg
          width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: 'hidden', cursor: hoveredNode ? 'pointer' : 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHovered(null); setHoveredNode(null) }}
        >
          <defs>
            <clipPath id="integral-clip">
              <rect x={pad.l} y={pad.t} width={innW} height={innH} />
            </clipPath>
            {/* Gradiente de relleno vertical */}
            <linearGradient id="fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.orange} stopOpacity="0.35" />
              <stop offset="100%" stopColor={C.orange} stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Grid Y */}
          {yTicks.map((val, i) => (
            <g key={`y-${i}`}>
              <line
                x1={pad.l} y1={cy(val)} x2={W - pad.r} y2={cy(val)}
                stroke={C.border} strokeWidth={1} strokeDasharray="4,4" opacity={0.6}
              />
              <text x={pad.l - 10} y={cy(val)} textAnchor="end" dominantBaseline="middle"
                fontSize={11} fill={C.muted}>
                {fmtAxis(val)}
              </text>
            </g>
          ))}

          {/* Grid X */}
          {xTicks.map((val, i) => (
            <g key={`x-${i}`}>
              <line
                x1={cx(val)} y1={pad.t} x2={cx(val)} y2={H - pad.b}
                stroke={C.border} strokeWidth={1} strokeDasharray="4,4" opacity={0.6}
              />
              <text x={cx(val)} y={H - pad.b + 18} textAnchor="middle"
                fontSize={11} fill={C.muted}>
                {fmtAxis(val)}
              </text>
            </g>
          ))}

          {/* Eje y=0 */}
          {zeroYPx >= pad.t && zeroYPx <= H - pad.b && (
            <line x1={pad.l} y1={zeroYPx} x2={W - pad.r} y2={zeroYPx}
              stroke={C.muted} strokeWidth={1.5} opacity={0.7}
            />
          )}
          {/* Eje x=0 */}
          {cx(0) >= pad.l && cx(0) <= W - pad.r && (
            <line x1={cx(0)} y1={pad.t} x2={cx(0)} y2={H - pad.b}
              stroke={C.muted} strokeWidth={1.5} opacity={0.7}
            />
          )}

          {/* ── TRAZA 1: Relleno sombreado (área aproximada) ── */}
          <g clipPath="url(#integral-clip)">
            <path d={pathFill} fill="url(#fill-grad)" stroke="none" />
          </g>

          {/* ── TRAZA 2: Línea de la aproximación (trapecios/parábolas) ── */}
          <g clipPath="url(#integral-clip)">
            <path
              d={pathAprox}
              fill="none"
              stroke={C.orange}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.9}
            />
          </g>

          {/* ── TRAZA 3: Curva f(x) real (encima de todo) ── */}
          <g clipPath="url(#integral-clip)">
            <path
              d={pathCurva}
              fill="none"
              stroke={C.blue}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          </g>

          {/* ── TRAZA 4: Nodos x_i ── */}
          {ptsNodos.map((p, i) => {
            const px = cx(p.x)
            const py = cy(p.y)
            if (px < pad.l || px > W - pad.r || py < pad.t || py > H - pad.b) return null
            return (
              <g key={i}>
                {/* Línea vertical punteada desde nodo al eje x */}
                <line
                  x1={px} y1={py} x2={px} y2={Math.min(cy(0), H - pad.b)}
                  stroke={C.green} strokeWidth={1} strokeDasharray="3,3" opacity={0.5}
                />
                {/* Marcador */}
                <circle
                  cx={px} cy={py} r={4}
                  fill={C.green} stroke="var(--bg)" strokeWidth={1.5}
                />
              </g>
            )
          })}

          {/* ── Crosshair hover sobre f(x) ── */}
          {hovered && (
            <>
              <line
                x1={cx(hovered.x)} y1={pad.t} x2={cx(hovered.x)} y2={H - pad.b}
                stroke={C.muted} strokeWidth={1} strokeDasharray="4,4" opacity={0.6}
              />
              <circle
                cx={cx(hovered.x)} cy={cy(hovered.y)} r={5}
                fill={C.surface} stroke={C.blue} strokeWidth={2}
              />
            </>
          )}

          {/* ── Hover resaltado sobre Nodo ── */}
          {hoveredNode && (
            <circle
              cx={cx(hoveredNode.x)} cy={cy(hoveredNode.y)} r={6}
              fill={C.surface} stroke={C.green} strokeWidth={2.5}
            />
          )}
        </svg>

        {/* ── Tooltip hover f(x) ── */}
        {hovered && (
          <div style={{
            position: 'absolute',
            top  : Math.max(pad.t, mousePos.y - 66),
            left : Math.min(W - 130, mousePos.x + 14),
            background: 'var(--white)', color: 'var(--navy-dark)',
            padding: '8px 12px', borderRadius: 8,
            pointerEvents: 'none', fontSize: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            zIndex: 10, border: '1px solid var(--border)',
            minWidth: 110,
          }}>
            <div style={{ marginBottom: 3, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 3 }}>
              f(x)
            </div>
            <div>x: <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{hovered.x.toFixed(6)}</span></div>
            <div>y: <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{hovered.y.toFixed(6)}</span></div>
          </div>
        )}

        {/* ── Tooltip hover Nodo ── */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            top  : Math.max(pad.t, cy(hoveredNode.y) - 66),
            left : Math.min(W - 130, cx(hoveredNode.x) + 14),
            background: 'var(--white)', color: 'var(--navy-dark)',
            padding: '8px 12px', borderRadius: 8,
            pointerEvents: 'none', fontSize: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            zIndex: 10, border: '1px solid var(--border)',
            minWidth: 110,
          }}>
            <div style={{ marginBottom: 3, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 3 }}>
              Nodo xᵢ
            </div>
            <div>x: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{hoveredNode.x.toFixed(6)}</span></div>
            <div>f(x): <span style={{ color: 'var(--success)', fontWeight: 700 }}>{hoveredNode.y.toFixed(6)}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-componentes auxiliares ────────────────────────────────────────────────

function LegendItem({ color, label, dash, fill, dot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--slate)', fontWeight: 600 }}>
      {dot ? (
        <svg width={16} height={12}>
          <circle cx={8} cy={6} r={4} fill={color} stroke="var(--bg)" strokeWidth={1.5} />
        </svg>
      ) : (
        <svg width={24} height={12}>
          {fill && <rect x={0} y={3} width={24} height={6} fill={color} opacity={0.25} rx={2} />}
          <line x1={0} y1={6} x2={24} y2={6}
            stroke={color} strokeWidth={2.5}
            strokeDasharray={dash ? '5,3' : 'none'}
          />
        </svg>
      )}
      {label}
    </div>
  )
}
