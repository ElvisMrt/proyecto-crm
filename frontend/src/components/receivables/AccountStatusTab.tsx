import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receivablesApi, clientsApi } from '../../services/api';
import { exportAccountStatusToPDF } from '../../utils/exportUtils';
// WhatsApp module disabled
// import { sendAccountStatusWhatsApp } from '../../utils/whatsappSender';
import { useToast } from '../../contexts/ToastContext';
import { HiDocumentDownload, HiSearch, HiUser, HiCheckCircle, HiCurrencyDollar } from 'react-icons/hi';
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
  principalBalance?: number;
  daysOverdue: number;
  status: string;
  financingPlan?: {
    id: string;
    installmentAmount: number;
    totalFinanced: number;
    totalInterest: number;
    remainingAmount: number;
    paidAmount: number;
    status: string;
    installments: Array<{
      id: string;
      installmentNo: number;
      dueDate: string;
      scheduledTotal: number;
      paidAmount: number;
      status: string;
    }>;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
  }>;
}

interface FinancingFormState {
  invoiceId: string;
  interestRate: number;
  termMonths: number;
  paymentFrequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
  startDate: string;
  notes: string;
}

interface AccountStatusTabProps {
  branchId?: string;
  initialClientId?: string;
  onNavigateToInvoice?: (invoiceId: string) => void;
  onNavigateToPayment?: (clientId: string, invoiceIds: string[]) => void;
}

