import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

const getDefaultSettings = () => {
  const saved = localStorage.getItem('rooty-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (typeof parsed.darkMode !== 'boolean') parsed.darkMode = false
      return parsed
    } catch(e) {}
  }
  return {
    trigMode: 'Radianes',
    tipoError: 'Absoluto',
    maxIters: 100,
    ceroMaquina: 1e-12,
    limiteInfinito: 1e6,
    simularTruncamiento: false,
    decimalesTrunc: 4,
    darkMode: false,
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getDefaultSettings)

  useEffect(() => {
    localStorage.setItem('rooty-settings', JSON.stringify(settings))
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings])

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }))
  const reset = () => setSettings({
    trigMode: 'Radianes',
    tipoError: 'Absoluto',
    maxIters: 100,
    ceroMaquina: 1e-12,
    limiteInfinito: 1e6,
    simularTruncamiento: false,
    decimalesTrunc: 4,
    darkMode: false,
  })

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
