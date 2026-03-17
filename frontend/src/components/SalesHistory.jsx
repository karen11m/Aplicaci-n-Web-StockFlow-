import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  FaSearch, FaFilter, FaEye, FaTimes, FaShoppingBag
} from 'react-icons/fa'
import { MdCancel } from 'react-icons/md'

const SaleDetailModal = ({ sale, onClose, onCancel }) => {
  if (!sale) return null

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Venta #{sale._id.slice(-6)}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {new Date(sale.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium text-gray-800 dark:text-white">{sale.sellerName}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {sale.customer?.name || 'Cliente Mostrador'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium text-gray-800 dark:text-white capitalize">{sale.paymentMethod}</p>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Productos</h3>
          <div className="space-y-2 mb-6">
            {sale.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.status !== 'cancelada' && (
            <button
              onClick={() => onCancel(sale._id)}
              className="w-full mt-6 neo-button bg-red-500 text-white flex items-center justify-center gap-2"
            >
              <MdCancel /> Cancelar Venta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const SalesHistory = () => {
  const { axiosAuth, isAdmin } = useAuth()
  const { socket } = useSocket()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)

  const fetchSales = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const { data } = await axiosAuth.get(`/sales?${params}`)
      setSales(data.sales)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [filters.startDate, filters.endDate])

  useEffect(() => {
    if (socket) {
      socket.on('newSale', () => {
        fetchSales(pagination.page)
      })
      socket.on('saleCancelled', () => {
        fetchSales(pagination.page)
      })
      return () => {
        socket.off('newSale')
        socket.off('saleCancelled')
      }
    }
  }, [socket, pagination.page])

  const handleCancelSale = async (saleId) => {
    if (!confirm('¿Estás seguro de cancelar esta venta?')) return

    try {
      await axiosAuth.put(`/sales/${saleId}/cancel`)
      toast.success('Venta cancelada')
      setSelectedSale(null)
      fetchSales(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar venta')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', search: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Historial de Ventas</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total} ventas registradas</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="neo-input pl-12"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`neo-button flex items-center gap-2 ${showFilters ? 'bg-primary-500 text-white' : ''}`}
          >
            <FaFilter /> Filtros
          </button>

          {(filters.startDate || filters.endDate) && (
            <button onClick={clearFilters} className="neo-button text-red-500">
              Limpiar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Fecha desde</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : sales.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No hay ventas</h3>
          <p className="text-gray-500 mt-2">Intenta con otros filtros</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Vendedor</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="font-mono text-xs">#{sale._id.slice(-6)}</td>
                    <td>{sale.customer?.name || 'Cliente Mostrador'}</td>
                    <td>
                      <span className="badge badge-info">
                        {sale.items?.length || 0} items
                      </span>
                    </td>
                    <td className="font-semibold text-green-600">{formatCurrency(sale.total)}</td>
                    <td>{sale.seller?.name || sale.sellerName}</td>
                    <td>
                      <span className={`badge ${sale.status === 'completada' ? 'badge-success' : 'badge-danger'}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-xs">
                      {new Date(sale.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchSales(page)}
                  className={`w-10 h-10 rounded-lg ${
                    page === pagination.page
                      ? 'bg-primary-500 text-white'
                      : 'glass-card hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onCancel={handleCancelSale}
        />
      )}
    </div>
  )
}

export default SalesHistory
