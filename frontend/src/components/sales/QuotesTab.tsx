import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { HiDotsVertical, HiPencil, HiDocumentDownload, HiPrinter } from 'react-icons/hi';
// HiChat disabled - WhatsApp module removed
import ConvertQuoteModal from './ConvertQuoteModal';
import { printQuote, downloadQuotePDF } from '../../utils/quotePrint';
// WhatsApp module disabled
// import { sendQuoteWhatsApp } from '../../utils/whatsappSender';

interface Quote {
  id: string;
  number: string;
  client: {
    id: string;
    name: string;
  } | null;
  status: string;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

const QuotesTab = () => {
  const { showToast, showConfirm } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filters, setFilters] = useState({
    status: '',
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

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.clientId) params.clientId = filters.clientId;

      const response = await salesApi.getQuotes(params);
      setQuotes(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [filters.page, filters.status, filters.clientId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      OPEN: { label: 'Abierta', className: 'bg-blue-100 text-blue-800' },
      ACCEPTED: { label: 'Aceptada', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
      CONVERTED: { label: 'Convertida', className: 'bg-purple-100 text-purple-800' },
    };
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const handleConvertClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setConvertModalOpen(true);
  };

  const handleConvert = async (paymentMethod: string, type: string) => {
    if (!selectedQuote) return;

    try {
      await salesApi.convertQuoteToInvoice(selectedQuote.id, {
        paymentMethod,
        type,
      });
      showToast('Cotización convertida exitosamente', 'success');
      setConvertModalOpen(false);
      setSelectedQuote(null);
      fetchQuotes();
    } catch (error: any) {
      console.error('Error converting quote:', error);
      showToast(error.response?.data?.error?.message || 'Error al convertir la cotización', 'error');
    }
  };

  const handleEdit = (quote: Quote) => {
    if (quote.status !== 'OPEN') {
      showToast('Solo se pueden editar cotizaciones abiertas', 'error');
      return;
    }
    navigate(`/sales/quotes/${quote.id}/edit`);
  };

  const handlePrint = async (quote: Quote) => {
    try {
      const quoteData = await salesApi.getQuote(quote.id);
      printQuote(quoteData);
      showToast('Imprimiendo cotización...', 'info');
    } catch (error: any) {
      console.error('Error fetching quote for print:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la cotización', 'error');
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const quoteData = await salesApi.getQuote(quote.id);
      downloadQuotePDF(quoteData);
      showToast('Descargando cotización...', 'info');
    } catch (error: any) {
      console.error('Error fetching quote for PDF:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la cotización', 'error');
    }
  };

  // WhatsApp function disabled
  // const handleSendWhatsApp = async (quote: Quote) => {
  //   try {
  //     const quoteData = await salesApi.getQuote(quote.id);
  //     const result = await sendQuoteWhatsApp(quoteData);
  //     if (result.success) {
  //       showToast('Mensaje WhatsApp enviado exitosamente', 'success');
  //     } else {
  //       showToast(result.error || 'Error al enviar mensaje WhatsApp', 'error');
  //     }
  //   } catch (error: any) {
  //     console.error('Error fetching quote for WhatsApp:', error);
  //     showToast(error.response?.data?.error?.message || 'Error al cargar la cotización', 'error');
  //   }
  // };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Cotizaciones</h2>
        <button
          onClick={() => navigate('/sales/quotes/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Nueva Cotización
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Número de cotización..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchQuotes();
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
              <option value="OPEN">Abierta</option>
              <option value="ACCEPTED">Aceptada</option>
              <option value="REJECTED">Rechazada</option>
              <option value="CONVERTED">Convertida</option>
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
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: '',
                search: '',
                clientId: '',
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
            <p className="mt-4 text-gray-600">Cargando cotizaciones...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay cotizaciones registradas
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #Cotización
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Estimado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Válida hasta
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => {
                    const statusBadge = getStatusBadge(quote.status);
                    return (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString('es-DO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {quote.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {quote.client?.name || 'Sin cliente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-DO') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === quote.id ? null : quote.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <HiDotsVertical className="w-5 h-5" />
                            </button>
                            {actionMenuOpen === quote.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActionMenuOpen(null)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        navigate(`/sales/quotes/${quote.id}`);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Ver Detalle
                                    </button>
                                    {quote.status === 'OPEN' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleEdit(quote);
                                            setActionMenuOpen(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <HiPencil className="w-4 h-4 mr-2" />
                                          Editar
                                        </button>
                                        {user?.role === 'ADMINISTRATOR' && (
                                          <button
                                            onClick={() => {
                                              setActionMenuOpen(null);
                                              showConfirm(
                                                'Eliminar Cotización',
                                                `¿Está seguro de eliminar la cotización ${quote.number}? Esta acción no se puede deshacer.`,
                                                async () => {
                                                  try {
                                                    await salesApi.deleteQuote(quote.id);
                                                    showToast('Cotización eliminada exitosamente', 'success');
                                                    fetchQuotes();
                                                  } catch (error: any) {
                                                    showToast(error.response?.data?.error?.message || 'Error al eliminar la cotización', 'error');
                                                  }
                                                },
                                                { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
                                              );
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                          >
                                            Eliminar
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            handleConvertClick(quote);
                                            setActionMenuOpen(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                        >
                                          Convertir a Factura
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => {
                                        handlePrint(quote);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiPrinter className="w-4 h-4 mr-2" />
                                      Imprimir
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDownloadPDF(quote);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiDocumentDownload className="w-4 h-4 mr-2" />
                                      Descargar PDF
                                    </button>
                                    {/* WhatsApp button disabled */}
                                    {/* <button
                                      onClick={() => {
                                        handleSendWhatsApp(quote);
                                        setActionMenuOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <HiChat className="w-4 h-4 mr-2" />
                                      Enviar WhatsApp
                                    </button> */}
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
                  {pagination.total} cotizaciones
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

      {/* Modal de Conversión */}
      {convertModalOpen && selectedQuote && (
        <ConvertQuoteModal
          quote={selectedQuote}
          onClose={() => {
            setConvertModalOpen(false);
            setSelectedQuote(null);
          }}
          onConvert={handleConvert}
        />
      )}
    </div>
  );
};

export default QuotesTab;


