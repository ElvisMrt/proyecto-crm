import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salesApi, receivablesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiArrowLeft, HiPrinter, HiDocumentDownload, HiChat, HiX, HiReceiptTax } from 'react-icons/hi';
import VoidInvoiceModal from './VoidInvoiceModal';
import { printInvoice, downloadInvoicePDF } from '../../utils/invoicePrint';
import { sendInvoiceWhatsApp } from '../../utils/whatsappSender';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidModalOpen, setVoidModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
      fetchPayments();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await salesApi.getInvoice(id!);
      setInvoice(data);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar la factura', 'error');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await receivablesApi.getPayments({ invoiceId: id });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!invoice) return;
    
    try {
      await salesApi.cancelInvoice(invoice.id, reason);
      showToast('Factura anulada exitosamente', 'success');
      fetchInvoice();
      setVoidModalOpen(false);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al anular la factura', 'error');
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
      ISSUED: { label: 'Emitida', className: 'bg-blue-100 text-blue-800' },
      PAID: { label: 'Pagada', className: 'bg-green-100 text-green-800' },
      OVERDUE: { label: 'Vencida', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Anulada', className: 'bg-gray-100 text-gray-800' },
    };
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div>Factura no encontrada</div>;
  }

  const statusBadge = getStatusBadge(invoice.status);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/sales')} className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle de Factura</h2>
            <p className="text-sm text-gray-500 mt-1">{invoice.number}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => printInvoice(invoice)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiPrinter className="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={() => {
              downloadInvoicePDF(invoice);
              showToast('PDF generado exitosamente', 'success');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiDocumentDownload className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button
            onClick={async () => {
              if (!invoice.client?.phone) {
                showToast('El cliente no tiene un número de teléfono registrado', 'error');
                return;
              }
              try {
                const result = await sendInvoiceWhatsApp(invoice);
                if (result.success) {
                  showToast('Mensaje WhatsApp enviado exitosamente', 'success');
                } else {
                  showToast(result.error || 'Error al enviar mensaje WhatsApp', 'error');
                }
              } catch (error: any) {
                showToast('Error al enviar mensaje WhatsApp', 'error');
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <HiChat className="w-4 h-4 mr-2" />
            WhatsApp
          </button>
          {invoice.status === 'ISSUED' && invoice.balance > 0 && (
            <button
              onClick={() => navigate(`/receivables?invoiceId=${invoice.id}&generateReceipt=true`)}
              className="px-4 py-2 border border-green-300 rounded-md text-green-700 hover:bg-green-50 flex items-center"
            >
              <HiReceiptTax className="w-4 h-4 mr-2" />
              Generar Recibo
            </button>
          )}
          {invoice.status === 'ISSUED' && invoice.balance > 0 && (
            <button
              onClick={() => navigate(`/receivables?invoiceId=${invoice.id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Registrar Pago
            </button>
          )}
          {invoice.status === 'ISSUED' && (
            <button
              onClick={() => setVoidModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Anular
            </button>
          )}
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Número de Factura</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">NCF</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.ncf || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Estado</p>
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Cliente</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.client?.name || 'Sin cliente'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Emisión</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.issueDate)}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha de Vencimiento</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Tipo</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.type === 'FISCAL' ? 'Fiscal' : 'No Fiscal'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Método de Pago</p>
            <p className="text-lg font-semibold text-gray-900">{getPaymentMethodLabel(invoice.paymentMethod)}</p>
          </div>
          {invoice.branch && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Sucursal</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.branch.name}</p>
            </div>
          )}
        </div>

        {invoice.observations && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-1">Observaciones</p>
            <p className="text-sm text-gray-600">{invoice.observations}</p>
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
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{item.quantity}</td>
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
                <span className="font-medium">{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(Number(invoice.discount))}</span>
                </div>
              )}
              {invoice.type === 'FISCAL' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ITBIS (18%):</span>
                  <span className="font-medium">{formatCurrency(Number(invoice.tax))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
              {invoice.paymentMethod === 'CREDIT' && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">Pagado:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Balance:</span>
                    <span className={Number(invoice.balance) > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(Number(invoice.balance))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      {invoice.paymentMethod === 'CREDIT' && payments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado por</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(payment.paymentDate).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getPaymentMethodLabel(payment.method)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{payment.reference || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{payment.user?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notas de Crédito */}
      {invoice.creditNotes && invoice.creditNotes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas de Crédito</h3>
          <div className="space-y-2">
            {invoice.creditNotes.map((cn: any) => (
              <div key={cn.id} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{cn.number}</p>
                    <p className="text-sm text-gray-500">{cn.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(cn.total))}</p>
                    <p className="text-sm text-gray-500">{formatDate(cn.issueDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Anulación */}
      <VoidInvoiceModal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        onConfirm={handleCancel}
        invoiceNumber={invoice.number}
      />
    </div>
  );
};

export default InvoiceDetail;


