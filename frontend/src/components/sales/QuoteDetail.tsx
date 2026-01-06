import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiArrowLeft, HiPrinter, HiDocumentDownload, HiChat, HiPencil } from 'react-icons/hi';
import { printQuote, downloadQuotePDF, sendQuoteWhatsApp } from '../../utils/quotePrint';
import ConvertQuoteModal from './ConvertQuoteModal';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const data = await salesApi.getQuote(id!);
      setQuote(data);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la cotización', 'error');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (paymentMethod: string, type: string) => {
    if (!quote) return;

    try {
      await salesApi.convertQuoteToInvoice(quote.id, {
        paymentMethod,
        type,
      });
      showToast('Cotización convertida exitosamente', 'success');
      setConvertModalOpen(false);
      navigate('/sales');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al convertir la cotización', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return <div>Cotización no encontrada</div>;
  }

  const statusBadge = getStatusBadge(quote.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/sales')} className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle de Cotización</h2>
            <p className="text-sm text-gray-500 mt-1">{quote.number}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => printQuote(quote)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiPrinter className="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={() => {
              downloadQuotePDF(quote);
              showToast('PDF generado exitosamente', 'success');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiDocumentDownload className="w-4 h-4 mr-2" />
            PDF
          </button>
          {quote.client?.phone && (
            <button
              onClick={() => {
                sendQuoteWhatsApp(quote);
                showToast('Abriendo WhatsApp...', 'info');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <HiChat className="w-4 h-4 mr-2" />
              WhatsApp
            </button>
          )}
          {quote.status === 'OPEN' && (
            <>
              <button
                onClick={() => navigate(`/sales/quotes/${quote.id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => setConvertModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Convertir a Factura
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Número de Cotización</p>
            <p className="text-lg font-semibold text-gray-900">{quote.number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Estado</p>
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Cliente</p>
            <p className="text-lg font-semibold text-gray-900">{quote.client?.name || 'Sin cliente'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Creación</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(quote.createdAt)}</p>
          </div>
          {quote.validUntil && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Válida hasta</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(quote.validUntil)}</p>
            </div>
          )}
          {quote.convertedToInvoiceId && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Convertida a Factura</p>
              <p className="text-lg font-semibold text-blue-600">
                {quote.convertedToInvoiceId}
              </p>
            </div>
          )}
        </div>

        {quote.observations && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-1">Observaciones</p>
            <p className="text-sm text-gray-600">{quote.observations}</p>
          </div>
        )}

        {/* Items */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.product?.name || item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(Number(item.price))}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(Number(item.discount))}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">{formatCurrency(Number(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(Number(quote.subtotal) + Number(quote.discount || 0))}</span>
              </div>
              {Number(quote.discount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(Number(quote.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal Neto:</span>
                <span className="font-medium">{formatCurrency(Number(quote.subtotal))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(Number(quote.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      {quote.client && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nombre</p>
              <p className="text-sm font-medium text-gray-900">{quote.client.name}</p>
            </div>
            {quote.client.identification && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Identificación</p>
                <p className="text-sm font-medium text-gray-900">{quote.client.identification}</p>
              </div>
            )}
            {quote.client.email && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{quote.client.email}</p>
              </div>
            )}
            {quote.client.phone && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{quote.client.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Conversión */}
      {convertModalOpen && quote && (
        <ConvertQuoteModal
          quote={quote}
          onClose={() => setConvertModalOpen(false)}
          onConvert={handleConvert}
        />
      )}
    </div>
  );
};

export default QuoteDetail;
