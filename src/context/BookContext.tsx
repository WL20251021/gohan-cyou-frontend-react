import { createContext, useContext, useState, type ReactNode, useCallback } from 'react'

interface BookContextType {
  isPageFlipped: boolean
  setFlip: (flipped: boolean) => void
}

const BookContext = createContext<BookContextType | null>(null)

export function BookProvider({ children }: { children: ReactNode }) {
  const [isPageFlipped, setIsPageFlipped] = useState(false)

  const setFlip = useCallback((flipped: boolean) => {
    setIsPageFlipped(flipped)
  }, [])

  return (
    <BookContext.Provider
      value={{
        isPageFlipped,
        setFlip,
      }}
    >
      {children}
    </BookContext.Provider>
  )
}

export function useBook() {
  const context = useContext(BookContext)
  if (!context) {
    throw new Error('useBook must be used within a BookProvider')
  }
  return context
}
