import { useEffect, useState } from 'react';
import { receivablesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface OverdueInvoice {
  id: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  invoice: {
    id: string;
    number: string;
    ncf: string | null;
    balance: number;
    total: number;
    dueDate: string | null;
    issueDate: string;
    daysOverdue: number;
  };
}

const OverdueInvoicesTab = () => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    days: '',
    search: '',
    clientId: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOverdue = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.days) params.days = filters.days;
      if (filters.search) params.search = filters.search;
      if (filters.clientId) params.clientId = filters.clientId;

      const response = await receivablesApi.getOverdue(params);
      setInvoices(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, [filters.page, filters.days, filters.clientId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
    }
  };

  const getDaysOverdueColor = (days: number) => {
    if (days <= 30) return 'text-orange-600';
    if (days <= 60) return 'text-red-600';
    return 'text-red-800 font-bold';
  };

  const handleCollect = (invoiceId: string, clientId: string) => {
    // Cambiar a la tab de pagos y seleccionar cliente/factura
    // Por ahora, simplemente mostrar un mensaje
    showToast(`Redirigiendo a registro de pagos para factura ${invoiceId}`, 'info');
    // TODO: Implementar navegación entre tabs cuando esté disponible
  };

  const handleCreateTask = (clientId: string, invoiceId: string) => {
    // TODO: Integrar con módulo de CRM para crear tarea
    showToast('Funcionalidad de crear tarea próximamente', 'info');
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Días</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="0-30">0-30 días</option>
              <option value="31-60">31-60 días</option>
              <option value="61-90">61-90 días</option>
              <option value="90+">Más de 90 días</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Cliente, factura, NCF..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchOverdue();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchOverdue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando facturas vencidas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay facturas vencidas</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nro. Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Vencida</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance Pendiente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((item) => (
                    <tr key={item.invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.client.name}</div>
                        {item.client.phone && (
                          <div className="text-xs text-gray-500">{item.client.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.invoice.number}</div>
                        {item.invoice.ncf && (
                          <div className="text-xs text-gray-500">{item.invoice.ncf}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getDaysOverdueColor(item.invoice.daysOverdue)}`}>
                          ⬢ {item.invoice.daysOverdue} día{item.invoice.daysOverdue !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.invoice.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleCollect(item.invoice.id, item.client.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded"
                          >
                            Cobrar
                          </button>
                          <button
                            onClick={() => handleCreateTask(item.client.id, item.invoice.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-1 px-3 rounded"
                          >
                            Tarea de Cobro
                          </button>
                          {item.client.phone && (
                            <a
                              href={`https://wa.me/${item.client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1 px-3 rounded inline-flex items-center"
                            >
                              📞
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} facturas vencidas
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OverdueInvoicesTab;

