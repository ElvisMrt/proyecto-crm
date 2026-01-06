import { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

interface AdjustmentsTabProps {
  onAdjustmentCreated: () => void;
}

const AdjustmentsTab = ({ onAdjustmentCreated }: AdjustmentsTabProps) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({
    branchId: '',
    type: 'ENTRY' as 'ENTRY' | 'EXIT',
    reason: '',
    observations: '',
    items: [] as Array<{ productId: string; adjustmentQuantity: number }>,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);

  const fetchBranches = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBranches(response.data?.data || response.data || []);
      if (response.data?.data && response.data.data.length > 0) {
        setForm({ ...form, branchId: response.data.data[0].id });
      } else if (response.data && response.data.length > 0) {
        setForm({ ...form, branchId: response.data[0].id });
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ limit: 100, isActive: 'true' });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddItem = (productId: string) => {
    if (form.items.find((item) => item.productId === productId)) {
      showToast('El producto ya está en la lista', 'error');
      return;
    }
    setForm({
      ...form,
      items: [...form.items, { productId, adjustmentQuantity: 1 }],
    });
  };

  const handleRemoveItem = (productId: string) => {
    setForm({
      ...form,
      items: form.items.filter((item) => item.productId !== productId),
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setForm({
      ...form,
      items: form.items.map((item) =>
        item.productId === productId ? { ...item, adjustmentQuantity: quantity } : item
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.branchId) {
      showToast('Seleccione una sucursal', 'error');
      return;
    }

    if (!form.reason.trim()) {
      showToast('El motivo es obligatorio', 'error');
      return;
    }

    if (form.items.length === 0) {
      showToast('Agregue al menos un producto', 'error');
      return;
    }

    try {
      setLoading(true);
      await inventoryApi.createAdjustment(form);
      showToast('Ajuste registrado exitosamente', 'success');
      setForm({
        branchId: branches.length > 0 ? branches[0].id : '',
        type: 'ENTRY',
        reason: '',
        observations: '',
        items: [],
      });
      onAdjustmentCreated();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al registrar el ajuste', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Ajuste de Inventario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'ENTRY' | 'EXIT' })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Salida</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describa el motivo del ajuste..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Productos</label>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => handleAddItem(product.id)}
                >
                  <div>
                    <div className="text-sm font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.code}</div>
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {form.items.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Productos a Ajustar</label>
              <div className="space-y-2">
                {form.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{product?.name}</div>
                        <div className="text-xs text-gray-500">{product?.code}</div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.adjustmentQuantity}
                        onChange={(e) =>
                          handleQuantityChange(item.productId, parseInt(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm mr-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Ajuste'}
          </button>
        </form>
      </div>

      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Los ajustes requieren motivo obligatorio</li>
          <li>• Impactan el stock inmediatamente</li>
          <li>• Quedan auditados con usuario y fecha</li>
          <li>• Requieren permiso especial</li>
        </ul>
      </div>
    </div>
  );
};

export default AdjustmentsTab;


