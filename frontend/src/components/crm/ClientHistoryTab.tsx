import { useEffect, useState } from 'react';
import { crmApi, clientsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ClientHistoryTab = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchHistory();
    } else {
      setHistory(null);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await crmApi.getClientHistory(selectedClientId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
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
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Vista 360° del Cliente</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Cliente</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Seleccione un cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.identification}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">Cargando...</div>
      )}

      {history && !loading && (
        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{history.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="text-sm font-medium text-gray-900">{history.client.identification}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{history.client.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{history.client.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          {history.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(history.summary.totalSales || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {history.summary.invoiceCount || 0} factura{history.summary.invoiceCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <p className="text-sm font-medium text-gray-600">Balance Pendiente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(history.summary.totalReceivable || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {history.summary.paymentCount || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <p className="text-sm font-medium text-gray-600">Tareas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {history.summary.taskCount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate(`/receivables?clientId=${selectedClientId}`)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md"
              >
                💵 Ir a CxC
              </button>
              <button
                onClick={() => navigate(`/sales?clientId=${selectedClientId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md"
              >
                🛒 Nueva Venta
              </button>
              <button
                onClick={() => navigate(`/clients?clientId=${selectedClientId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md"
              >
                👤 Ver Cliente
              </button>
            </div>
          </div>

          {/* Tareas */}
          {history.tasks && history.tasks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas</h3>
              <div className="space-y-3">
                {history.tasks.map((task: any) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {task.dueDate && `Fecha límite: ${formatDate(task.dueDate)}`}
                      {task.completedAt && ` • Completada: ${formatDate(task.completedAt)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facturas Recientes */}
          {history.recentInvoices && history.recentInvoices.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturas Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.recentInvoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(invoice.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'CANCELLED'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientHistoryTab;



