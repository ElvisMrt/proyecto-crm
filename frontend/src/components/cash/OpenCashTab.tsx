import { useState, useEffect } from 'react';
import { cashApi } from '../../services/api';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

interface OpenCashTabProps {
  onCashOpened: () => void;
  currentCash: any;
}

const OpenCashTab = ({ onCashOpened, currentCash }: OpenCashTabProps) => {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({
    branchId: '',
    initialAmount: 0,
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
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
      // Si no existe el endpoint, usar lista vacía
      setBranches([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.branchId) {
      showToast('Seleccione una sucursal', 'error');
      return;
    }

    if (form.initialAmount < 0) {
      showToast('El monto inicial no puede ser negativo', 'error');
      return;
    }

    try {
      setLoading(true);
      await cashApi.openCash({
        branchId: form.branchId,
        initialAmount: form.initialAmount,
        observations: form.observations || undefined,
      });
      showToast('Caja abierta exitosamente', 'success');
      setForm({
        branchId: branches.length > 0 ? branches[0].id : '',
        initialAmount: 0,
        observations: '',
      });
      onCashOpened();
    } catch (error: any) {
      console.error('Error opening cash:', error);
      showToast(error.response?.data?.error?.message || 'Error al abrir la caja', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (currentCash) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caja Ya Está Abierta</h2>
          <p className="text-gray-600 mb-4">
            La caja está actualmente abierta en la sucursal <strong>{currentCash.branch?.name}</strong>
          </p>
          <div className="bg-gray-50 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600">Balance Actual</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentCash.currentBalance || 0)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Abrir Caja</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal *
            </label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione una sucursal</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monto Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Inicial (RD$) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.initialAmount}
              onChange={(e) => setForm({ ...form, initialAmount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Efectivo con el que inicia la jornada
            </p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </form>
      </div>

      {/* Información */}
      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Solo puede haber una caja abierta por sucursal</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>No se pueden registrar ventas sin caja abierta</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>La apertura queda registrada y auditada</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>El monto inicial debe ser el efectivo físico disponible</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OpenCashTab;

