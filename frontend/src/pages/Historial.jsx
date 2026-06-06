import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { IconHistory } from '../components/Icons'

const METHOD_ROUTES = {
  'Bisección': '/biseccion',
  'Regula Falsi': '/regula-falsi',
  'Newton-Raphson': '/newton',
  'Secante': '/secante',
  'Punto Fijo': '/punto-fijo',
  'Trapecio': '/integracion/trapecio',
  'Simpson 1/3': '/integracion/simpson13',
  'Simpson 3/8': '/integracion/simpson38',
  'Gauss-Jordan': '/matrices/gauss-jordan',
  'Eliminación Gaussiana': '/matrices/gaussiana',
  'Euler': '/edos/euler',
  'Heun': '/edos/heun',
  'Punto Medio': '/edos/punto-medio',
  'Ralston': '/edos/ralston',
}

const MATRIX_METHODS = ['Eliminación Gaussiana', 'Gauss-Jordan']
const EDO_METHODS = ['Euler', 'Heun', 'Punto Medio', 'Ralston']

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `Hace ${hours}h ${minutes % 60}min`
}

function HistoryCard({ entry, onRemove }) {
  const navigate = useNavigate()

  const handleRerun = () => {
    const route = METHOD_ROUTES[entry.method]
    if (!route) return

    const q = new URLSearchParams()
    if (entry.queryParams) {
      Object.entries(entry.queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, v)
      })
    }
    const qs = q.toString()
    navigate(qs ? `${route}?${qs}` : route)
  }

  return (
    <div className="history-card">
      <div className="history-card-top">
        <div className="history-card-method">{entry.method}</div>
        <span className="history-card-time">{timeAgo(entry.timestamp)}</span>
      </div>

      <div className="history-card-params">
        {Object.entries(entry.displayParams || {}).map(([k, v]) => (
          <span key={k} className="history-param-chip">
            <strong>{k}:</strong> {v}
          </span>
        ))}
      </div>

      {entry.raiz != null && (
        <div className="history-card-result">
          <span className="history-result-label">
            {entry.method === 'Gauss-Jordan'
              ? 'Solución'
              : METHOD_ROUTES[entry.method]?.startsWith('/integracion') ? 'Integral ≈' : 'Raíz encontrada'}
          </span>
          <span className="history-result-value" style={{ fontSize: entry.method === 'Gauss-Jordan' ? '0.82rem' : undefined }}>
            {entry.method === 'Gauss-Jordan'
              ? `[${entry.raiz}]`
              : Number(entry.raiz).toFixed(8)}
          </span>
        </div>
      )}

      {entry.raiz == null && !EDO_METHODS.includes(entry.method) && (
        <div className={`history-card-result${MATRIX_METHODS.includes(entry.method) ? '' : ' history-card-result--fail'}`}>
          <span className="history-result-label">
            {MATRIX_METHODS.includes(entry.method) ? '✓ Sistema resuelto' : 'No convergió'}
          </span>
        </div>
      )}

      {EDO_METHODS.includes(entry.method) && (
        <div className="history-card-result">
          <span className="history-result-label">
            ✓ EDO Resuelta
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
        <button className="btn btn-secondary history-rerun-btn" onClick={handleRerun} style={{ flex: 1, margin: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Volver a ejecutar
        </button>
        <button
          className="btn-clear-matrix"
          onClick={onRemove}
          title="Eliminar del historial"
          style={{
            padding: '10px',
            minWidth: '40px',
            width: '40px',
            flexShrink: 0,
            margin: 0
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Historial() {
  const { entries, markSeen, clear, removeItem } = useHistory()

  useEffect(() => {
    markSeen()
  }, [markSeen])

  return (
    <div className="page-content-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
          Historial de Funciones
        </h1>
        {entries.length > 0 && (
          <button className="btn btn-secondary" onClick={clear} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            Limpiar historial
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ marginBottom: '1rem', opacity: 0.4, display: 'flex', justifyContent: 'center' }}><IconHistory width={48} height={48} strokeWidth={1.5} /></div>
          <h2 style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Sin operaciones recientes
          </h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Las operaciones que realices durante esta sesión aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map(entry => (
            <HistoryCard key={entry.id} entry={entry} onRemove={() => removeItem(entry.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
