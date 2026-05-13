import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell
} from 'recharts';

// --- FUNCIONES AUXILIARES ORIGINALES ---
function zipXY(xs, ys) {
  if (!xs || !ys) return [];
  return xs.map((x, i) => ({ x, y: ys[i] })).filter(d => d.y != null && isFinite(d.y));
}

const fmtAxis = v => {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return parseFloat(v.toFixed(3)).toString();
};

const gridStyle = { stroke: 'rgba(200,200,200,0.25)', strokeDasharray: '3 3' };
const axisStyle = { fontSize: 11, fill: '#64748b' };

// --- GRÁFICO PRINCIPAL (SVG NATIVO) ---

// Paleta de colores elegante con soporte a Dark Mode nativo
const C = {
  teal: "var(--blue)",
  dark: "var(--navy-dark)",
  surface: "var(--bg)",
  border: "var(--border)",
  muted: "var(--slate)",
  root: "var(--success)",
  iter: "var(--error)"
};

export default function Chart({ f, raiz, xMin, xMax, isPuntoFijo = false, isRegresion = false, dataPoints = null }) {
  const [containerEl, setContainerEl] = useState(null);
  const [dimensions, setDimensions] = useState({ W: 800 });
  const [isRootHovered, setIsRootHovered] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1.0);

  useEffect(() => {
    if (!containerEl) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({ W: entry.contentRect.width });
        }
      }
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  const points = useMemo(() => zipXY(f?.x, f?.y), [f]);

  const { valid, xMinCalc, xMaxCalc, yMin, yMax, xRange, yRange } = useMemo(() => {
    if (points.length < 2) return { valid: [], xMinCalc: 0, xMaxCalc: 1, yMin: 0, yMax: 1, xRange: 1, yRange: 1 };
    const xs = points.map(p => p.x);
    const ys = points.map(p => Math.abs(p.y)).filter(isFinite);
    const mxY = Math.max(...ys, 1) * 1.25;

    const origXL = xs[0] ?? xMin;
    const origXR = xs[xs.length - 1] ?? xMax;

    const origXRange = (origXR - origXL) || 1;
    const origYRange = (mxY - (-mxY)) || 1;

    // Zoom
    const zoomedXRange = origXRange / zoomLevel;
    const zoomedYRange = origYRange / zoomLevel;

    // Centering
    let centerX = (origXL + origXR) / 2;
    let centerY = 0;

    if (raiz != null && Number.isFinite(raiz) && !isRegresion) {
        centerX = raiz;
        centerY = isPuntoFijo ? raiz : 0;
    }

    const xL = centerX - zoomedXRange / 2;
    const xR = centerX + zoomedXRange / 2;
    const newYMin = centerY - zoomedYRange / 2;
    const newYMax = centerY + zoomedYRange / 2;

    return {
      valid: points,
      xMinCalc: xL,
      xMaxCalc: xR,
      yMin: newYMin,
      yMax: newYMax,
      xRange: zoomedXRange,
      yRange: zoomedYRange,
    };
  }, [points, xMin, xMax, raiz, isPuntoFijo, zoomLevel]);

  const { W } = dimensions;
  const H = Math.max(250, W * (7 / 16));
  const pad = { t: 20, r: 20, b: 35, l: W < 500 ? 40 : 65 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const cx = useCallback((x) => pad.l + ((x - xMinCalc) / xRange) * innerW, [xMinCalc, xRange, pad.l, innerW]);
  const cy = useCallback((y) => pad.t + innerH - ((y - yMin) / yRange) * innerH, [yMin, yRange, pad.t, innerH]);

  const curveD = useMemo(() =>
    valid.map((p, i) => `${i === 0 ? "M" : "L"}${cx(p.x).toFixed(1)},${cy(p.y).toFixed(1)}`).join(" "),
    [valid, cx, cy]);

  const zeroY = cy(0);
  const rootX = raiz != null && Number.isFinite(raiz) ? cx(raiz) : null;
  // Para Punto Fijo la raíz está en g(x)=x, o sea en el punto (raiz, raiz)
  const rootY = isPuntoFijo ? cy(raiz) : zeroY;

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    if (svgX < pad.l || svgX > W - pad.r) {
      setHovered(null);
      setIsRootHovered(false);
      return;
    }

    if (rootX != null) {
      const dist = Math.sqrt(Math.pow(svgX - rootX, 2) + Math.pow(svgY - rootY, 2));
      if (dist < 20) {
        setIsRootHovered(true);
        setHovered(null);
        setMousePos({ x: svgX, y: svgY });
        return;
      }
    }

    setIsRootHovered(false);
    const xVal = xMinCalc + ((svgX - pad.l) / innerW) * xRange;
    let nearest = valid[0];
    let minDist = Infinity;
    for (const p of valid) {
      const dist = Math.abs(p.x - xVal);
      if (dist < minDist) { minDist = dist; nearest = p; }
    }
    setHovered(nearest);
    setMousePos({ x: svgX, y: svgY });
  }, [valid, xMinCalc, xRange, W, H, innerW, pad.l, pad.r, rootX, rootY]);

  // Generar ticks para los ejes
  const xTicks = useMemo(() => {
    if (xRange === 0) return [];
    const ticks = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      ticks.push(xMinCalc + (i * xRange) / steps);
    }
    return ticks;
  }, [xMinCalc, xRange]);

  const yTicks = useMemo(() => {
    if (yRange === 0) return [];
    const ticks = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      ticks.push(yMin + (i * yRange) / steps);
    }
    return ticks;
  }, [yMin, yRange]);

  if (valid.length < 2) return null;

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      {/* ZOOM CONTROLS */}
      <div 
        data-html2canvas-ignore="true"
        style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        alignItems: 'center', 
        marginBottom: '12px',
        width: '100%'
      }}>
        <div /> {/* Spacer */}

        {/* Main zoom bar - Centered */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          height: '32px',
        }}>
          <button
            onClick={() => setZoomLevel(z => Math.max(1.0, z - 0.5))}
            disabled={zoomLevel <= 1.0}
            style={{
              width: '32px', height: '32px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'transparent',
              cursor: zoomLevel <= 1.0 ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              color: zoomLevel <= 1.0 ? 'var(--border)' : 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (zoomLevel > 1.0) e.currentTarget.style.background = 'var(--surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            −
          </button>

          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: zoomLevel !== 1.0 ? 'var(--blue)' : 'var(--slate)',
            minWidth: '68px',
            textAlign: 'center',
            letterSpacing: '0.3px',
            transition: 'color 0.2s',
            padding: '0 4px',
          }}>
            {zoomLevel === 1.0 ? 'Zoom' : `x${zoomLevel.toFixed(1)}`}
          </span>

          <button
            onClick={() => setZoomLevel(z => Math.min(10.0, z + 0.5))}
            disabled={zoomLevel >= 10.0}
            style={{
              width: '32px', height: '32px',
              border: 'none',
              borderLeft: '1px solid var(--border)',
              background: 'transparent',
              cursor: zoomLevel >= 10.0 ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              color: zoomLevel >= 10.0 ? 'var(--border)' : 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (zoomLevel < 10.0) e.currentTarget.style.background = 'var(--surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            +
          </button>
        </div>

        {/* Reset button - Aligned to the right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {zoomLevel !== 1.0 && (
            <button
              onClick={() => setZoomLevel(1.0)}
              title="Restablecer zoom"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--white)',
                color: 'var(--slate)',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--slate)'; }}
            >
              ↺
            </button>
          )}
        </div>
      </div>

      <div ref={setContainerEl} style={{ position: "relative", width: "100%", height: H }}>
        <svg
          width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "hidden", cursor: isRootHovered ? "pointer" : "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHovered(null); setIsRootHovered(false); }}
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x={pad.l} y={pad.t} width={innerW} height={innerH} />
            </clipPath>
          </defs>

        {/* Ticks y Grid Y */}
        {yTicks.map((val, i) => (
          <g key={`y-${i}`}>
            <line x1={pad.l} y1={cy(val)} x2={W - pad.r} y2={cy(val)} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
            <text x={pad.l - 10} y={cy(val)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={C.muted}>
              {fmtAxis(val)}
            </text>
          </g>
        ))}

        {/* Ticks y Grid X */}
        {xTicks.map((val, i) => (
          <g key={`x-${i}`}>
            <line x1={cx(val)} y1={pad.t} x2={cx(val)} y2={H - pad.b} stroke={C.border} strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
            <text x={cx(val)} y={H - pad.b + 18} textAnchor="middle" fontSize={11} fill={C.muted}>
              {fmtAxis(val)}
            </text>
          </g>
        ))}

        {/* Ejes X e Y Centrales */}
        {zeroY >= pad.t && zeroY <= H - pad.b && (
          <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke={C.muted} strokeWidth={1.5} opacity={0.8} />
        )}
        {cx(0) >= pad.l && cx(0) <= W - pad.r && (
          <line x1={cx(0)} y1={pad.t} x2={cx(0)} y2={H - pad.b} stroke={C.muted} strokeWidth={1.5} opacity={0.8} />
        )}

        {/* Línea y = x para Punto Fijo */}
        {isPuntoFijo && Math.max(xMinCalc, yMin) <= Math.min(xMaxCalc, yMax) && (
          <line 
            x1={cx(Math.max(xMinCalc, yMin))} 
            y1={cy(Math.max(xMinCalc, yMin))} 
            x2={cx(Math.min(xMaxCalc, yMax))} 
            y2={cy(Math.min(xMaxCalc, yMax))} 
            stroke={C.muted} strokeWidth={1.5} strokeDasharray="5,5" opacity={0.5} 
          />
        )}

        {/* Curva de la función */}
        <g clipPath="url(#chart-clip)">
          <path d={curveD} fill="none" stroke={C.teal} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
        
        {/* Puntos de datos para Regresión */}
        {isRegresion && dataPoints && dataPoints.map((p, i) => (
          <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={4} fill={C.teal} stroke="white" strokeWidth={1.5} />
        ))}

        {/* Punto de Raíz */}
        {rootX && (
          <g>
            <line x1={rootX} y1={pad.t} x2={rootX} y2={H - pad.b} stroke={C.root} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.8} />
            <circle cx={rootX} cy={rootY} r={6} fill={C.root} stroke="white" strokeWidth={2} />
          </g>
        )}

        {/* Indicador de Hover sobre curva general */}
        {hovered && (
          <>
            <line x1={cx(hovered.x)} y1={pad.t} x2={cx(hovered.x)} y2={H - pad.b} stroke={C.muted} strokeWidth={1} strokeDasharray="4,4" />
            <circle cx={cx(hovered.x)} cy={cy(hovered.y)} r={5} fill={C.surface} stroke={C.teal} strokeWidth={2} />
          </>
        )}
      </svg>

      {/* Tooltip para la raíz */}
      {isRootHovered && rootX != null && (
        <div style={{
          position: "absolute", top: Math.max(pad.t, rootY - 70), left: Math.min(W - 100, rootX + 15),
          background: "var(--white)", color: "var(--navy-dark)", padding: "8px 12px", borderRadius: "8px",
          pointerEvents: "none", fontSize: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
          zIndex: 10, border: "1px solid var(--border)"
        }}>
          <div style={{ marginBottom: 4, fontWeight: "bold", borderBottom: `1px solid var(--border)`, paddingBottom: 2 }}>Punto Fijo (Raíz)</div>
          <div>x: <span style={{ color: 'var(--blue)', fontWeight: "bold" }}>{raiz.toFixed(6)}</span></div>
          <div>{isPuntoFijo ? 'g(x)' : 'y'}: <span style={{ color: 'var(--blue)', fontWeight: "bold" }}>{isPuntoFijo ? raiz.toFixed(6) : '0.000000'}</span></div>
        </div>
      )}

      {/* Tooltip para el resto de la curva */}
      {hovered && (
        <div style={{
          position: "absolute", top: Math.max(pad.t, mousePos.y - 60), left: Math.min(W - 100, mousePos.x + 15),
          background: "var(--white)", color: "var(--navy-dark)", padding: "8px 12px", borderRadius: "8px",
          pointerEvents: "none", fontSize: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
          zIndex: 10, border: "1px solid var(--border)"
        }}>
          <div>x: <span style={{ color: 'var(--blue)', fontWeight: "bold" }}>{hovered.x.toFixed(6)}</span></div>
          <div>y: <span style={{ color: 'var(--blue)', fontWeight: "bold" }}>{hovered.y.toFixed(6)}</span></div>
        </div>
      )}
    </div>
    </div>
  );
}

