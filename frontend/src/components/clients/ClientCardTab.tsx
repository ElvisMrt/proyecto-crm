import { useEffect, useState } from 'react';
import { clientsApi, crmApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { HiDocumentText, HiReceiptTax, HiCurrencyDollar, HiPlusCircle } from 'react-icons/hi';

interface ClientCardTabProps {
  clientId: string;
  onEdit: () => void;
}

const ClientCardTab = ({ clientId, onEdit }: ClientCardTabProps) => {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoicesPagination, setInvoicesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [quotesPagination, setQuotesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH', dueDate: '' });
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      if (activeTab === 'invoices') {
        fetchInvoices();
      } else if (activeTab === 'quotes') {
        fetchQuotes();
      } else if (activeTab === 'payments') {
        fetchPayments();
      }
    }
  }, [clientId, activeTab, invoicesPagination.page, quotesPagination.page, paymentsPagination.page]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientsApi.getClient(clientId);
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await clientsApi.getClientInvoices(clientId, {
        page: invoicesPagination.page,
        limit: invoicesPagination.limit,
      });
      setInvoices(data.data || []);
      setInvoicesPagination(data.pagination || invoicesPagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const data = await clientsApi.getClientQuotes(clientId, {
        page: quotesPagination.page,
        limit: quotesPagination.limit,
      });
      setQuotes(data.data || []);
      setQuotesPagination(data.pagination || quotesPagination);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await clientsApi.getClientPayments(clientId, {
        page: paymentsPagination.page,
        limit: paymentsPagination.limit,
      });
      setPayments(data.data || []);
      setPaymentsPagination(data.pagination || paymentsPagination);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      showToast('El título de la tarea es obligatorio', 'error');
      return;
    }

    try {
      await crmApi.createTask({
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
        clientId: clientId,
      });
      showToast('Tarea creada exitosamente', 'success');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al crear la tarea', 'error');
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        Cliente no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Documento: {client.identification}</p>
          </div>
          <div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              client.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {client.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm font-medium text-gray-900">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="text-sm font-medium text-gray-900">{client.phone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Dirección</p>
            <p className="text-sm font-medium text-gray-900">{client.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="text-sm font-medium text-gray-900">
              {client.creditLimit && client.creditLimit > 0 ? 'Crédito' : 'Contado'}
            </p>
          </div>
          {client.creditLimit && client.creditLimit > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-600">Límite de Crédito</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(client.creditLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Días de Crédito</p>
                <p className="text-sm font-medium text-gray-900">{client.creditDays} días</p>
              </div>
            </>
          )}
          <div>
            <p className="text-sm text-gray-600">Fecha de Registro</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Indicadores Rápidos */}
      {client.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(client.summary.totalSales || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {client.summary.invoiceCount || 0} factura{client.summary.invoiceCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Balance Pendiente</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(client.summary.totalReceivable || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cuentas por Cobrar</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {client.summary.paymentCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Registros de pago</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Cotizaciones</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {client.summary.quoteCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cotizaciones creadas</p>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md"
          >
            ✏️ Editar Cliente
          </button>
          <button
            onClick={() => navigate(`/receivables?clientId=${clientId}`)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md"
          >
            💵 Ir a CxC
          </button>
          <button
            onClick={() => navigate(`/sales?clientId=${clientId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md"
          >
            🛒 Nueva Venta
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md inline-flex items-center justify-center"
          >
            <HiPlusCircle className="w-5 h-5 mr-2" />
            Crear Tarea CRM
          </button>
        </div>
      </div>

      {/* Pagos Recientes */}
      {client.recentPayments && client.recentPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos Recientes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {client.recentPayments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Tarea */}
      {showTaskModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          aria-describedby="task-modal-description"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 id="task-modal-title" className="text-lg font-semibold text-gray-900 mb-4">Crear Tarea CRM</h3>
            <p id="task-modal-description" className="sr-only">
              Formulario para crear una nueva tarea CRM relacionada con este cliente.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Seguimiento de pago pendiente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles de la tarea..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Crear Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCardTab;



