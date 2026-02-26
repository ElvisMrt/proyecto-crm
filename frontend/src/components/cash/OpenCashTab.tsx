import { useState, useEffect } from 'react';
import { cashApi, branchesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { HiUser, HiOfficeBuilding, HiCurrencyDollar, HiDocumentText } from 'react-icons/hi';

interface OpenCashTabProps {
  onCashOpened: () => void;
  currentCash: any;
}

const OpenCashTab = ({ onCashOpened, currentCash }: OpenCashTabProps) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({
    branchId: '',
    initialAmount: 0,
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  // Ensure currentCash is always an array
  const cashArray = Array.isArray(currentCash) ? currentCash : (currentCash ? [currentCash] : []);
  
  // Check if user already has an open cash register for the selected branch
  const hasOpenCashForBranch = (branchId: string) => {
    return cashArray.some(cash => cash.branch?.id === branchId && cash.openedBy?.id === user?.id);
  };

  // Get user's open cash registers
  const userOpenCashRegisters = cashArray.filter(cash => cash.openedBy?.id === user?.id);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // Intentar primero con /api/v1/branches (sin permisos especiales)
      let branchesData: any[] = [];
      
      try {
        const response = await branchesApi.getBranches();
        branchesData = response?.data || response || [];
      } catch (error: any) {
        // Si falla por permisos, intentar con el endpoint directo
        if (error.response?.status === 403 || error.response?.status === 401) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
          const token = localStorage.getItem('token');
          const directResponse = await fetch(`${API_BASE_URL}/branches`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            branchesData = data?.data || data || [];
          } else {
            throw new Error('No se pudo obtener las sucursales');
          }
        } else {
          throw error;
        }
      }
      
      setBranches(branchesData);
      
      if (branchesData.length > 0) {
        setForm((prev) => ({ ...prev, branchId: branchesData[0].id }));
      } else {
        showToast('No hay sucursales disponibles. Contacte al administrador para crear una.', 'warning');
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setBranches([]);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error al cargar sucursales';
      showToast(errorMessage, 'error');
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

  // Show user's open cash registers and allow opening more
  const userCashSection = userOpenCashRegisters.length > 0 && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
        <HiOfficeBuilding className="w-4 h-4 mr-2" />
        Tus Cajas Abiertas ({userOpenCashRegisters.length})
      </h3>
      <div className="space-y-2">
        {userOpenCashRegisters.map((cash) => (
          <div key={cash.id} className="bg-white rounded p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{cash.branch?.name}</p>
              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(cash.currentBalance || 0)} | 
                Abierta: {new Date(cash.openedAt).toLocaleString('es-DO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Abierta</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-green-700 mt-3">
        Puedes abrir otra caja siempre que no tengas una abierta en la misma sucursal.
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Abrir Caja</h2>
        
        {/* Información del Usuario Actual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <HiUser className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium">Usuario Actual</p>
              <p className="text-sm font-semibold text-gray-900">{user?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
        </div>
        
        {userCashSection}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <HiOfficeBuilding className="w-4 h-4 mr-1" />
              Sucursal *
            </label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              disabled={branches.length === 0}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                branches.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">
                {branches.length === 0 
                  ? 'No hay sucursales disponibles' 
                  : 'Seleccione una sucursal'}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {branches.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800 font-medium">
                  ⚠️ No hay sucursales disponibles
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Para abrir caja, primero debe crear al menos una sucursal en Configuración.
                </p>
              </div>
            )}
            {branches.length > 0 && form.branchId && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Sucursal seleccionada: {branches.find(b => b.id === form.branchId)?.name}
              </p>
            )}
          </div>

          {/* Monto Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <HiCurrencyDollar className="w-4 h-4 mr-1" />
              Monto Inicial (RD$) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.initialAmount}
              onChange={(e) => setForm({ ...form, initialAmount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Efectivo físico con el que inicia la jornada
            </p>
            {form.initialAmount > 0 && (
              <p className="mt-1 text-sm font-semibold text-green-600">
                {formatCurrency(form.initialAmount)}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <HiDocumentText className="w-4 h-4 mr-1" />
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
            disabled={loading || Boolean(form.branchId && hasOpenCashForBranch(form.branchId))}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </form>
      </div>

      {/* Información y Flujo */}
      <div className="space-y-6">
        {/* Información */}
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HiDocumentText className="w-5 h-5 mr-2" />
            Información Importante
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">✓</span>
              <span>Se pueden abrir múltiples cajas por sucursal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">✓</span>
              <span>Cada usuario solo puede tener una caja abierta por sucursal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">✓</span>
              <span>No se pueden registrar ventas sin caja abierta</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">✓</span>
              <span>La apertura queda registrada y auditada con tu usuario</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">✓</span>
              <span>El monto inicial debe ser el efectivo físico disponible</span>
            </li>
          </ul>
        </div>

        {/* Flujo de Trabajo */}
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flujo de Trabajo</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Seleccionar Sucursal</p>
                <p className="text-xs text-gray-600">Elige la sucursal donde trabajarás</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ingresar Monto Inicial</p>
                <p className="text-xs text-gray-600">Cuenta el efectivo físico disponible</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Abrir Caja</p>
                <p className="text-xs text-gray-600">Confirma la apertura para comenzar a operar</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Operar</p>
                <p className="text-xs text-gray-600">Realiza ventas y movimientos normalmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenCashTab;

