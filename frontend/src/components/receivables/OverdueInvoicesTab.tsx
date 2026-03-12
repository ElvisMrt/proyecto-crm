import { useEffect, useState } from 'react';
import { receivablesApi, crmApi, salesApi } from '../../services/api';
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

interface OverdueInvoicesTabProps {
  branchId?: string;
  onNavigateToPayment?: (clientId: string, invoiceIds: string[]) => void;
  onNavigateToStatus?: (clientId: string) => void;
}

const OverdueInvoicesTab = ({ branchId, onNavigateToPayment, onNavigateToStatus }: OverdueInvoicesTabProps) => {
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
      if (branchId) params.branchId = branchId;

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
  }, [filters.page, filters.days, filters.clientId, branchId]);

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
    if (onNavigateToPayment) {
      onNavigateToPayment(clientId, [invoiceId]);
    } else {
      showToast(`Redirigiendo a registro de pagos para factura ${invoiceId}`, 'info');
    }
  };

  const handleViewAccountStatus = (clientId: string) => {
    if (onNavigateToStatus) {
      onNavigateToStatus(clientId);
    }
  };

  const handleCreateTask = async (clientId: string, invoiceId: string) => {
    try {
      // Fetch invoice details to include in task description
      const invoice = await salesApi.getInvoice(invoiceId);
      
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-DO', {
          style: 'currency',
          currency: 'DOP',
          minimumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-DO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      };

      // Calculate days overdue
      const now = new Date();
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const daysOverdue = dueDate && dueDate < now
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Create task title
      const taskTitle = `Cobro - Factura ${invoice.number}${invoice.ncf ? ` (${invoice.ncf})` : ''}`;

      // Create task description with invoice details
      let description = `Tarea de cobro para factura vencida.\n\n`;
      description += `**Información de la Factura:**\n`;
      description += `- Número: ${invoice.number}\n`;
      if (invoice.ncf) {
        description += `- NCF: ${invoice.ncf}\n`;
      }
      description += `- Cliente: ${invoice.client?.name || 'Sin cliente'}\n`;
      description += `- Fecha de Emisión: ${formatDate(invoice.issueDate)}\n`;
      description += `- Fecha de Vencimiento: ${formatDate(invoice.dueDate)}\n`;
      description += `- Días Vencidos: ${daysOverdue} días\n`;
      description += `- Total: ${formatCurrency(Number(invoice.total))}\n`;
      description += `- Saldo Pendiente: ${formatCurrency(Number(invoice.balance))}\n`;
      
      if (invoice.client?.phone) {
        description += `\n**Contacto:**\n`;
        description += `- Teléfono: ${invoice.client.phone}\n`;
        if (invoice.client.email) {
          description += `- Email: ${invoice.client.email}\n`;
        }
      }

      // Calculate due date for task (7 days from now)
      const taskDueDate = new Date();
      taskDueDate.setDate(taskDueDate.getDate() + 7);

      // Create the task
      const result = await crmApi.createTask({
        title: taskTitle,
        description: description,
        clientId: clientId,
        dueDate: taskDueDate.toISOString(),
      });

      if (result.id) {
        showToast('Tarea de cobro creada exitosamente', 'success');
      } else {
        showToast('Error al crear la tarea', 'error');
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      showToast(
        error.response?.data?.error?.message || 'Error al crear la tarea de cobro',
        'error'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rango de días</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value, page: 1 })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <option value="">Todos</option>
              <option value="0-30">0-30 días</option>
              <option value="31-60">31-60 días</option>
              <option value="61-90">61-90 días</option>
              <option value="90+">Más de 90 días</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</label>
            <input
              type="text"
              placeholder="Cliente, factura, NCF..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchOverdue();
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchOverdue}
              className="w-full rounded-xl bg-slate-950 px-4 py-2.5 font-medium text-white dark:bg-white dark:text-slate-950"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {loading ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700 dark:border-slate-300"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando facturas vencidas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">No hay facturas vencidas</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Días vencida</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Balance pendiente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-950 dark:divide-slate-800">
                  {invoices.map((item) => (
                    <tr key={item.invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{item.client.name}</div>
                        {item.client.phone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{item.client.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{item.invoice.number}</div>
                        {item.invoice.ncf && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{item.invoice.ncf}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(item.invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getDaysOverdueColor(item.invoice.daysOverdue)}`}>
                          ⬢ {item.invoice.daysOverdue} día{item.invoice.daysOverdue !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.invoice.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleCollect(item.invoice.id, item.client.id)}
                            className="rounded-lg bg-slate-950 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-slate-950"
                          >
                            Cobrar
                          </button>
                          <button
                            onClick={() => handleViewAccountStatus(item.client.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          >
                            Ver Estado
                          </button>
                          <button
                            onClick={() => handleCreateTask(item.client.id, item.invoice.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          >
                            Tarea
                          </button>
                          {item.client.phone && (
                            <a
                              href={`https://wa.me/${item.client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
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
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} facturas vencidas
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
