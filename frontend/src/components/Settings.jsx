import { useState, useEffect, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'

const CERO_OPT = [1e-6, 1e-9, 1e-12, 1e-15]
const INF_OPT = [1e6, 1e15, 1e50, 1e100]

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="radio-group">
      {options.map(o => (
        <div key={o} className={`radio-opt ${value === o ? 'selected' : ''}`} onClick={() => onChange(o)}>
          {o}
        </div>
      ))}
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!value)}>
      <div className={`toggle-switch ${value ? 'on' : ''}`}>
        <div className="toggle-knob" />
      </div>
      <span className="toggle-label">{label}</span>
    </div>
  )
}

function SliderIndex({ options, value, onChange, format }) {
  const idx = options.indexOf(value)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Valor actual:</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 700 }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={0} max={options.length - 1}
        value={idx < 0 ? 0 : idx}
        onChange={e => onChange(options[parseInt(e.target.value)])}
      />
    </div>
  )
}

export default function Settings() {
  const { settings, update, reset } = useSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="settings-btn" onClick={() => setOpen(o => !o)}>
        ⚙️ Configuración Global
      </button>

      {open && (
        <div className="settings-panel">
          <h3>🛠️ Configuración Global</h3>
          <hr className="divider" />

          <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>🎨 Apariencia</p>
          <Toggle label="Modo Oscuro" value={settings.darkMode} onChange={v => update('darkMode', v)} />

          <hr className="divider" />

          <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>🧮 Motor Matemático</p>
          <div className="form-group">
            <label className="form-label">Trigonometría</label>
            <RadioGroup options={['Radianes', 'Grados']} value={settings.trigMode} onChange={v => update('trigMode', v)} />
          </div>

          <div className="form-group">
            <label className="form-label">Criterio de Parada (Error)</label>
            <select className="form-select" value={settings.tipoError} onChange={e => update('tipoError', e.target.value)}>
              <option>Absoluto</option>
              <option>Relativo</option>
              <option>Porcentual</option>
            </select>
          </div>

          <hr className="divider" />
          <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>🛑 Límites y Tolerancias</p>

          <div className="form-group">
            <label className="form-label">Límite de Iteraciones: <strong>{settings.maxIters}</strong></label>
            <input
              type="range" min={10} max={1000} step={10}
              value={settings.maxIters}
              onChange={e => update('maxIters', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tolerancia de "Cero Exacto"</label>
            <SliderIndex
              options={CERO_OPT}
              value={settings.ceroMaquina}
              onChange={v => update('ceroMaquina', v)}
              format={v => `10^${Math.round(Math.log10(v))}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Umbral de Divergencia</label>
            <SliderIndex
              options={INF_OPT}
              value={settings.limiteInfinito}
              onChange={v => update('limiteInfinito', v)}
              format={v => `10^${Math.round(Math.log10(v))}`}
            />
          </div>

          <hr className="divider" />
          <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>🧪 Simulación Avanzada</p>
          <Toggle label="Simular Aritmética Finita" value={settings.simularTruncamiento} onChange={v => update('simularTruncamiento', v)} />

          {settings.simularTruncamiento && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Cifras decimales a retener: <strong>{settings.decimalesTrunc}</strong></label>
              <input type="range" min={2} max={8} value={settings.decimalesTrunc} onChange={e => update('decimalesTrunc', parseInt(e.target.value))} />
            </div>
          )}

          <hr className="divider" />
          <button className="btn btn-secondary" onClick={reset} style={{ marginBottom: 0 }}>
            ♻️ Restablecer Valores
          </button>
        </div>
      )}
    </div>
  )
}
