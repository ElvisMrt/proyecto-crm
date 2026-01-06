import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiPrinter, HiDocumentDownload, HiChat, HiEye } from 'react-icons/hi';
import { printCreditNote, downloadCreditNotePDF } from '../../utils/creditNotePrint';
import { sendCreditNoteWhatsApp } from '../../utils/whatsappSender';

interface CreditNote {
  id: string;
  number: string;
  ncf: string | null;
  invoice: {
    id: string;
    number: string;
  };
  total: number;
  issueDate: string;
  createdAt: string;
}

const CreditNotesTab = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    invoiceId: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.invoiceId) params.invoiceId = filters.invoiceId;

      const response = await salesApi.getCreditNotes(params);
      setCreditNotes(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      showToast('Error al cargar las notas de crédito', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, [filters.page, filters.search, filters.invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = async (creditNote: CreditNote) => {
    try {
      const creditNoteData = await salesApi.getCreditNote(creditNote.id);
      printCreditNote(creditNoteData);
      showToast('Imprimiendo nota de crédito...', 'info');
    } catch (error: any) {
      console.error('Error fetching credit note for print:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la nota de crédito', 'error');
    }
  };

  const handleDownloadPDF = async (creditNote: CreditNote) => {
    try {
      const creditNoteData = await salesApi.getCreditNote(creditNote.id);
      downloadCreditNotePDF(creditNoteData);
      showToast('Descargando nota de crédito...', 'info');
    } catch (error: any) {
      console.error('Error fetching credit note for PDF:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la nota de crédito', 'error');
    }
  };

  const handleSendWhatsApp = async (creditNote: CreditNote) => {
    try {
      const creditNoteData = await salesApi.getCreditNote(creditNote.id);
      const result = await sendCreditNoteWhatsApp(creditNoteData);
      if (result.success) {
        showToast('Mensaje WhatsApp enviado exitosamente', 'success');
      } else {
        showToast(result.error || 'Error al enviar mensaje WhatsApp', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching credit note for WhatsApp:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar la nota de crédito', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Notas de Crédito</h2>
        <button
          onClick={() => navigate('/sales/credit-notes/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Nueva Nota de Crédito
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Número, NCF..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchCreditNotes();
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factura</label>
            <input
              type="text"
              placeholder="ID de factura..."
              value={filters.invoiceId}
              onChange={(e) => setFilters({ ...filters, invoiceId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                search: '',
                invoiceId: '',
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
            <p className="mt-4 text-gray-600">Cargando notas de crédito...</p>
          </div>
        ) : creditNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay notas de crédito registradas
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
                      #Nota de Crédito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditNotes.map((creditNote) => (
                    <tr key={creditNote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(creditNote.issueDate).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {creditNote.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.ncf || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {creditNote.invoice.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(creditNote.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === creditNote.id ? null : creditNote.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === creditNote.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/sales/credit-notes/${creditNote.id}`);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiEye className="w-4 h-4 mr-2" />
                                    Ver Detalle
                                  </button>
                                  <button
                                    onClick={() => {
                                      handlePrint(creditNote);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiPrinter className="w-4 h-4 mr-2" />
                                    Imprimir
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDownloadPDF(creditNote);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiDocumentDownload className="w-4 h-4 mr-2" />
                                    Descargar PDF
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSendWhatsApp(creditNote);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiChat className="w-4 h-4 mr-2" />
                                    Enviar WhatsApp
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
                  {pagination.total} notas de crédito
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

export default CreditNotesTab;
