import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiArrowLeft, HiPrinter, HiDocumentDownload } from 'react-icons/hi';
// HiChat disabled - WhatsApp module removed
import { printCreditNote, downloadCreditNotePDF } from '../../utils/creditNotePrint';
// sendCreditNoteWhatsApp disabled - WhatsApp module removed

const CreditNoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [creditNote, setCreditNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCreditNote();
    }
  }, [id]);

  const fetchCreditNote = async () => {
    try {
      setLoading(true);
      const data = await salesApi.getCreditNote(id!);
      setCreditNote(data);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la nota de crédito', 'error');
      navigate('/sales');
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!creditNote) {
    return <div>Nota de Crédito no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/sales')} className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle de Nota de Crédito</h2>
            <p className="text-sm text-gray-500 mt-1">{creditNote.number}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => printCreditNote(creditNote)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiPrinter className="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={() => {
              downloadCreditNotePDF(creditNote);
              showToast('PDF generado exitosamente', 'success');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiDocumentDownload className="w-4 h-4 mr-2" />
            PDF
          </button>
          {/* WhatsApp button disabled */}
          {/* {creditNote.invoice?.client?.phone && (
            <button
              onClick={() => {
                sendCreditNoteWhatsApp(creditNote);
                showToast('Abriendo WhatsApp...', 'info');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <HiChat className="w-4 h-4 mr-2" />
              WhatsApp
            </button>
          )} */}
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Número de Nota de Crédito</p>
            <p className="text-lg font-semibold text-gray-900">{creditNote.number}</p>
          </div>
          {creditNote.ncf && (
            <div>
              <p className="text-sm text-gray-500 mb-1">NCF</p>
              <p className="text-lg font-semibold text-gray-900">{creditNote.ncf}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Emisión</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(creditNote.issueDate)}</p>
          </div>
        </div>

        {/* Factura Relacionada */}
        {creditNote.invoice && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Factura Relacionada</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Número de Factura</p>
                <p className="font-semibold text-blue-900">{creditNote.invoice.number}</p>
              </div>
              {creditNote.invoice.ncf && (
                <div>
                  <p className="text-sm text-blue-700 mb-1">NCF</p>
                  <p className="font-semibold text-blue-900">{creditNote.invoice.ncf}</p>
                </div>
              )}
              {creditNote.invoice.client && (
                <>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Cliente</p>
                    <p className="font-semibold text-blue-900">{creditNote.invoice.client.name}</p>
                  </div>
                  {creditNote.invoice.client.identification && (
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Identificación</p>
                      <p className="font-semibold text-blue-900">{creditNote.invoice.client.identification}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Motivo */}
        <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-200">
          <p className="text-sm font-medium text-red-900 mb-1">Motivo de la Nota de Crédito</p>
          <p className="text-sm text-red-800">{creditNote.reason}</p>
        </div>

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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditNote.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.product?.name || item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(Number(item.price))}</td>
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
                <span className="font-medium">{formatCurrency(Number(creditNote.subtotal))}</span>
              </div>
              {Number(creditNote.tax || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ITBIS (18%):</span>
                  <span className="font-medium">{formatCurrency(Number(creditNote.tax))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2 text-red-600">
                <span>Total:</span>
                <span>{formatCurrency(Number(creditNote.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditNoteDetail;
