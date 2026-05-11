import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

function zipXY(xs, ys) {
  if (!xs || !ys) return []
  return xs.map((x, i) => ({ x, y: ys[i] })).filter(d => d.y != null && isFinite(d.y))
}

function yBounds(data) {
  const vals = data.map(d => Math.abs(d.y)).filter(isFinite)
  const mx = Math.max(...vals, 1)
  return [-mx * 1.25, mx * 1.25]
}

const CrossShape = ({ cx, cy }) => {
  const s = 6
  return <path d={`M${cx-s},${cy-s}L${cx+s},${cy+s}M${cx+s},${cy-s}L${cx-s},${cy+s}`} stroke="#EF4444" strokeWidth={2.2} fill="none"/>
}

const RootShape = ({ cx, cy }) => (
  <circle cx={cx} cy={cy} r={7} fill="#00E676" stroke="white" strokeWidth={2}/>
)

const fmt6 = v => typeof v === 'number' ? v.toFixed(6) : v
const fmtAxis = v => {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1)
  return parseFloat(v.toFixed(3)).toString()
}
const gridStyle = { stroke: 'rgba(200,200,200,0.25)', strokeDasharray: '3 3' }
const axisStyle = { fontSize: 11, fill: '#64748b' }

export default function Chart({ f, raiz, xMin, xMax, iteraciones, chartKey, isPuntoFijo = false, isRegresion = false }) {
  if (!f || raiz == null) return null
  const funcData = zipXY(f.x, f.y)
  if (funcData.length === 0) return null

  const [yMin, yMax] = yBounds(funcData)
  const xL = funcData[0]?.x ?? xMin
  const xR = funcData[funcData.length - 1]?.x ?? xMax
  const yxData = isPuntoFijo ? funcData.map(d => ({ x: d.x, y: d.x })) : []
  const iterData = iteraciones && iteraciones.length > 0
    ? iteraciones.slice(0, -1).map(r => ({ x: r.x, y: isPuntoFijo ? r.x : 0 }))
    : []
  const regPoints = isRegresion && iteraciones?.puntos ? iteraciones.puntos.map(p => ({ x: p.x, y: p.y })) : []
  const rootPoint = [{ x: raiz, y: isPuntoFijo ? raiz : 0 }]

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid {...gridStyle}/>
        <XAxis type="number" dataKey="x" domain={[xL, xR]} tickFormatter={fmtAxis} tick={axisStyle} tickLine={false}/>
        <YAxis type="number" dataKey="y" domain={[yMin, yMax]} tickFormatter={fmtAxis} tick={axisStyle} tickLine={false} width={60}/>
        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => [fmt6(v), '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e2e8f0' }}/>
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>
        <Scatter name={isPuntoFijo ? 'g(x)' : 'f(x)'} data={funcData} line={{ stroke: '#3b82f6', strokeWidth: 2.5 }} shape={() => null} legendType="line" fill="#3b82f6"/>
        {isPuntoFijo && <Scatter name="y = x" data={yxData} line={{ stroke: '#FFCA28', strokeWidth: 2, strokeDasharray: '5 5' }} shape={() => null} legendType="line" fill="#FFCA28"/>}
        {isRegresion && regPoints.length > 0 && <Scatter name="Valores" data={regPoints} shape={<CrossShape/>} fill="#EF4444"/>}
        {iterData.length > 0 && <Scatter name="Iteraciones x_i" data={iterData} shape={<CrossShape/>} fill="#EF4444"/>}
        <Scatter name={isPuntoFijo ? 'Punto de convergencia' : 'Raíz'} data={rootPoint} shape={<RootShape/>} fill="#00E676"/>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function ErrorChart({ histIzq, histDer, nameIzq, nameDer, tipoError }) {
  if (!histIzq?.length || !histDer?.length) return null
  const maxLen = Math.max(histIzq.length, histDer.length)
  const data = Array.from({ length: maxLen }, (_, i) => ({
    iter: i + 1,
    [nameIzq]: histIzq[i]?.error ?? null,
    [nameDer]: histDer[i]?.error ?? null,
  }))
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid {...gridStyle}/>
        <XAxis dataKey="iter" tick={axisStyle} tickLine={false} label={{ value: 'Iteración', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }}/>
        <YAxis scale="log" domain={['auto', 'auto']} tickFormatter={v => v.toExponential(0)} tick={axisStyle} tickLine={false} width={60}/>
        <Tooltip formatter={(v, name) => [v?.toExponential(4), name]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e2e8f0' }}/>
        <Legend wrapperStyle={{ fontSize: 12 }}/>
        <Line dataKey={nameIzq} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} name={`Método A: ${nameIzq}`}/>
        <Line dataKey={nameDer} stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls={false} name={`Método B: ${nameDer}`}/>
      </LineChart>
    </ResponsiveContainer>
  )
}

export function RadarChart2({ nameIzq, scoresIzq, nameDer, scoresDer }) {
  const cats = ['VELOCIDAD', 'EFICIENCIA', 'ROBUSTEZ']
  const data = cats.map((cat, i) => ({ cat, [nameIzq]: scoresIzq[i], [nameDer]: scoresDer[i] }))
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke="rgba(200,200,200,0.4)"/>
        <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: '#0f172a' }}/>
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} tickCount={4}/>
        <Radar name={nameIzq} dataKey={nameIzq} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2.5}/>
        <Radar name={nameDer} dataKey={nameDer} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2.5} strokeDasharray="5 5"/>
        <Legend wrapperStyle={{ fontSize: 12 }}/>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e2e8f0' }}/>
      </RadarChart>
    </ResponsiveContainer>
  )
}
