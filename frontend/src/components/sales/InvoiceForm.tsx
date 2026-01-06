import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { salesApi, clientsApi, inventoryApi, branchesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';

interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    type: 'FISCAL' as 'FISCAL' | 'NON_FISCAL',
    paymentMethod: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT' | 'MIXED',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    branchId: '',
    observations: '',
    discount: 0,
    items: [] as InvoiceItem[],
  });

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchBranches();
    if (isEditing) {
      fetchInvoice();
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

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const invoice = await salesApi.getInvoice(id);
      setForm({
        clientId: invoice.clientId || '',
        type: invoice.type,
        paymentMethod: invoice.paymentMethod,
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        branchId: invoice.branchId || '',
        observations: invoice.observations || '',
        discount: Number(invoice.discount),
        items: invoice.items.map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.price),
          discount: Number(item.discount),
          subtotal: Number(item.subtotal),
        })),
      });
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
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
      const newItem: InvoiceItem = {
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
    const newItem: InvoiceItem = {
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalcular subtotal
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
    const tax = form.type === 'FISCAL' ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.items.length === 0) {
      showToast('Debe agregar al menos un item', 'error');
      return;
    }

    if (form.type === 'FISCAL' && !form.clientId) {
      showToast('Las facturas fiscales requieren un cliente', 'error');
      return;
    }

    try {
      setLoading(true);
      const invoiceData = {
        clientId: form.clientId || undefined,
        type: form.type,
        paymentMethod: form.paymentMethod,
        issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : undefined,
        dueDate: form.paymentMethod === 'CREDIT' && form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        items: form.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        discount: form.discount,
        observations: form.observations || undefined,
        saveAsDraft: false,
      };

      if (isEditing) {
        await salesApi.updateInvoice(id!, invoiceData);
        showToast('Factura actualizada exitosamente', 'success');
        navigate('/sales');
      } else {
        await salesApi.createInvoice(invoiceData);
        showToast('Factura creada exitosamente', 'success');
        navigate('/sales');
      }
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al guardar la factura';
      
      // Show more detailed error for stock issues
      if (error.response?.data?.error?.code === 'INSUFFICIENT_STOCK') {
        const errorData = error.response.data.error;
        showToast(
          `Stock insuficiente: ${errorData.product?.name || 'Producto'} - Disponible: ${errorData.availableStock?.toFixed(2) || 0}, Solicitado: ${errorData.requestedQuantity?.toFixed(2) || 0}`,
          'error'
        );
      } else {
        showToast(errorMessage, 'error');
      }
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
          {isEditing ? 'Editar Factura' : 'Nueva Factura'}
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
                Cliente {form.type === 'FISCAL' && <span className="text-red-500">*</span>}
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required={form.type === 'FISCAL'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión *</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Factura *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'FISCAL' | 'NON_FISCAL' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="FISCAL">Fiscal</option>
                <option value="NON_FISCAL">No Fiscal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CREDIT">Crédito</option>
                <option value="MIXED">Mixto</option>
              </select>
            </div>
            {form.paymentMethod === 'CREDIT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required={form.paymentMethod === 'CREDIT'}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
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
              {form.type === 'FISCAL' && (
                <div className="flex justify-between text-sm">
                  <span>ITBIS (18%):</span>
                  <span>{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
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
          {!isEditing && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (form.items.length === 0) {
                  showToast('Debe agregar al menos un item', 'error');
                  return;
                }
                try {
                  setLoading(true);
                  const invoiceData = {
                    ...form,
                    clientId: form.clientId || undefined,
                    type: form.type,
                    paymentMethod: form.paymentMethod,
                    dueDate: form.paymentMethod === 'CREDIT' && form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
                    items: form.items.map((item) => ({
                      productId: item.productId,
                      description: item.description,
                      quantity: item.quantity,
                      price: item.price,
                      discount: item.discount,
                    })),
                    discount: form.discount,
                    observations: form.observations || undefined,
                    saveAsDraft: true,
                  };
                  await salesApi.createInvoice(invoiceData);
                  showToast('Borrador guardado exitosamente', 'success');
                  navigate('/sales');
                } catch (error: any) {
                  console.error('Error saving draft:', error);
                  const errorMessage = error.response?.data?.error?.message || 'Error al guardar el borrador';
                  if (error.response?.data?.error?.code === 'INSUFFICIENT_STOCK') {
                    const errorData = error.response.data.error;
                    showToast(
                      `Stock insuficiente: ${errorData.product?.name || 'Producto'} - Disponible: ${errorData.availableStock?.toFixed(2) || 0}, Solicitado: ${errorData.requestedQuantity?.toFixed(2) || 0}`,
                      'error'
                    );
                  } else {
                    showToast(errorMessage, 'error');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || form.items.length === 0}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || form.items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Emitir Factura'}
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

export default InvoiceForm;


