import { useState, useEffect } from 'react';
import { cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

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
      await cashApi.createMovement(form);
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
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Caja Cerrada</h2>
        <p className="text-gray-600">
          Debe abrir la caja primero para registrar movimientos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón para agregar movimiento */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Movimientos de Caja</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Movimiento'}
        </button>
      </div>

      {/* Formulario de Movimiento */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Movimiento Manual</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MANUAL_ENTRY">Entrada (Ingreso)</option>
                  <option value="MANUAL_EXIT">Salida (Egreso)</option>
                </select>
              </div>

              {/* Método */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método *</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
            </div>

            {/* Concepto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
              <input
                type="text"
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Pago de servicios, Retiro de efectivo, etc."
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (RD$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            {/* Botones */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar Movimiento'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.movementDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTypeColor(movement.type)}`}>
                        {getTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.concept}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.method === 'CASH' ? 'Efectivo' : 'Transferencia'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(movement.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
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


