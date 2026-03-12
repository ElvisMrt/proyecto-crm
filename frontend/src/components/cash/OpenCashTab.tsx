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
          const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}/api/v1`;
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
    <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="mb-3 flex items-center text-sm font-medium text-slate-800 dark:text-slate-200">
        <HiOfficeBuilding className="w-4 h-4 mr-2" />
        Tus Cajas Abiertas ({userOpenCashRegisters.length})
      </h3>
      <div className="space-y-2">
        {userOpenCashRegisters.map((cash) => (
          <div key={cash.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{cash.branch?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Balance: {formatCurrency(cash.currentBalance || 0)} | 
                Abierta: {new Date(cash.openedAt).toLocaleString('es-DO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">Abierta</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
        Puedes abrir otra caja siempre que no tengas una abierta en la misma sucursal.
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-6 text-lg font-semibold text-slate-950 dark:text-white">Abrir caja</h2>
        
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <HiUser className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Usuario actual</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'N/A'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
            </div>
          </div>
        </div>
        
        {userCashSection}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sucursal */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
              <HiOfficeBuilding className="w-4 h-4 mr-1" />
              Sucursal *
            </label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              disabled={branches.length === 0}
              className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800 ${
                branches.length === 0 ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''
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
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  ⚠️ No hay sucursales disponibles
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Para abrir caja, primero debe crear al menos una sucursal en Configuración.
                </p>
              </div>
            )}
            {branches.length > 0 && form.branchId && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ✓ Sucursal seleccionada: {branches.find(b => b.id === form.branchId)?.name}
              </p>
            )}
          </div>

          {/* Monto Inicial */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Efectivo físico con el que inicia la jornada
            </p>
            {form.initialAmount > 0 && (
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {formatCurrency(form.initialAmount)}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
              <HiDocumentText className="w-4 h-4 mr-1" />
              Observaciones
            </label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading || Boolean(form.branchId && hasOpenCashForBranch(form.branchId))}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </form>
      </div>

      <div className="space-y-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-900 dark:text-white">
            <HiDocumentText className="w-5 h-5 mr-2" />
            Antes de abrir
          </h3>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start">
              <span className="mr-2 font-bold text-slate-500 dark:text-slate-400">•</span>
              <span>Se pueden abrir múltiples cajas por sucursal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold text-slate-500 dark:text-slate-400">•</span>
              <span>Cada usuario solo puede tener una caja abierta por sucursal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold text-slate-500 dark:text-slate-400">•</span>
              <span>No se pueden registrar ventas sin caja abierta</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold text-slate-500 dark:text-slate-400">•</span>
              <span>La apertura queda registrada y auditada con tu usuario</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold text-slate-500 dark:text-slate-400">•</span>
              <span>El monto inicial debe ser el efectivo físico disponible</span>
            </li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Flujo de trabajo</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">1</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Seleccionar sucursal</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Elige la sucursal donde trabajarás</p>
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
