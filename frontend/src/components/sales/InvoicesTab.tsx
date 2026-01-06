import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi, branchesApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import VoidInvoiceModal from './VoidInvoiceModal';
import { HiDotsVertical, HiPrinter, HiDocumentDownload, HiChat, HiReceiptTax } from 'react-icons/hi';
import { printInvoice, downloadInvoicePDF } from '../../utils/invoicePrint';
import { sendInvoiceWhatsApp } from '../../utils/whatsappSender';

interface Invoice {
  id: string;
  number: string;
  ncf: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
  status: string;
  type: string;
  paymentMethod: string;
  total: number;
  balance: number;
  issueDate: string;
}

const InvoicesTab = () => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    branchId: '',
    clientId: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const navigate = useNavigate();

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response = await salesApi.getInvoices(params);
      setInvoices(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filters.page, filters.status, filters.type, filters.branchId, filters.clientId, filters.paymentMethod, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' },
      ISSUED: { label: 'Emitida', className: 'bg-blue-100 text-blue-800' },
      PAID: { label: 'Pagada', className: 'bg-green-100 text-green-800' },
      OVERDUE: { label: 'Vencida', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Anulada', className: 'bg-gray-100 text-gray-800' },
    };
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const handleCancelClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setVoidModalOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedInvoice) return;
    
    await salesApi.cancelInvoice(selectedInvoice.id, reason);
    showToast('Factura anulada exitosamente', 'success');
    fetchInvoices();
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      const fullInvoice = await salesApi.getInvoice(invoice.id);
      printInvoice(fullInvoice);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const fullInvoice = await salesApi.getInvoice(invoice.id);
      downloadInvoicePDF(fullInvoice);
      showToast('PDF generado exitosamente', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al generar el PDF', 'error');
    }
  };

  const handleSendWhatsApp = async (invoice: Invoice) => {
    try {
      const fullInvoice = await salesApi.getInvoice(invoice.id);
      const result = await sendInvoiceWhatsApp(fullInvoice);
      if (result.success) {
        showToast('Mensaje WhatsApp enviado exitosamente', 'success');
      } else {
        showToast(result.error || 'Error al enviar mensaje WhatsApp', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al enviar por WhatsApp', 'error');
    }
  };

  const handleGenerateReceipt = async (invoice: Invoice) => {
    try {
      navigate(`/receivables?invoiceId=${invoice.id}&generateReceipt=true`);
    } catch (error: any) {
      showToast('Error al generar recibo', 'error');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      CREDIT: 'Crédito',
      MIXED: 'Mixto',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-4">
      {/* Header con botón de nueva factura */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Facturas</h2>
        <button
          onClick={() => navigate('/sales/new-invoice')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Nueva Factura
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filtros de Búsqueda</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} filtros avanzados
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Número, NCF, Cliente..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchInvoices();
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="ISSUED">Emitida</option>
              <option value="PAID">Pagada</option>
              <option value="OVERDUE">Vencida</option>
              <option value="CANCELLED">Anulada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="FISCAL">Fiscal</option>
              <option value="NON_FISCAL">No Fiscal</option>
            </select>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <select
                value={filters.branchId}
                onChange={(e) => setFilters({ ...filters, branchId: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={filters.clientId}
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CREDIT">Crédito</option>
                <option value="MIXED">Mixto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Máximo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  status: '',
                  type: '',
                  search: '',
                  branchId: '',
                  clientId: '',
                  paymentMethod: '',
                  startDate: '',
                  endDate: '',
                  minAmount: '',
                  maxAmount: '',
                  page: 1,
                  limit: 10,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando facturas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay facturas registradas
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const statusBadge = getStatusBadge(invoice.status);
                    const issueDate = new Date(invoice.issueDate);
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{issueDate.toLocaleDateString('es-DO')}</div>
                          <div className="text-xs text-gray-400">
                            {issueDate.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.ncf || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.client?.name || 'Sin cliente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.branch?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {invoice.balance > 0 ? (
                            <span className="text-red-600 font-medium">{formatCurrency(invoice.balance)}</span>
                          ) : (
                            <span className="text-gray-500">{formatCurrency(invoice.balance)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === invoice.id ? null : invoice.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <HiDotsVertical className="w-5 h-5" />
                            </button>
                            {actionMenuOpen === invoice.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActionMenuOpen(null)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        navigate(`/sales/invoices/${invoice.id}`);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Ver Detalle
                                    </button>
                                    {(invoice.status === 'DRAFT' || (invoice.status === 'ISSUED' && invoice.balance === invoice.total)) && (
                                      <button
                                        onClick={() => {
                                          navigate(`/sales/invoices/${invoice.id}/edit`);
                                          setActionMenuOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                      >
                                        {invoice.status === 'DRAFT' ? 'Continuar Edición' : 'Editar'}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        handlePrint(invoice);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiPrinter className="w-4 h-4 mr-2" />
                                      Imprimir
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDownloadPDF(invoice);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiDocumentDownload className="w-4 h-4 mr-2" />
                                      Descargar PDF
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleSendWhatsApp(invoice);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiChat className="w-4 h-4 mr-2" />
                                      Enviar WhatsApp
                                    </button>
                                    {invoice.status === 'ISSUED' && invoice.balance > 0 && (
                                      <>
                                        <button
                                          onClick={() => {
                                            navigate(`/receivables?invoiceId=${invoice.id}`);
                                            setActionMenuOpen(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                        >
                                          Registrar Pago
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleGenerateReceipt(invoice);
                                            setActionMenuOpen(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <HiReceiptTax className="w-4 h-4 mr-2" />
                                          Generar Recibo
                                        </button>
                                      </>
                                    )}
                                    {invoice.status === 'ISSUED' && (
                                      <button
                                        onClick={() => {
                                          handleCancelClick(invoice);
                                          setActionMenuOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      >
                                        Anular
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        navigate(`/sales/credit-notes/new?invoiceId=${invoice.id}`);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Crear Nota de Crédito
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const duplicated = await salesApi.duplicateInvoice(invoice.id);
                                          showToast('Factura duplicada exitosamente', 'success');
                                          navigate(`/sales/invoices/${duplicated.id}/edit`);
                                          setActionMenuOpen(null);
                                        } catch (error: any) {
                                          showToast(error.response?.data?.error?.message || 'Error al duplicar la factura', 'error');
                                          setActionMenuOpen(null);
                                        }
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Copiar Factura
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} facturas
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

      {/* Modal de Anulación */}
      <VoidInvoiceModal
        isOpen={voidModalOpen}
        onClose={() => {
          setVoidModalOpen(false);
          setSelectedInvoice(null);
        }}
        onConfirm={handleCancelConfirm}
        invoiceNumber={selectedInvoice?.number}
      />
    </div>
  );
};

export default InvoicesTab;


