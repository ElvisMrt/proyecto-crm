import { useState } from 'react';
import { cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface CloseCashTabProps {
  currentCash: any;
  onCashClosed: () => void;
}

const CloseCashTab = ({ currentCash, onCashClosed }: CloseCashTabProps) => {
  const { showToast } = useToast();
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
    const confirmMessage = difference !== 0
      ? `Hay una diferencia de ${formatCurrency(Math.abs(difference))}. ¿Desea continuar con el cierre?`
      : '¿Está seguro de cerrar la caja?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

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
  };

  if (!currentCash) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Hay Caja Abierta</h2>
        <p className="text-gray-600">
          Debe abrir la caja primero para poder cerrarla
        </p>
      </div>
    );
  }

  const expectedBalance = calculateExpectedBalance();
  const difference = calculateDifference();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cerrar Caja</h2>

        {/* Resumen Automático */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen de la Jornada</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto Inicial:</span>
              <span className="text-sm font-medium">{formatCurrency(currentCash.initialAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Ingresos:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(currentCash.summary?.totalIncome || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Egresos:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(currentCash.summary?.totalExpenses || 0)}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Balance Esperado:</span>
                <span className="text-sm font-bold text-lg">{formatCurrency(expectedBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto Contado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Contado Físicamente (RD$) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.countedAmount}
              onChange={(e) => setForm({ ...form, countedAmount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingrese el monto de efectivo que cuenta físicamente en caja
            </p>
          </div>

          {/* Diferencia */}
          {form.countedAmount > 0 && (
            <div className={`rounded-lg p-4 ${
              difference === 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                <span className={`text-lg font-bold ${
                  difference === 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
              </div>
              {difference !== 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {difference > 0 ? 'Sobrante' : 'Faltante'}
                </p>
              )}
            </div>
          )}

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
              placeholder="Notas sobre el cierre, diferencias, etc. (opcional)"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
              difference === 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {loading ? 'Cerrando...' : difference === 0 ? 'Cerrar Caja (Cuadrada)' : 'Cerrar Caja (Con Diferencia)'}
          </button>
        </form>
      </div>

      {/* Información */}
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Una caja cerrada no se puede modificar</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Las diferencias quedan registradas para auditoría</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Requiere permiso de cierre</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Cuente físicamente el efectivo antes de cerrar</span>
            </li>
          </ul>
        </div>

        {/* Detalle de Movimientos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Tipo</h3>
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
                  <span className="text-gray-600">{labels[type] || type}:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
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


