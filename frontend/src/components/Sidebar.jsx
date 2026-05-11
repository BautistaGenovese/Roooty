import { NavLink } from 'react-router-dom'
import Settings from './Settings'

const LINKS = {
  nav: [
    { to: '/', label: 'Inicio', icon: '🏠' },
  ],
  cerrados: [
    { to: '/biseccion', label: 'Bisección', icon: '📉' },
    { to: '/regula-falsi', label: 'Regula Falsi', icon: '📐' },
  ],
  abiertos: [
    { to: '/newton', label: 'Newton', icon: '🎢' },
    { to: '/secante', label: 'Secante', icon: '🎯' },
    { to: '/punto-fijo', label: 'Punto Fijo', icon: '📍' },
  ],
  herramientas: [
    { to: '/regresion', label: 'Regresión', icon: '📊' },
    { to: '/comparacion', label: 'Comparación', icon: '📈' },
  ],
}

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="sidebar-logo-mobile">
            <span className="logo-sigma">Σ</span>
            <strong>ROOOTY Lab</strong>
          </div>
          <button className="close-sidebar-btn" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <div className="sidebar-logo desktop-only">
          <h1>
            <span className="logo-sigma">Σ</span>
            ROOOTY Lab
          </h1>
        </div>

        <p className="sidebar-section-label">NAVEGACIÓN</p>
        {LINKS.nav.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <p className="sidebar-section-label">MÉTODOS CERRADOS</p>
        {LINKS.cerrados.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <p className="sidebar-section-label">MÉTODOS ABIERTOS</p>
        {LINKS.abiertos.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <p className="sidebar-section-label">HERRAMIENTAS</p>
        {LINKS.herramientas.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <hr className="sidebar-divider" />

        <p className="sidebar-section-label">UTILIDADES</p>
        <Settings />
      </aside>
    </>
  )
}
