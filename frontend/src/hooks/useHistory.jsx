import { createContext, useContext, useState, useCallback } from 'react'

const HistoryContext = createContext(null)

export function HistoryProvider({ children }) {
  const [entries, setEntries] = useState([])
  const [hasUnseen, setHasUnseen] = useState(false)

  const push = useCallback((entry) => {
    setEntries(prev => [{
      ...entry,
      id: Date.now(),
      timestamp: new Date(),
    }, ...prev])
    setHasUnseen(true)
  }, [])

  const markSeen = useCallback(() => {
    setHasUnseen(false)
  }, [])

  const clear = useCallback(() => {
    setEntries([])
    setHasUnseen(false)
  }, [])

  const removeItem = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return (
    <HistoryContext.Provider value={{ entries, hasUnseen, push, markSeen, clear, removeItem }}>
      {children}
    </HistoryContext.Provider>
  )
}

export const useHistory = () => useContext(HistoryContext)