// --- GRÁFICOS RESTANTES (Mantenidos igual porque Recharts es ideal aquí) ---

export function ErrorChart({ histIzq, histDer, nameIzq, nameDer }) {
  if (!histIzq?.length || !histDer?.length) return null;
  const maxLen = Math.max(histIzq.length, histDer.length);
  const data = Array.from({ length: maxLen }, (_, i) => ({
    iter: i + 1,
    [nameIzq]: histIzq[i]?.error ?? null,
    [nameDer]: histDer[i]?.error ?? null,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="iter" tick={axisStyle} tickLine={false} label={{ value: 'Iteración', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }} />
        <YAxis scale="log" domain={['auto', 'auto']} tickFormatter={v => v.toExponential(0)} tick={axisStyle} tickLine={false} width={60} />
        <RechartsTooltip 
          formatter={(v, name) => [v?.toExponential(4), name]} 
          contentStyle={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--navy-dark)' }} 
          itemStyle={{ color: 'var(--navy-dark)' }}
        />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
        <Line dataKey={nameIzq} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} name={`Método A: ${nameIzq}`} />
        <Line dataKey={nameDer} stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls={false} name={`Método B: ${nameDer}`} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RadarChart2({ nameIzq, scoresIzq, nameDer, scoresDer }) {
  const cats = ['VELOCIDAD', 'EFICIENCIA', 'ROBUSTEZ'];
  const data = cats.map((cat, i) => ({ cat, [nameIzq]: scoresIzq[i], [nameDer]: scoresDer[i] }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke="rgba(200,200,200,0.4)" />
        <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: 'var(--navy-dark)' }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} tickCount={4} />
        <Radar name={nameIzq} dataKey={nameIzq} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2.5} />
        <Radar name={nameDer} dataKey={nameDer} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2.5} strokeDasharray="5 5" />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <RechartsTooltip 
          contentStyle={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--navy-dark)' }} 
          itemStyle={{ color: 'var(--navy-dark)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
export function ComparisonBarChart({ nameA, valA, nameB, valB, isTime = false }) {
  const data = [
    { name: nameA, value: valA, color: '#3b82f6' },
    { name: nameB, value: valB, color: '#8b5cf6' }
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--slate)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <RechartsTooltip 
          cursor={{ fill: 'rgba(200,200,200,0.05)' }}
          contentStyle={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--navy-dark)' }}
          itemStyle={{ color: 'var(--navy-dark)' }}
        />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]} 
          barSize={40} 
          label={{ 
            position: 'top', 
            fill: 'var(--navy-dark)', 
            fontSize: 11, 
            fontWeight: 800, 
            formatter: v => isTime ? v.toFixed(3) : v 
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

