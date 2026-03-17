import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import {
  FaBoxes, FaShoppingCart, FaExclamationTriangle, FaArrowUp, FaArrowDown,
  FaDollarSign, FaChartBar
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="stat-card border-l-4" style={{ borderColor: color }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-opacity-20`} style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-3 text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
        {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
        <span>{Math.abs(trend)}% vs semana anterior</span>
      </div>
    )}
  </div>
)

const Dashboard = () => {
  const { axiosAuth } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, salesRes, lowStockRes] = await Promise.all([
        axiosAuth.get('/sales/stats'),
        axiosAuth.get('/sales/recent'),
        axiosAuth.get('/products?lowStock=true')
      ])
      
      setStats(statsRes.data)
      setRecentSales(salesRes.data)
      setLowStockProducts(lowStockRes.data.products || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (socket) {
      socket.on('newSale', () => {
        fetchData()
      })
      socket.on('stockUpdated', () => {
        fetchData()
      })

      return () => {
        socket.off('newSale')
        socket.off('stockUpdated')
      }
    }
  }, [socket])

  const chartData = stats?.dailySales?.map(day => ({
    name: new Date(day._id).toLocaleDateString('es-ES', { weekday: 'short' }),
    ventas: day.count,
    ingresos: day.revenue
  })) || []

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Resumen de tu negocio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Stock Total"
          value={stats?.totalSales || 0}
          subtitle="Productos en inventario"
          icon={FaBoxes}
          color="#0ea5e9"
        />
        <StatCard
          title="Ventas Hoy"
          value={stats?.todaySales || 0}
          subtitle={formatCurrency(stats?.todayRevenue || 0)}
          icon={FaShoppingCart}
          color="#10b981"
        />
        <StatCard
          title="Esta Semana"
          value={stats?.weekSales || 0}
          subtitle={formatCurrency(stats?.weekRevenue || 0)}
          icon={FaChartBar}
          color="#8b5cf6"
        />
        <StatCard
          title="Alertas Stock"
          value={lowStockProducts.length}
          subtitle="Productos bajo mínimo"
          icon={FaExclamationTriangle}
          color="#ef4444"
          onClick={() => navigate('/products?lowStock=true')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Ventas Semanales</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Productos con Stock Bajo</h2>
            <button
              onClick={() => navigate('/products?lowStock=true')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ver todos
            </button>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaBoxes className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">¡Todo bien con el inventario!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                  </div>
                  <span className="badge badge-danger">
                    {product.stock} uds
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Últimas Ventas</h2>
          <button
            onClick={() => navigate('/sales')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Ver historial completo
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Vendedor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No hay ventas aún
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="font-mono text-xs">#{sale._id.slice(-6)}</td>
                    <td>{sale.customer?.name || 'Cliente Mostrador'}</td>
                    <td>
                      <span className="badge badge-info">
                        {sale.items?.length || 0} productos
                      </span>
                    </td>
                    <td className="font-semibold text-green-600">{formatCurrency(sale.total)}</td>
                    <td>{sale.seller?.name || sale.sellerName}</td>
                    <td className="text-xs">
                      {new Date(sale.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
