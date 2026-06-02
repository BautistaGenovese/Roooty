import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SettingsProvider } from './hooks/useSettings'
import { HistoryProvider } from './hooks/useHistory'
import Sidebar from './components/Sidebar'

import Inicio from './pages/Inicio'
import Biseccion from './pages/Biseccion'
import RegulaFalsi from './pages/RegulaFalsi'
import Newton from './pages/Newton'
import Secante from './pages/Secante'
import PuntoFijo from './pages/PuntoFijo'
import Regresion from './pages/Regresion'
import Comparacion from './pages/Comparacion'
import Historial from './pages/Historial'

import Trapecio from './pages/integracion/Trapecio'
import Simpson13 from './pages/integracion/Simpson13'
import Simpson38 from './pages/integracion/Simpson38'
import Euler from './pages/EulerPage'
import EliminacionGaussiana from './pages/matrices/EliminacionGaussiana'

import GaussJordan from './pages/matrices/GaussJordan'

function MainContent({ children }) {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.key]);

  return (
    <main className="main-content" ref={mainRef}>
      {children}
    </main>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <SettingsProvider>
      <HistoryProvider>
        <BrowserRouter>
          <div className="app-shell">
            {/* Mobile Navbar */}
            <div className="mobile-navbar">
              <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Abrir menú">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div className="mobile-logo">
                <span className="logo-sigma">Σ</span>
                <strong>ROOOTY Lab</strong>
              </div>
              <div style={{ width: 24 }}></div> {/* Balance for centering */}
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <MainContent>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/biseccion" element={<Biseccion />} />
                <Route path="/regula-falsi" element={<RegulaFalsi />} />
                <Route path="/newton" element={<Newton />} />
                <Route path="/secante" element={<Secante />} />
                <Route path="/punto-fijo" element={<PuntoFijo />} />
                <Route path="/regresion" element={<Regresion />} />
                <Route path="/comparacion" element={<Comparacion />} />
                <Route path="/historial" element={<Historial />} />
                
                {/* Integración Numérica */}
                <Route path="/integracion/trapecio" element={<Trapecio />} />
                <Route path="/integracion/simpson13" element={<Simpson13 />} />
                <Route path="/integracion/simpson38" element={<Simpson38 />} />
                <Route path="/edos/euler" element={<Euler />} />

                {/* Sistemas Lineales */}
                <Route path="/matrices/gauss-jordan" element={<GaussJordan />} />
                <Route path="/matrices/gaussiana" element={<EliminacionGaussiana />} />
              </Routes>
            </MainContent>
          </div>
        </BrowserRouter>
      </HistoryProvider>
    </SettingsProvider>
  )
}
