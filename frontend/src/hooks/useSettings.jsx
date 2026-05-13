import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

const getDefaultSettings = () => {
  const saved = localStorage.getItem('rooty-settings')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (typeof parsed.darkMode !== 'boolean') parsed.darkMode = systemPrefersDark
      return parsed
    } catch (e) { }
  }
  return {
    trigMode: 'Radianes',
    tipoError: 'Absoluto',
    maxIters: 100,
    ceroMaquina: 1e-12,
    limiteInfinito: 1e6,
    darkMode: systemPrefersDark,
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
  const reset = () => setSettings(s => ({
    trigMode: 'Radianes',
    tipoError: 'Absoluto',
    maxIters: 100,
    ceroMaquina: 1e-12,
    limiteInfinito: 1e6,
    darkMode: s.darkMode,
  }))

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
