import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi, settingsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiEye, HiPrinter, HiDocumentDownload } from 'react-icons/hi';
import { printInvoice, downloadInvoicePDF } from '../../utils/invoicePrint';

interface CancelledInvoice {
  id: string;
  number: string;
  ncf: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  total: number;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelledBy: {
    id: string;
    name: string;
  } | null;
  type?: 'CANCELLED' | 'CREDIT_NOTE'; // Add type to distinguish
}

interface CreditNote {
  id: string;
  number: string;
  ncf: string | null;
  invoice: {
    id: string;
    number: string;
  } | null;
  total: number;
  issueDate: string;
  createdAt: string;
  reason?: string;
  type?: 'CANCELLED' | 'CREDIT_NOTE';
}

type CancelledDocument = CancelledInvoice | CreditNote;

const CancelledTab = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CancelledDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    cancelledBy: '',
    reason: '',
    page: 1,
    limit: 10,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async () => {
    try {
      const response = await settingsApi.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCancelled = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.cancelledBy) params.cancelledBy = filters.cancelledBy;
      if (filters.reason) params.reason = filters.reason;

      // Fetch both cancelled invoices and credit notes
      const [cancelledResponse, creditNotesResponse] = await Promise.all([
        salesApi.getCancelledInvoices(params),
        salesApi.getCreditNotes(params),
      ]);

      // Combine and format the results
      const cancelledInvoices = (cancelledResponse.data || []).map((inv: any) => ({
        ...inv,
        type: 'CANCELLED' as const,
      }));

      const creditNotes = (creditNotesResponse.data || []).map((cn: any) => ({
        ...cn,
        type: 'CREDIT_NOTE' as const,
        cancelledAt: cn.issueDate || cn.createdAt,
        cancellationReason: cn.reason || 'Nota de Crédito',
        client: null, // Credit notes don't have direct client, get from invoice if needed
      }));

      // Combine and sort by date (most recent first)
      const combined = [...cancelledInvoices, ...creditNotes].sort((a, b) => {
        const dateA = a.cancelledAt || a.issueDate || a.createdAt || '';
        const dateB = b.cancelledAt || b.issueDate || b.createdAt || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      // Apply pagination manually since we're combining two sources
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginated = combined.slice(startIndex, endIndex);

      setDocuments(paginated);
      setPagination({
        page: filters.page,
        limit: filters.limit,
        total: combined.length,
        totalPages: Math.ceil(combined.length / filters.limit),
      });
    } catch (error) {
      console.error('Error fetching cancelled documents:', error);
      showToast('Error al cargar los documentos anulados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchCancelled();
  }, [filters.page, filters.search, filters.startDate, filters.endDate, filters.cancelledBy, filters.reason]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = async (invoice: CancelledInvoice) => {
    try {
      const invoiceData = await salesApi.getInvoice(invoice.id);
      printInvoice(invoiceData);
      showToast('Imprimiendo factura...', 'info');
    } catch (error: any) {
      console.error('Error fetching invoice for print:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
    }
  };

  const handleDownloadPDF = async (invoice: CancelledInvoice) => {
    try {
      const invoiceData = await salesApi.getInvoice(invoice.id);
      downloadInvoicePDF(invoiceData);
      showToast('Descargando factura...', 'info');
    } catch (error: any) {
      console.error('Error fetching invoice for PDF:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historial / Anulados</h2>
            <p className="text-sm text-gray-600 mt-1">Historial de facturas anuladas y notas de crédito</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Número, NCF, Cliente..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchCancelled();
              }}
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Anulado por</label>
            <select
              value={filters.cancelledBy}
              onChange={(e) => setFilters({ ...filters, cancelledBy: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              placeholder="Buscar por motivo..."
              value={filters.reason}
              onChange={(e) => setFilters({ ...filters, reason: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                search: '',
                startDate: '',
                endDate: '',
                cancelledBy: '',
                reason: '',
                page: 1,
                limit: 10,
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando documentos anulados...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay documentos anulados</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento Original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          document.type === 'CREDIT_NOTE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {document.type === 'CREDIT_NOTE' ? 'Nota Crédito' : 'Anulación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {document.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.ncf || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.type === 'CREDIT_NOTE' && 'invoice' in document && document.invoice
                          ? document.invoice.number
                          : document.type === 'CANCELLED' && 'client' in document && document.client
                          ? document.client.name
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(document.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.cancelledAt || (document as CreditNote).issueDate || (document as CreditNote).createdAt
                          ? new Date(document.cancelledAt || (document as CreditNote).issueDate || (document as CreditNote).createdAt || '').toLocaleDateString('es-DO')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.type === 'CANCELLED' && 'cancelledBy' in document
                          ? document.cancelledBy?.name || '-'
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={document.cancellationReason || (document as CreditNote).reason || ''}>
                          {document.cancellationReason || (document as CreditNote).reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === document.id ? null : document.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === document.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                <div className="py-1">
                                  {document.type === 'CANCELLED' ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          navigate(`/sales/invoices/${document.id}`);
                                          setActionMenuOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                      >
                                        <HiEye className="w-4 h-4 mr-2" />
                                        Ver Detalle
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePrint(document);
                                          setActionMenuOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                      >
                                        <HiPrinter className="w-4 h-4 mr-2" />
                                        Imprimir
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDownloadPDF(document);
                                          setActionMenuOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                      >
                                        <HiDocumentDownload className="w-4 h-4 mr-2" />
                                        Descargar PDF
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        navigate(`/sales/credit-notes/${document.id}`);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiEye className="w-4 h-4 mr-2" />
                                      Ver Detalle
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
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
                  {pagination.total} documentos anulados
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

export default CancelledTab;
