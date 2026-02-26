import { useState, useEffect } from 'react';
import { HiX, HiShoppingCart, HiDocumentText, HiCash } from 'react-icons/hi';
import api from '../services/api';

interface SupplierDetailPanelProps {
  supplierId: string;
  supplierName: string;
  onClose: () => void;
}

type SubTab = 'purchases' | 'invoices' | 'payments';

export default function SupplierDetailPanel({ supplierId, supplierName, onClose }: SupplierDetailPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('invoices');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId]);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, invoicesRes, paymentsRes] = await Promise.all([
        api.get(`/purchases?supplierId=${supplierId}`),
        api.get(`/supplier-invoices?supplierId=${supplierId}`),
        api.get(`/supplier-payments?supplierId=${supplierId}`)
      ]);

      setPurchases(purchasesRes.data?.data || []);
      setInvoices(invoicesRes.data?.data || []);
      setPayments(paymentsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const subTabs = [
    { id: 'invoices' as SubTab, label: 'Facturas', icon: HiDocumentText, count: invoices.length },
    { id: 'purchases' as SubTab, label: 'Compras', icon: HiShoppingCart, count: purchases.length },
    { id: 'payments' as SubTab, label: 'Pagos', icon: HiCash, count: payments.length },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{supplierName}</h2>
          <p className="text-sm text-blue-100">Detalle del proveedor</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex px-6">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors
                ${
                  activeSubTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`
                px-2 py-0.5 text-xs rounded-full
                ${activeSubTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeSubTab === 'invoices' && (
              <div className="space-y-3">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{invoice.code}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>Emisión: {formatDate(invoice.invoiceDate)}</p>
                            <p>Vencimiento: {formatDate(invoice.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                          {invoice.balance > 0 && (
                            <p className="text-sm text-red-600">Saldo: {formatCurrency(invoice.balance)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <HiDocumentText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay facturas registradas</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'purchases' && (
              <div className="space-y-3">
                {purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{purchase.code}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                              purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {purchase.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Fecha: {formatDate(purchase.purchaseDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(purchase.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <HiShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay compras registradas</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'payments' && (
              <div className="space-y-3">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{payment.code}</span>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>Fecha: {formatDate(payment.paymentDate)}</p>
                            <p>Método: {payment.paymentMethod}</p>
                            {payment.reference && <p>Ref: {payment.reference}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <HiCash className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay pagos registrados</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
