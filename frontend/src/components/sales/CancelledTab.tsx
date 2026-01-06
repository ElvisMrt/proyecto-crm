import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api';
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
}

const CancelledTab = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<CancelledInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCancelled = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) params.search = filters.search;

      const response = await salesApi.getCancelledInvoices(params);
      setInvoices(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching cancelled invoices:', error);
      showToast('Error al cargar las facturas anuladas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelled();
  }, [filters.page, filters.search]);

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
            <h2 className="text-lg font-semibold text-gray-900">Facturas Anuladas</h2>
            <p className="text-sm text-gray-600 mt-1">Historial de facturas canceladas del sistema</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                search: '',
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
            <p className="mt-4 text-gray-600">Cargando facturas anuladas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay facturas anuladas</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Anulación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anulado por
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
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.ncf || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client?.name || 'Sin cliente'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleDateString('es-DO') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.cancelledBy?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={invoice.cancellationReason || ''}>
                          {invoice.cancellationReason || '-'}
                        </div>
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
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiEye className="w-4 h-4 mr-2" />
                                    Ver Detalle
                                  </button>
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
                  {pagination.total} facturas anuladas
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
