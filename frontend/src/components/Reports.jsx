import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import {
  FaFilePdf, FaFileCsv, FaCalendar, FaChartPie, FaChartBar, FaDownload
} from 'react-icons/fa'

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']

const Reports = () => {
  const { axiosAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [period, setPeriod] = useState('month')

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const { data } = await axiosAuth.get(`/reports/summary?period=${period}`)
      setSummary(data)
    } catch (error) {
      toast.error('Error al cargar resumen')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [period])

  const downloadPDF = async () => {
    try {
      const response = await axiosAuth.get(`/reports/sales/pdf?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ventas_${dateRange.startDate}_${dateRange.endDate}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('PDF descargado')
    } catch (error) {
      toast.error('Error al descargar PDF')
    }
  }

  const downloadProductsCSV = async () => {
    try {
      const response = await axiosAuth.get('/reports/products/csv', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'inventario.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('CSV de productos descargado')
    } catch (error) {
      toast.error('Error al descargar CSV')
    }
  }

  const downloadSalesCSV = async () => {
    try {
      const response = await axiosAuth.get(`/reports/sales/csv?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ventas_${dateRange.startDate}_${dateRange.endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('CSV de ventas descargado')
    } catch (error) {
      toast.error('Error al descargar CSV')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0)
  }

  const categoryData = summary?.categoryStats?.map((cat, index) => ({
    name: cat._id || 'Sin categoría',
    value: cat.totalRevenue,
    quantity: cat.totalSold,
    color: COLORS[index % COLORS.length]
  })) || []

  const topProductsData = summary?.topProducts?.slice(0, 5).map(p => ({
    name: p.name?.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    ventas: p.totalSold,
    ingresos: p.totalRevenue
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400">Análisis y estadísticas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">Ingresos</span>
            <FaChartBar className="text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(summary?.summary?.totalRevenue)}
          </p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">Ventas</span>
            <FaChartPie className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {summary?.summary?.totalSales || 0}
          </p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400">Productos Vendidos</span>
            <FaChartPie className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {summary?.summary?.totalItems || 0}
          </p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Exportar Reportes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Rango de Fechas</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="neo-input text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="neo-input text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Ventas</h3>
            <div className="space-y-2">
              <button
                onClick={downloadPDF}
                className="w-full neo-button bg-red-500 text-white text-sm flex items-center justify-center gap-2"
              >
                <FaFilePdf /> PDF
              </button>
              <button
                onClick={downloadSalesCSV}
                className="w-full neo-button bg-green-500 text-white text-sm flex items-center justify-center gap-2"
              >
                <FaFileCsv /> CSV
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Inventario</h3>
            <button
              onClick={downloadProductsCSV}
              className="w-full neo-button bg-blue-500 text-white text-sm flex items-center justify-center gap-2"
            >
              <FaFileCsv /> Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Top Productos</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="ventas" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Ventas por Categoría</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {summary?.lowStockProducts?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Productos con Stock Bajo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.lowStockProducts.slice(0, 6).map((product) => (
              <div key={product._id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="font-medium text-gray-800 dark:text-white">{product.name}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">Stock: {product.stock}</span>
                  <span className="text-red-500">Mínimo: {product.minStock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
