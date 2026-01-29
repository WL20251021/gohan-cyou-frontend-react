import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getMe } from '@/features/user/api'

type User = any

interface UserContextType {
  user: User | null
  setUser: (u: User | null) => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const refreshUser = async () => {
    try {
      const res = await getMe()
      setUser(res?.data || null)
    } catch (e) {
      console.error('refreshUser error', e)
    }
  }

  useEffect(() => {
    void refreshUser()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
