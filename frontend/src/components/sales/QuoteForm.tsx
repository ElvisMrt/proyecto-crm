import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { salesApi, clientsApi, inventoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';

interface QuoteItem {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    validUntil: '',
    observations: '',
    discount: 0,
    items: [] as QuoteItem[],
  });

  useEffect(() => {
    fetchClients();
    fetchProducts();
    if (isEditing) {
      fetchQuote();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ isActive: true, limit: 200 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchQuote = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const quote = await salesApi.getQuote(id);
      setForm({
        clientId: quote.clientId || '',
        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
        observations: quote.observations || '',
        discount: Number(quote.discount),
        items: quote.items.map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.price),
          discount: Number(item.discount),
          subtotal: Number(item.subtotal),
        })),
      });
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la cotización', 'error');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: any) => {
    const existingItem = form.items.find((item) => item.productId === product.id);
    
    if (existingItem) {
      updateItemQuantity(existingItem.productId!, existingItem.quantity + 1);
    } else {
      const newItem: QuoteItem = {
        productId: product.id,
        description: product.name,
        quantity: 1,
        price: Number(product.salePrice),
        discount: 0,
        subtotal: Number(product.salePrice),
      };
      setForm({ ...form, items: [...form.items, newItem] });
    }
    setShowProductPicker(false);
    setProductSearch('');
  };

  const addManualItem = () => {
    const newItem: QuoteItem = {
      description: '',
      quantity: 1,
      price: 0,
      discount: 0,
      subtotal: 0,
    };
    setForm({ ...form, items: [...form.items, newItem] });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'price' || field === 'discount') {
      const item = updatedItems[index];
      item.subtotal = (item.quantity * item.price) - item.discount;
    }
    
    setForm({ ...form, items: updatedItems });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const updatedItems = form.items.map((item) => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, quantity);
        return {
          ...item,
          quantity: newQuantity,
          subtotal: (newQuantity * item.price) - item.discount,
        };
      }
      return item;
    });
    setForm({ ...form, items: updatedItems });
  };

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, item) => sum + item.subtotal, 0) - form.discount;
    const tax = subtotal * 0.18; // 18% ITBIS (solo para referencia)
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.items.length === 0) {
      showToast('Debe agregar al menos un item', 'error');
      return;
    }

    try {
      setLoading(true);
      const quoteData = {
        clientId: form.clientId || undefined,
        items: form.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        discount: form.discount,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        observations: form.observations || undefined,
      };

      if (isEditing) {
        await salesApi.updateQuote(id!, quoteData);
        showToast('Cotización actualizada exitosamente', 'success');
        navigate('/sales');
      } else {
        await salesApi.createQuote(quoteData);
        showToast('Cotización creada exitosamente', 'success');
        navigate('/sales');
      }
    } catch (error: any) {
      console.error('Error saving quote:', error);
      showToast(error.response?.data?.error?.message || 'Error al guardar la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const { subtotal, tax, total } = calculateTotals();

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
        </h2>
        <button
          onClick={() => navigate('/sales')}
          className="text-gray-600 hover:text-gray-900"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-gray-500 text-xs font-normal">(Opcional)</span>
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar cliente (opcional)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Válida hasta <span className="text-gray-500 text-xs font-normal">(Opcional)</span>
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Agregar Producto
              </button>
              <button
                type="button"
                onClick={addManualItem}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Item Manual
              </button>
            </div>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay items agregados. Agregue productos o items manuales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(item.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Descuento Global:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>ITBIS (18% - Referencia):</span>
                <span>{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Estimado:</span>
                <span>{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || form.items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cotización'}
          </button>
        </div>
      </form>

      {/* Modal de Selección de Productos */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowProductPicker(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Seleccionar Producto</h3>
                  <button onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-500">
                    <HiX className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Buscar producto por código o nombre..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="font-medium text-sm">{product.code}</div>
                        <div className="text-xs text-gray-600 mt-1">{product.name}</div>
                        <div className="text-sm font-bold text-blue-600 mt-2">
                          {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(product.salePrice))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteForm;
