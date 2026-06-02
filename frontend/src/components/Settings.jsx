import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSettings } from '../hooks/useSettings'
import { IconSettings } from './Icons'

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
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef()
  const panelRef = useRef()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      // Calculate position synchronously before opening, so first render is correct
      const rect = btnRef.current.getBoundingClientRect()
      const PANEL_W = 260
      const GAP = 8
      const vw = window.innerWidth
      const vh = window.innerHeight

      let left = rect.left
      // Clamp so panel never overflows right edge
      if (left + PANEL_W > vw - GAP) left = vw - PANEL_W - GAP
      if (left < GAP) left = GAP

      // Anchor bottom of panel to top of button, with a small gap
      // Distance from bottom of viewport = window height - top of button + gap
      const bottom = vh - rect.top + GAP

      setPanelPos({ bottom, left })
    }
    setOpen(o => !o)
  }

  const panel = open && (
    <div
      ref={panelRef}
      className="settings-panel"
      style={{
        position: 'fixed',
        bottom: panelPos.bottom,
        left: panelPos.left,
      }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center' }}>
        <IconSettings style={{ width: '1.2rem', height: '1.2rem', marginRight: '6px' }}/> Configuración Global
      </h3>
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
      <button className="btn btn-secondary" onClick={reset} style={{ marginBottom: 0 }}>
        ♻️ Restablecer Valores
      </button>
    </div>
  )

  return (
    <>
      <button ref={btnRef} className="utility-btn" onClick={handleToggle}>
        <span className="util-icon"><IconSettings /></span>
        <span>Configuración global</span>
      </button>
      {createPortal(panel, document.body)}
    </>
  )
}
