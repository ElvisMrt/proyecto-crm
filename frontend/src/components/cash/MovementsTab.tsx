import { useState, useEffect } from 'react';
import { cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiPlusCircle, HiLockClosed, HiCurrencyDollar, HiArrowUp, HiArrowDown, HiCash, HiSwitchHorizontal } from 'react-icons/hi';

interface MovementsTabProps {
  currentCash: any;
  onMovementCreated: () => void;
}

const MovementsTab = ({ currentCash, onMovementCreated }: MovementsTabProps) => {
  const { showToast } = useToast();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'MANUAL_ENTRY' as 'MANUAL_ENTRY' | 'MANUAL_EXIT',
    concept: '',
    amount: 0,
    method: 'CASH' as 'CASH' | 'TRANSFER',
    observations: '',
  });

  useEffect(() => {
    if (currentCash) {
      setMovements(currentCash.movements || []);
    }
  }, [currentCash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.concept.trim()) {
      showToast('El concepto es obligatorio', 'error');
      return;
    }

    if (form.amount <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }

    if (!currentCash) {
      showToast('Debe abrir la caja primero', 'error');
      return;
    }

    try {
      setLoading(true);
      await cashApi.createMovement({
        ...form,
        cashRegisterId: currentCash.id,
      });
      showToast('Movimiento registrado exitosamente', 'success');
      setForm({
        type: 'MANUAL_ENTRY',
        concept: '',
        amount: 0,
        method: 'CASH',
        observations: '',
      });
      setShowForm(false);
      onMovementCreated();
    } catch (error: any) {
      console.error('Error creating movement:', error);
      showToast(error.response?.data?.error?.message || 'Error al registrar el movimiento', 'error');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OPENING: 'Apertura',
      SALE: 'Venta',
      PAYMENT: 'Pago CxC',
      MANUAL_ENTRY: 'Entrada Manual',
      MANUAL_EXIT: 'Salida Manual',
      CLOSING: 'Cierre',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    if (type === 'SALE' || type === 'PAYMENT' || type === 'MANUAL_ENTRY' || type === 'OPENING') {
      return 'text-green-600';
    }
    if (type === 'MANUAL_EXIT' || type === 'CLOSING') {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  if (!currentCash) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
          <HiLockClosed className="w-10 h-10 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Caja cerrada</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Debe abrir la caja primero para registrar movimientos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white">
          <HiSwitchHorizontal className="mr-2 h-5 w-5 text-slate-400" />
          Movimientos de caja
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950"
        >
          {showForm ? (
            <>
              <span className="mr-2">Cancelar</span>
            </>
          ) : (
            <>
              <HiPlusCircle className="w-5 h-5 mr-2" />
              Nuevo Movimiento
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Registrar movimiento manual</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  {form.type === 'MANUAL_ENTRY' ? (
                    <HiArrowUp className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <HiArrowDown className="w-4 h-4 mr-1 text-red-600" />
                  )}
                  Tipo *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                >
                  <option value="MANUAL_ENTRY">Entrada (Ingreso)</option>
                  <option value="MANUAL_EXIT">Salida (Egreso)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  <HiCurrencyDollar className="mr-1 h-4 w-4 text-slate-400" />
                  Método *
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Concepto *</label>
              <input
                type="text"
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                placeholder="Ej: Pago de servicios, Retiro de efectivo, etc."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Monto (RD$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
              >
                {loading ? 'Registrando...' : 'Registrar Movimiento'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Método</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-950 dark:divide-slate-800">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(movement.movementDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium flex items-center ${getTypeColor(movement.type)}`}>
                        {movement.type === 'SALE' || movement.type === 'PAYMENT' || movement.type === 'MANUAL_ENTRY' || movement.type === 'OPENING' ? (
                          <HiArrowUp className="w-4 h-4 mr-1" />
                        ) : (
                          <HiArrowDown className="w-4 h-4 mr-1" />
                        )}
                        {getTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {movement.concept}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 flex items-center">
                      {movement.method === 'CASH' ? (
                        <>
                          <HiCash className="w-4 h-4 mr-1 text-slate-400" />
                          Efectivo
                        </>
                      ) : (
                        <>
                          <HiSwitchHorizontal className="w-4 h-4 mr-1 text-slate-400" />
                          Transferencia
                        </>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(movement.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {movement.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {movement.observations || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MovementsTab;
