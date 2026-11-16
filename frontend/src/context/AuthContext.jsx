import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('evally_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('evally_token') || null)

  function login(userData, jwt) {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('evally_user', JSON.stringify(userData))
    localStorage.setItem('evally_token', jwt)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('evally_user')
    localStorage.removeItem('evally_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
