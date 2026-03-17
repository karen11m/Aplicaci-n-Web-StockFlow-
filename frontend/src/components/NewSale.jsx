import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  FaSearch, FaPlus, FaTrash, FaShoppingCart, FaBarcode, FaUser, FaMoneyBill
} from 'react-icons/fa'

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
    <div className="flex-1">
      <h4 className="font-medium text-gray-800 dark:text-white">{item.name}</h4>
      <p className="text-sm text-gray-500">${item.price.toFixed(2)} c/u</p>
    </div>
    
    <div className="flex items-center gap-2">
      <button
        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
      >
        -
      </button>
      <span className="w-12 text-center font-medium">{item.quantity}</span>
      <button
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        disabled={item.quantity >= item.stock}
        className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center disabled:opacity-50"
      >
        +
      </button>
    </div>

    <div className="w-24 text-right font-semibold text-gray-800 dark:text-white">
      ${(item.price * item.quantity).toFixed(2)}
    </div>

    <button
      onClick={() => onRemove(item.id)}
      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
    >
      <FaTrash />
    </button>
  </div>
)

const NewSale = () => {
  const { axiosAuth, user } = useAuth()
  const { socket } = useSocket()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [processing, setProcessing] = useState(false)
  const [showCustomer, setShowCustomer] = useState(false)
  const searchRef = useRef(null)

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data } = await axiosAuth.get(`/products?search=${query}&limit=10`)
      setSearchResults(data.products.filter(p => p.stock > 0))
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(search)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product._id)
    
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Stock insuficiente')
        return
      }
      setCart(cart.map(item =>
        item.id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: 1
      }])
    }
    
    setSearch('')
    setSearchResults([])
    searchRef.current?.focus()
  }

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      const item = cart.find(i => i.id === id)
      if (quantity > item.stock) {
        toast.error('Stock insuficiente')
        return
      }
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal

  const handleSale = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito')
      return
    }

    setProcessing(true)
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        customer: customer.name ? customer : null,
        paymentMethod,
        discount: 0
      }

      const { data } = await axiosAuth.post('/sales', saleData)
      
      toast.success('Venta completada!')
      
      setCart([])
      setCustomer({ name: '', email: '', phone: '' })
      setShowCustomer(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar venta')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Nueva Venta</h1>
        <p className="text-gray-500 dark:text-gray-400">Atiende a tu cliente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Buscar Productos
            </h2>
            
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="neo-input pl-12"
                autoFocus
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-10">
                  {searchResults.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-800 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.barcode && <span className="mr-3"><FaBarcode className="inline mr-1" />{product.barcode}</span>}
                          Stock: {product.stock}
                        </p>
                      </div>
                      <span className="font-bold text-primary-600">${product.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {cart.length > 0 ? (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                <FaShoppingCart className="inline mr-2" />
                Carrito de Compras
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <FaShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Carrito vacío</h3>
              <p className="text-gray-500 mt-2">Busca y agrega productos</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Resumen</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCustomer(!showCustomer)}
              className="w-full neo-button mb-3 flex items-center justify-center gap-2"
            >
              <FaUser /> {customer.name || 'Agregar Cliente'}
            </button>

            {showCustomer && (
              <div className="space-y-3 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="neo-input text-sm"
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="neo-input text-sm"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="neo-input text-sm"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="neo-input"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>

            <button
              onClick={handleSale}
              disabled={cart.length === 0 || processing}
              className="w-full neo-button bg-green-500 text-white text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaMoneyBill /> Cobrar ${total.toFixed(2)}
                </span>
              )}
            </button>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Vendedor: <span className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewSale
