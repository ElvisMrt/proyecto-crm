import { useState, useEffect } from 'react';
import { salesApi, inventoryApi, clientsApi, cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiSearch } from 'react-icons/hi';

interface Product {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  stock?: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

const POSTab = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [includeTax, setIncludeTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashStatus, setCashStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchClients();
    checkCashStatus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Nueva venta (limpiar carrito)
      if (e.key === 'F1') {
        e.preventDefault();
        setCart([]);
        setSelectedClient('');
        setIncludeTax(false);
        showToast('Carrito limpiado', 'info');
      }
      // F2: Focus en búsqueda
      else if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar producto"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Enter: Si hay productos en carrito, procesar venta. Si no, agregar producto seleccionado
      else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }
      // Esc: Limpiar búsqueda o cancelar
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSearch('');
        const searchInput = document.querySelector('input[placeholder*="Buscar producto"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ isActive: true, limit: 200 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 100, isActive: true });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const checkCashStatus = async () => {
    try {
      const response = await cashApi.getCurrentCash();
      setCashStatus(response);
    } catch (error) {
      console.error('Error checking cash status:', error);
      setCashStatus(null);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price - item.discount,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          price: Number(product.salePrice),
          discount: 0,
          subtotal: Number(product.salePrice),
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId));
      return;
    }
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.price - item.discount }
          : item
      )
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, discount: Math.max(0, discount), subtotal: item.quantity * item.price - Math.max(0, discount) }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateTax = () => {
    if (!includeTax) return 0;
    return calculateTotal() * 0.18;
  };

  const calculateFinalTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && !cashStatus) {
      showToast('La caja debe estar abierta para realizar ventas en efectivo', 'error');
      return;
    }

    try {
      setLoading(true);

      const requestData: any = {
        type: includeTax ? 'FISCAL' : 'NON_FISCAL',
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          description: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        discount: 0,
      };

      // Solo incluir clientId si hay un cliente seleccionado
      if (selectedClient) {
        requestData.clientId = selectedClient;
      }

      await salesApi.createPOSSale(requestData);

      showToast('Venta realizada exitosamente', 'success');
      setCart([]);
      setSelectedClient('');
      setIncludeTax(false);
      checkCashStatus();
    } catch (error: any) {
      console.error('Error creating POS sale:', error);
      showToast(error.response?.data?.error?.message || 'Error al procesar la venta', 'error');
    } finally {
      setLoading(false);
    }
  };


  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Atajos de teclado - Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Atajos de teclado:</strong> F1 (Nueva venta) | F2 (Buscar) | Enter (Cobrar) | Esc (Cancelar)
      </div>

      {/* Estado de Caja */}
      {paymentMethod === 'CASH' && (
        <div className={`rounded-lg shadow p-4 ${cashStatus ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Estado de Caja: {cashStatus ? 'Abierta' : 'Cerrada'}
              </p>
              {cashStatus && (
                <p className="text-sm text-gray-600 mt-1">
                  Sucursal: {cashStatus.branch?.name || '-'} | 
                  Inicial: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(cashStatus.initialAmount || 0))}
                </p>
              )}
            </div>
            {!cashStatus && (
              <button
                onClick={() => window.location.href = '/cash'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Abrir Caja
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Productos</h2>
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar producto por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <div className="font-medium text-sm">{product.code}</div>
              <div className="text-xs text-gray-600 mt-1">{product.name}</div>
              <div className="text-sm font-bold text-blue-600 mt-2">
                RD$ {Number(product.salePrice).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
        </div>

        {/* Carrito */}
        <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Carrito</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente <span className="text-gray-500 text-xs font-normal">(Opcional)</span>
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar cliente (opcional)</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.identification ? `- ${client.identification}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Incluir ITBIS (18%)
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="MIXED">Mixto</option>
          </select>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Carrito vacío</p>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="p-2 bg-gray-50 rounded mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-500">RD$ {item.price.toLocaleString()} c/u</div>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.productId, 0)}
                      className="text-red-600 hover:text-red-800 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Cantidad</label>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 text-sm border border-gray-300 rounded text-center"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Descuento</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm font-bold text-blue-600 w-full text-right">
                        RD$ {item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">RD$ {calculateTotal().toLocaleString()}</span>
          </div>
          {calculateTotalDiscount() > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Descuentos:</span>
              <span>-RD$ {calculateTotalDiscount().toLocaleString()}</span>
            </div>
          )}
          {includeTax && (
            <div className="flex justify-between text-sm">
              <span>ITBIS (18%):</span>
              <span className="font-medium">RD$ {calculateTax().toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>RD$ {calculateFinalTotal().toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || cart.length === 0 || (paymentMethod === 'CASH' && !cashStatus)}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Procesar Venta'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default POSTab;


