import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = '/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
  })

  axiosAuth.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  axiosAuth.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        setUser(null)
        toast.error('Sesión expirada')
      }
      return Promise.reject(error)
    }
  )

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const { data } = await axiosAuth.get('/auth/me')
      setUser(data)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
      localStorage.setItem('token', data.token)
      setUser(data)
      toast.success(`Bienvenido, ${data.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password, role = 'vendedor') => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password, role })
      localStorage.setItem('token', data.token)
      setUser(data)
      toast.success('Cuenta creada exitosamente!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Sesión cerrada')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    axiosAuth,
    isAdmin: user?.role === 'admin',
    isVendedor: user?.role === 'vendedor'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
