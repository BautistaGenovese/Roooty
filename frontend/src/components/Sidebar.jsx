import { NavLink } from 'react-router-dom'
import Settings from './Settings'
import { useHistory } from '../hooks/useHistory'
import {
  IconHome, IconBiseccion, IconRegulaFalsi, IconNewton,
  IconSecante, IconPuntoFijo, IconRegresion, IconComparacion,
  IconTrapecio, IconSimpson, IconHistory, IconGaussJordan, IconMatrices
} from './Icons'

const LINKS = {
  nav: [
    { to: '/', label: 'Inicio', icon: <IconHome /> },
  ],
  cerrados: [
    { to: '/biseccion', label: 'Bisección', icon: <IconBiseccion /> },
    { to: '/regula-falsi', label: 'Regula Falsi', icon: <IconRegulaFalsi /> },
  ],
  abiertos: [
    { to: '/newton', label: 'Newton-Raphson', icon: <IconNewton /> },
    { to: '/secante', label: 'Secante', icon: <IconSecante /> },
    { to: '/punto-fijo', label: 'Punto Fijo', icon: <IconPuntoFijo /> },
  ],
  herramientas: [
    { to: '/regresion', label: 'Regresión', icon: <IconRegresion /> },
    { to: '/comparacion', label: 'Comparación', icon: <IconComparacion /> },
  ],
  integracion: [
    { to: '/integracion/trapecio', label: 'Trapecio', icon: <IconTrapecio /> },
    { to: '/integracion/simpson13', label: 'Simpson 1/3', icon: <IconSimpson /> },
    { to: '/integracion/simpson38', label: 'Simpson 3/8', icon: <IconSimpson /> },
    { to: '/edos/euler', label: 'Euler', icon: <IconTrapecio /> },
  ]
  ],
  // Sistemas lineales — ambos métodos de Gauss juntos
  sistemas: [
    { to: '/matrices/gaussiana', label: 'Eliminación Gaussiana', icon: <IconMatrices /> },
    { to: '/matrices/gauss-jordan', label: 'Gauss-Jordan', icon: <IconGaussJordan /> },
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
      <span className="sidebar-icon-wrap">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { hasUnseen } = useHistory()

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

        <p className="sidebar-section-label">INTEGRACIÓN NUMÉRICA</p>
        {LINKS.integracion.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <p className="sidebar-section-label">ECUACIONES DIFERENCIALES</p>
        {LINKS.edos.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}
        <p className="sidebar-section-label">SISTEMAS LINEALES</p>
        {LINKS.sistemas.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <p className="sidebar-section-label">HERRAMIENTAS</p>
        {LINKS.herramientas.map(l => <SidebarLink key={l.to} {...l} onClick={onClose} />)}

        <hr className="sidebar-divider" />

        <p className="sidebar-section-label">UTILIDADES</p>
        <div className="utilities-stack">
          <Settings />
          <NavLink
            to="/historial"
            onClick={onClose}
            className={({ isActive }) => `utility-btn${isActive ? ' utility-btn--active' : ''}`}
          >
            <span className="util-icon"><IconHistory /></span>
            <span>Historial de funciones</span>
            {hasUnseen && <span className="unseen-dot" />}
          </NavLink>
        </div>
      </aside>
    </>
  )
}