const AccountStatusTab = ({ branchId, initialClientId, onNavigateToInvoice, onNavigateToPayment }: AccountStatusTabProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [financingForm, setFinancingForm] = useState<FinancingFormState | null>(null);
  const [creatingFinancing, setCreatingFinancing] = useState(false);

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
      return { label: 'Pagada', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
    }
    if (invoice.daysOverdue > 0) {
      return { label: 'Vencida', className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' };
    }
    return { label: 'Pendiente', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' };
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.identification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSearchTerm(client.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredClients.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
        handleSelectClient(filteredClients[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const getDefaultFinancingStartDate = (invoice: Invoice) => {
    const baseDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
    const today = new Date();

    const selectedDate = baseDate >= today ? baseDate : today;
    return selectedDate.toISOString().split('T')[0];
  };

  const openFinancingForm = (invoice: Invoice) => {
    setFinancingForm({
      invoiceId: invoice.id,
      interestRate: 24,
      termMonths: 6,
      paymentFrequency: 'MONTHLY',
      startDate: getDefaultFinancingStartDate(invoice),
      notes: `Financiamiento de factura ${invoice.number}`,
    });
  };

  const handleCreateFinancing = async (invoice: Invoice) => {
    if (!financingForm || financingForm.invoiceId !== invoice.id) {
      return;
    }

    try {
      setCreatingFinancing(true);
      await receivablesApi.createFinancingPlan(invoice.id, financingForm);
      showToast('Plan de financiamiento creado', 'success');
      await fetchAccountStatus(selectedClientId);
      setFinancingForm(null);
    } catch (error: any) {
      console.error('Error creating financing plan:', error);
      showToast(error.response?.data?.error?.message || 'Error al crear el financiamiento', 'error');
    } finally {
      setCreatingFinancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white">Cliente</label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Busca por nombre o identificación</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <HiSearch className="h-5 w-5" />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <HiUser className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Haz click para ver todos los clientes o escribe para buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onClick={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
          />
          
          {/* Sugerencias Dropdown */}
          {showSuggestions && filteredClients.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
              <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {filteredClients.length} cliente(s) encontrado(s)
                </p>
              </div>
              {filteredClients.map((client, index) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full border-b border-slate-100 px-4 py-4 text-left transition-all last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${
                    index === highlightedIndex ? 'bg-slate-50 dark:bg-slate-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                          <HiUser className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                        <p className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <span className="mr-1">ID:</span>
                          {client.identification}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No hay resultados */}
          {showSuggestions && searchTerm && clients.length > 0 && filteredClients.length === 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-950">
              <p className="text-center text-slate-500 dark:text-slate-400">No se encontraron clientes</p>
            </div>
          )}
        </div>
        
        {selectedClientId && accountStatus && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center">
              <HiCheckCircle className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Cliente activo
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {accountStatus.client.name}
                </p>
                {accountStatus.client.identification && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    ID: {accountStatus.client.identification}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado de Cuenta */}
      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-slate-700 dark:border-slate-300"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando estado de cuenta...</p>
        </div>
      ) : accountStatus ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Estado de Cuenta - {accountStatus.client.name}
              </h2>
              <div className="flex items-center space-x-2">
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <HiDocumentDownload className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total por cobrar</p>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">
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
                <p className="text-sm text-slate-500 dark:text-slate-400">Días promedio vencidos</p>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">
                  {accountStatus.summary.averageDaysOverdue} días
                </p>
              </div>
            </div>
          </div>

          {/* Facturas */}
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Facturas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">NCF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Emisión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pagado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Días venc.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-950 dark:divide-slate-800">
                  {accountStatus.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No hay facturas pendientes
                      </td>
                    </tr>
                  ) : (
                    accountStatus.invoices.map((invoice: Invoice) => {
                      const statusBadge = getStatusBadge(invoice);
                      const canFinance = invoice.balance > 0 && !invoice.financingPlan && ['ISSUED', 'OVERDUE'].includes(invoice.status);
                      const isFinancingOpen = financingForm?.invoiceId === invoice.id;
                      return (
                        <Fragment key={invoice.id}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{invoice.number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{invoice.ncf || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(invoice.issueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              <div>{formatDate(invoice.dueDate)}</div>
                              {invoice.financingPlan && (
                                <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  Cuota: {formatCurrency(invoice.financingPlan.installmentAmount)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {formatCurrency(invoice.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                              <div>{formatCurrency(invoice.paid)}</div>
                              {invoice.financingPlan && (
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  Capital: {formatCurrency(invoice.principalBalance || 0)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              <div>{formatCurrency(invoice.balance)}</div>
                              {invoice.financingPlan && (
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  Financiado
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {invoice.daysOverdue > 0 ? (
                                <span className="text-red-600 font-medium">{invoice.daysOverdue} días</span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                                {invoice.financingPlan && (
                                  <div>
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                      Financiada
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => {
                                    navigate(`/sales/invoices/${invoice.id}`);
                                  }}
                                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                                >
                                  Ver
                                </button>
                                {invoice.balance > 0 && (
                                  <button 
                                    onClick={() => {
                                      if (onNavigateToPayment) {
                                        onNavigateToPayment(selectedClientId, [invoice.id]);
                                      } else {
                                        navigate(`/receivables?tab=payments&clientId=${selectedClientId}&invoiceIds=${invoice.id}`);
                                      }
                                    }}
                                    className="font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
                                  >
                                    Cobrar
                                  </button>
                                )}
                                {canFinance && (
                                  <button
                                    onClick={() => openFinancingForm(invoice)}
                                    className="font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                                  >
                                    Financiar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {(isFinancingOpen || invoice.financingPlan) && (
                            <tr className="bg-slate-50/80 dark:bg-slate-900/40">
                              <td colSpan={10} className="px-6 py-4">
                                {invoice.financingPlan ? (
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total financiado</p>
                                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.financingPlan.totalFinanced)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Interés total</p>
                                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.financingPlan.totalInterest)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cuota</p>
                                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.financingPlan.installmentAmount)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Saldo financiado</p>
                                      <p className="mt-1 font-semibold text-purple-700">{formatCurrency(invoice.financingPlan.remainingAmount)}</p>
                                    </div>
                                  </div>
                                ) : financingForm ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                      <HiCurrencyDollar className="h-5 w-5" />
                                      <h4 className="font-semibold">Crear financiamiento para {invoice.number}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      <label className="block">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Interés anual %</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={financingForm.interestRate}
                                          onChange={(e) => setFinancingForm((prev) => prev ? { ...prev, interestRate: Number(e.target.value) } : prev)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                      </label>
                                      <label className="block">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Plazo (meses)</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={financingForm.termMonths}
                                          onChange={(e) => setFinancingForm((prev) => prev ? { ...prev, termMonths: Number(e.target.value) } : prev)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                      </label>
                                      <label className="block">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Frecuencia</span>
                                        <select
                                          value={financingForm.paymentFrequency}
                                          onChange={(e) => setFinancingForm((prev) => prev ? { ...prev, paymentFrequency: e.target.value as FinancingFormState['paymentFrequency'] } : prev)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                          <option value="MONTHLY">Mensual</option>
                                          <option value="BIWEEKLY">Quincenal</option>
                                          <option value="WEEKLY">Semanal</option>
                                        </select>
                                      </label>
                                      <label className="block">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Primera cuota</span>
                                        <input
                                          type="date"
                                          value={financingForm.startDate}
                                          onChange={(e) => setFinancingForm((prev) => prev ? { ...prev, startDate: e.target.value } : prev)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                      </label>
                                    </div>
                                    <label className="block">
                                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Notas</span>
                                      <input
                                        type="text"
                                        value={financingForm.notes}
                                        onChange={(e) => setFinancingForm((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                      />
                                    </label>
                                    <div className="flex justify-end gap-3">
                                      <button
                                        onClick={() => setFinancingForm(null)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleCreateFinancing(invoice)}
                                        disabled={creatingFinancing}
                                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                                      >
                                        {creatingFinancing ? 'Creando...' : 'Crear plan'}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          <p>Seleccione un cliente para ver su estado de cuenta</p>
        </div>
      )}
    </div>
  );
};

export default AccountStatusTab;
