import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  FaBoxOpen, FaChartLine, FaShoppingCart, FaHistory, FaFileAlt,
  FaSignOutAlt, FaSun, FaMoon, FaBars, FaTimes, FaBell,
  FaBoxes, FaUser
} from 'react-icons/fa'

const Sidebar = ({ darkMode, setDarkMode, collapsed, setCollapsed }) => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { connected } = useSocket()

  const navItems = [
    { path: '/', icon: FaChartLine, label: 'Dashboard' },
    { path: '/products', icon: FaBoxes, label: 'Inventario' },
    { path: '/new-sale', icon: FaShoppingCart, label: 'Nueva Venta' },
    { path: '/sales', icon: FaHistory, label: 'Historial' },
    ...(isAdmin ? [{ path: '/reports', icon: FaFileAlt, label: 'Reportes' }] : [])
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaBoxOpen className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                  Stock<span className="text-primary-500">Flow</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              {collapsed ? <FaBars /> : <FaTimes />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <FaUser className="w-5 h-5 text-white" />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 ${connected ? 'bg-green-500' : 'bg-red-500'} rounded-full border-2 border-white dark:border-gray-800`}></span>
          </div>
          {!collapsed && (
            <div className="mb-4">
              <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
          
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 ${collapsed ? '' : 'ml-2'}`}
              title="Cerrar Sesión"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

const Layout = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    if (socket) {
      socket.on('newSale', (sale) => {
        toast.success(`Nueva venta realizada por $${sale.total.toFixed(2)}`, {
          icon: '🛒'
        })
      })

      socket.on('stockUpdated', () => {
        // Force refresh if needed
      })

      return () => {
        socket.off('newSale')
        socket.off('stockUpdated')
      }
    }
  }, [socket])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
