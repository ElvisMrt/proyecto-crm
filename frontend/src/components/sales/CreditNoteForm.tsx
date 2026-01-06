import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { salesApi, inventoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';

interface CreditNoteItem {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

const CreditNoteForm = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [form, setForm] = useState({
    invoiceId: invoiceId || '',
    reason: '',
    items: [] as CreditNoteItem[],
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
    fetchProducts();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const data = await salesApi.getInvoice(invoiceId);
      setInvoice(data);
      setForm({ ...form, invoiceId: invoiceId });
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
      navigate('/sales');
    } finally {
      setLoading(false);
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

  const addProductFromInvoice = (invoiceItem: any) => {
    const existingItem = form.items.find((item) => item.productId === invoiceItem.productId);
    
    if (existingItem) {
      // Calculate current total credited for this product
      const currentCredited = form.items
        .filter((item) => item.productId === invoiceItem.productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const maxQuantity = Number(invoiceItem.quantity);
      
      if (currentCredited >= maxQuantity) {
        showToast(
          `Ya se ha acreditado la cantidad máxima para este producto (${maxQuantity.toFixed(2)})`,
          'warning'
        );
        return;
      }
      
      updateItemQuantity(existingItem.productId!, existingItem.quantity + 1);
    } else {
      const newItem: CreditNoteItem = {
        productId: invoiceItem.productId,
        description: invoiceItem.description,
        quantity: 1,
        price: Number(invoiceItem.price),
        discount: 0,
        subtotal: Number(invoiceItem.price),
      };
      setForm({ ...form, items: [...form.items, newItem] });
    }
  };

  const addProduct = (product: any) => {
    const existingItem = form.items.find((item) => item.productId === product.id);
    
    if (existingItem) {
      updateItemQuantity(existingItem.productId!, existingItem.quantity + 1);
    } else {
      const newItem: CreditNoteItem = {
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
    const newItem: CreditNoteItem = {
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

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'price' || field === 'discount') {
      const item = updatedItems[index];
      item.subtotal = (item.quantity * item.price) - item.discount;
    }
    
    setForm({ ...form, items: updatedItems });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (!invoice) {
      return;
    }

    // Find the invoice item to get max quantity
    const invoiceItem = invoice.items?.find((item: any) => item.productId === productId);
    if (!invoiceItem) {
      return;
    }

    const maxQuantity = Number(invoiceItem.quantity);
    
    // Calculate total quantity already credited for this product
    const currentCredited = form.items
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Find the item being updated
    const itemToUpdate = form.items.find((item) => item.productId === productId);
    if (!itemToUpdate) {
      return;
    }

    // Calculate new total if we update this item
    const otherItemsQuantity = currentCredited - itemToUpdate.quantity;
    const newTotal = otherItemsQuantity + quantity;
    
    // Limit quantity to max available
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity - otherItemsQuantity));
    
    if (newTotal > maxQuantity) {
      showToast(
        `La cantidad máxima acreditar para este producto es ${maxQuantity.toFixed(2)} (cantidad de la factura original)`,
        'warning'
      );
    }

    const updatedItems = form.items.map((item) => {
      if (item.productId === productId) {
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
    const subtotal = form.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = invoice?.type === 'FISCAL' ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.invoiceId) {
      showToast('Debe seleccionar una factura', 'error');
      return;
    }

    if (!form.reason.trim()) {
      showToast('El motivo es obligatorio', 'error');
      return;
    }

    if (form.items.length === 0) {
      showToast('Debe agregar al menos un item', 'error');
      return;
    }

    // Validate quantities don't exceed invoice quantities
    if (invoice) {
      const invoiceItemsMap = new Map(
        invoice.items?.map((item: any) => [item.productId || item.id, Number(item.quantity)]) || []
      );
      
      const creditedQuantities = new Map<string, number>();
      
      for (const item of form.items) {
        if (item.productId) {
          const invoiceQuantity = invoiceItemsMap.get(item.productId) || 0;
          const currentCredited = creditedQuantities.get(item.productId) || 0;
          const newTotalCredited = currentCredited + item.quantity;
          
          if (newTotalCredited > invoiceQuantity) {
            showToast(
              `La cantidad acreditar para "${item.description}" (${newTotalCredited.toFixed(2)}) excede la cantidad de la factura original (${invoiceQuantity.toFixed(2)})`,
              'error'
            );
            return;
          }
          
          creditedQuantities.set(item.productId, newTotalCredited);
        }
      }
    }

    try {
      setLoading(true);
      const creditNoteData = {
        invoiceId: form.invoiceId,
        reason: form.reason,
        items: form.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
      };

      await salesApi.createCreditNote(creditNoteData);
      showToast('Nota de crédito creada exitosamente', 'success');
      navigate('/sales');
    } catch (error: any) {
      console.error('Error saving credit note:', error);
      showToast(error.response?.data?.error?.message || 'Error al guardar la nota de crédito', 'error');
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

  if (loading && invoiceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nueva Nota de Crédito</h2>
        <button
          onClick={() => navigate('/sales')}
          className="text-gray-600 hover:text-gray-900"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de Factura */}
        {invoice && (
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Factura Asociada</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Número</p>
                <p className="text-lg font-semibold">{invoice.number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="text-lg font-semibold">{invoice.client?.name || 'Sin cliente'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(invoice.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(invoice.balance)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Items de la factura (haga clic para agregar a la nota de crédito):</p>
              <div className="space-y-2">
                {invoice.items?.map((item: any, index: number) => {
                  const creditedQuantity = form.items
                    .filter((ci) => ci.productId === item.productId)
                    .reduce((sum, ci) => sum + ci.quantity, 0);
                  const availableQuantity = Number(item.quantity) - creditedQuantity;
                  const isDisabled = availableQuantity <= 0;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !isDisabled && addProductFromInvoice(item)}
                      disabled={isDisabled}
                      className={`w-full text-left p-3 bg-white rounded border ${
                        isDisabled 
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Cantidad facturada: {Number(item.quantity).toFixed(2)} | 
                            Acreditado: {creditedQuantity.toFixed(2)} | 
                            Disponible: <span className={isDisabled ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                              {availableQuantity.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-medium ml-4">
                          {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(item.subtotal))}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Motivo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Crédito</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa el motivo de la nota de crédito..."
              required
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items a Creditar</h3>
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
              No hay items agregados. Agregue productos de la factura o items manuales.
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
              {invoice?.type === 'FISCAL' && (
                <div className="flex justify-between text-sm">
                  <span>ITBIS (18%):</span>
                  <span>{new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total a Creditar:</span>
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
            disabled={loading || form.items.length === 0 || !form.reason.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Crear Nota de Crédito'}
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

export default CreditNoteForm;
