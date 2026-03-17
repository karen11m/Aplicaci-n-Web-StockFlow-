import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaBarcode, FaImage, FaFilter,
  FaBoxOpen, FaExclamationTriangle
} from 'react-icons/fa'

const ProductModal = ({ product, onClose, onSave, categories }) => {
  const { isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '10',
    barcode: '',
    category: 'General',
    image: ''
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        minStock: product.minStock || '10',
        barcode: product.barcode || '',
        category: product.category || 'General',
        image: product.image || ''
      })
    }
  }, [product])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock)
    })
  }

  if (!isAdmin) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="neo-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="neo-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="neo-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Costo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="neo-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="neo-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="neo-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="neo-input"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagen URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="neo-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="neo-input"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 neo-button bg-primary-500 text-white">
                {product ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
              <button type="button" onClick={onClose} className="neo-button">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const Products = () => {
  const { axiosAuth, isAdmin } = useAuth()
  const { socket } = useSocket()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const fetchProducts = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(lowStockOnly && { lowStock: 'true' })
      })

      const { data } = await axiosAuth.get(`/products?${params}`)
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data } = await axiosAuth.get('/products/categories')
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, categoryFilter, lowStockOnly])

  useEffect(() => {
    if (socket) {
      socket.on('stockUpdated', () => {
        fetchProducts(pagination.page)
      })
      return () => socket.off('stockUpdated')
    }
  }, [socket, pagination.page])

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await axiosAuth.put(`/products/${editingProduct._id}`, productData)
        toast.success('Producto actualizado')
      } else {
        await axiosAuth.post('/products', productData)
        toast.success('Producto creado')
      }
      setShowModal(false)
      setEditingProduct(null)
      fetchProducts(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto')
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return

    try {
      await axiosAuth.delete(`/products/${product._id}`)
      toast.success('Producto eliminado')
      fetchProducts(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar producto')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventario</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total} productos</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowModal(true)
            }}
            className="neo-button bg-primary-500 text-white flex items-center gap-2"
          >
            <FaPlus /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neo-input pl-12"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="neo-input w-40"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`neo-button flex items-center gap-2 ${lowStockOnly ? 'bg-red-500 text-white' : ''}`}
            >
              <FaExclamationTriangle /> Stock Bajo
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FaBoxOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No se encontraron productos</h3>
          <p className="text-gray-500 mt-2">Intenta con otros filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className={`glass-card p-4 transition-all hover:scale-[1.02] ${
                  product.stock < product.minStock ? 'ring-2 ring-red-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaBoxOpen className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {product.stock < product.minStock && (
                    <span className="badge badge-danger text-xs">
                      <FaExclamationTriangle className="mr-1" />
                      Bajo Stock
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-800 dark:text-white mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-primary-600">{formatCurrency(product.price)}</span>
                  <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {product.stock} uds
                  </span>
                </div>

                {product.barcode && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <FaBarcode />
                    <span className="font-mono">{product.barcode}</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setShowModal(true)
                      }}
                      className="flex-1 py-2 px-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchProducts(page)}
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

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
          categories={categories}
        />
      )}
    </div>
  )
}

export default Products
