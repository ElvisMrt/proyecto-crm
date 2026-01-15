import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receivablesApi, clientsApi } from '../../services/api';
import { exportAccountStatusToPDF } from '../../utils/exportUtils';
// WhatsApp module disabled
// import { sendAccountStatusWhatsApp } from '../../utils/whatsappSender';
import { useToast } from '../../contexts/ToastContext';
import { HiDocumentDownload } from 'react-icons/hi';
// HiChat disabled - WhatsApp module removed

interface Client {
  id: string;
  name: string;
  identification: string;
}

interface Invoice {
  id: string;
  number: string;
  ncf: string | null;
  issueDate: string;
  dueDate: string | null;
  total: number;
  paid: number;
  balance: number;
  daysOverdue: number;
  status: string;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
  }>;
}

interface AccountStatusTabProps {
  branchId?: string;
  initialClientId?: string;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

const AccountStatusTab = ({ branchId, initialClientId, onNavigateToInvoice }: AccountStatusTabProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (initialClientId && initialClientId !== selectedClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchAccountStatus(selectedClientId);
    }
  }, [selectedClientId, branchId]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAccountStatus = async (clientId: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }
      const data = await receivablesApi.getStatus(clientId, params);
      setAccountStatus(data);
    } catch (error) {
      console.error('Error fetching account status:', error);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.status === 'PAID') {
      return { label: 'Pagada', className: 'bg-green-100 text-green-800' };
    }
    if (invoice.daysOverdue > 0) {
      return { label: 'Vencida', className: 'bg-red-100 text-red-800' };
    }
    return { label: 'Pendiente', className: 'bg-blue-100 text-blue-800' };
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.identification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Selector de Cliente */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Cliente
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o identificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un cliente</option>
              {filteredClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.identification}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estado de Cuenta */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estado de cuenta...</p>
        </div>
      ) : accountStatus ? (
        <div className="space-y-4">
          {/* Resumen del Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Estado de Cuenta - {accountStatus.client.name}
              </h2>
              <div className="flex items-center space-x-2">
                {/* WhatsApp button disabled - WhatsApp module removed */}
                <button
                  onClick={() => {
                    const selectedClient = clients.find(c => c.id === selectedClientId);
                    if (selectedClient && accountStatus) {
                      exportAccountStatusToPDF(
                        {
                          name: accountStatus.client.name,
                          identification: accountStatus.client.identification || '',
                          email: accountStatus.client.email || undefined,
                          phone: accountStatus.client.phone || undefined,
                          address: accountStatus.client.address || undefined,
                        },
                        accountStatus
                      );
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-2"
                >
                  <HiDocumentDownload className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total por Cobrar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accountStatus.summary.totalReceivable)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Vencido</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(accountStatus.summary.totalOverdue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Días Promedio Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accountStatus.summary.averageDaysOverdue} días
                </p>
              </div>
            </div>
          </div>

          {/* Facturas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Facturas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NCF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Venc.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accountStatus.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        No hay facturas pendientes
                      </td>
                    </tr>
                  ) : (
                    accountStatus.invoices.map((invoice: Invoice) => {
                      const statusBadge = getStatusBadge(invoice);
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.ncf || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.issueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(invoice.paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(invoice.balance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {invoice.daysOverdue > 0 ? (
                              <span className="text-red-600 font-medium">{invoice.daysOverdue} días</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => {
                                  navigate(`/sales/invoices/${invoice.id}`);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Ver
                              </button>
                              {invoice.balance > 0 && (
                                <button 
                                  onClick={() => {
                                    if (onNavigateToInvoice) {
                                      // Navigate to payments tab with this invoice
                                      navigate(`/receivables?tab=payments&clientId=${selectedClientId}&invoiceId=${invoice.id}`);
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900 font-medium"
                                >
                                  Cobrar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p>Seleccione un cliente para ver su estado de cuenta</p>
        </div>
      )}
    </div>
  );
};

export default AccountStatusTab;



