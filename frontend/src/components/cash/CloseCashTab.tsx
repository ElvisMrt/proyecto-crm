import { useState } from 'react';
import { cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiLockClosed, HiCurrencyDollar, HiInformationCircle, HiCheckCircle, HiXCircle } from 'react-icons/hi';

interface CloseCashTabProps {
  currentCash: any;
  onCashClosed: () => void;
}

const CloseCashTab = ({ currentCash, onCashClosed }: CloseCashTabProps) => {
  const { showToast, showConfirm } = useToast();
  const [form, setForm] = useState({
    countedAmount: 0,
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateExpectedBalance = () => {
    if (!currentCash) return 0;
    return currentCash.currentBalance || 0;
  };

  const calculateDifference = () => {
    const expected = calculateExpectedBalance();
    const counted = form.countedAmount;
    return counted - expected;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCash) {
      showToast('No hay caja abierta para cerrar', 'error');
      return;
    }

    if (form.countedAmount < 0) {
      showToast('El monto contado no puede ser negativo', 'error');
      return;
    }

    const difference = calculateDifference();
    const confirmTitle = difference !== 0 ? 'Cerrar Caja con Diferencia' : 'Cerrar Caja';
    const confirmMessage = difference !== 0
      ? `Hay una diferencia de ${formatCurrency(Math.abs(difference))}. ¿Desea continuar con el cierre?`
      : '¿Está seguro de cerrar la caja?';

    showConfirm(
      confirmTitle,
      confirmMessage,
      async () => {
    try {
      setLoading(true);
      await cashApi.closeCash({
        cashRegisterId: currentCash.id,
        countedAmount: form.countedAmount,
        observations: form.observations || undefined,
      });
      showToast('Caja cerrada exitosamente', 'success');
      setForm({
        countedAmount: 0,
        observations: '',
      });
      onCashClosed();
    } catch (error: any) {
      console.error('Error closing cash:', error);
      showToast(error.response?.data?.error?.message || 'Error al cerrar la caja', 'error');
    } finally {
      setLoading(false);
    }
      },
      { type: difference !== 0 ? 'warning' : 'info', confirmText: 'Cerrar Caja', cancelText: 'Cancelar' }
    );
  };

  if (!currentCash) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
          <HiLockClosed className="w-10 h-10 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">No hay caja abierta</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Debe abrir la caja primero para poder cerrarla
        </p>
      </div>
    );
  }

  const expectedBalance = calculateExpectedBalance();
  const difference = calculateDifference();

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_340px]">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 flex items-center text-lg font-semibold text-slate-900 dark:text-white">
          <HiLockClosed className="mr-2 h-5 w-5 text-slate-400" />
          Cerrar caja
        </h2>

        <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Resumen de la jornada</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Monto inicial</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(currentCash.initialAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total ingresos</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(currentCash.summary?.totalIncome || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total egresos</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(currentCash.summary?.totalExpenses || 0)}
              </span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-900 dark:text-white">Balance esperado</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(expectedBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
              <HiCurrencyDollar className="mr-1 h-4 w-4 text-slate-400" />
              Monto Contado Físicamente (RD$) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.countedAmount}
              onChange={(e) => setForm({ ...form, countedAmount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ingrese el monto de efectivo que cuenta físicamente en caja
            </p>
          </div>

          {form.countedAmount > 0 && (
            <div className={`rounded-[24px] border p-4 ${
              difference === 0 
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20' 
                : 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20'
            }`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-200">
                  {difference === 0 ? (
                    <HiCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  ) : (
                    <HiXCircle className="w-5 h-5 mr-2 text-red-600" />
                  )}
                  Diferencia:
                </span>
                <span className={`text-lg font-bold flex items-center ${
                  difference === 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
              </div>
              {difference !== 0 && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {difference > 0 ? 'Sobrante' : 'Faltante'}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Observaciones
            </label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="Notas sobre el cierre, diferencias, etc. (opcional)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              difference === 0
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'bg-amber-600 text-white'
            }`}
          >
            {loading ? 'Cerrando...' : difference === 0 ? 'Cerrar Caja (Cuadrada)' : 'Cerrar Caja (Con Diferencia)'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-900 dark:text-white">
            <HiInformationCircle className="mr-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            Información
          </h3>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start">
              <HiCheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span>Una caja cerrada no se puede modificar</span>
            </li>
            <li className="flex items-start">
              <HiCheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span>Las diferencias quedan registradas para auditoría</span>
            </li>
            <li className="flex items-start">
              <HiCheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span>Requiere permiso de cierre</span>
            </li>
            <li className="flex items-start">
              <HiCheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span>Cuente físicamente el efectivo antes de cerrar</span>
            </li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Resumen por tipo</h3>
          <div className="space-y-2">
            {currentCash.summary?.byType && Object.entries(currentCash.summary.byType).map(([type, amount]: [string, any]) => {
              if (amount === 0) return null;
              const labels: Record<string, string> = {
                OPENING: 'Apertura',
                SALE: 'Ventas',
                PAYMENT: 'Pagos CxC',
                MANUAL_ENTRY: 'Entradas Manuales',
                MANUAL_EXIT: 'Salidas Manuales',
              };
              return (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{labels[type] || type}:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseCashTab;

