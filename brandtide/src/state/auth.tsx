import { createContext, useContext, useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type User = { id: string; name: string; email: string; avatar?: string; token?: string } | null
type Ctx = {
  user: User
  setUser: (user: User) => void
  signInWithGoogle: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  error: string | null
}
const AuthCtx = createContext<Ctx>({ 
  user: null,
  setUser: () => {},
  signInWithGoogle: async()=>{}, 
  signIn: async()=>{},
  signUp: async()=>{},
  signOut: async()=>{},
  loading: false,
  error: null
})

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    const raw = localStorage.getItem('bt:user')
    if(raw) {
      try {
        const userData = JSON.parse(raw)
        setUser(userData)
        // Verify token is still valid
        verifyToken(userData.token)
      } catch {
        localStorage.removeItem('bt:user')
      }
    }
  }, [])

  async function verifyToken(token: string) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        // Token invalid, clear user
        localStorage.removeItem('bt:user')
        setUser(null)
      }
    } catch {
      // Network error or token invalid
      localStorage.removeItem('bt:user')
      setUser(null)
    }
  }

  async function signUp(name: string, email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }
      
      const userData = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        avatar: data.data.user.avatar,
        token: data.data.token
      }
      
      localStorage.setItem('bt:user', JSON.stringify(userData))
      setUser(userData)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }
      
      const userData = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        avatar: data.data.user.avatar,
        token: data.data.token
      }
      
      localStorage.setItem('bt:user', JSON.stringify(userData))
      setUser(userData)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle(){
    // Redirect to backend Google OAuth
    window.location.href = `${API_URL}/auth/google`
  }

  async function signOut(){
    setLoading(true)
    try {
      const token = user?.token
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('bt:user')
      setUser(null)
      setLoading(false)
    }
  }

  return <AuthCtx.Provider value={{user, setUser, signInWithGoogle, signIn, signUp, signOut, loading, error}}>{children}</AuthCtx.Provider>
}

export function useAuth(){ return useContext(AuthCtx) }
