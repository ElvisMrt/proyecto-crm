import { useState, useEffect } from 'react';
import { receivablesApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiSearch, HiUser, HiCheckCircle, HiCash } from 'react-icons/hi';

interface Client {
  id: string;
  name: string;
  identification: string;
}

interface Invoice {
  id: string;
  number: string;
  balance: number;
  total: number;
  principalBalance?: number;
  dueDate?: string | null;
  status?: string;
  financingPlan?: {
    id: string;
    installmentAmount: number;
    totalFinanced: number;
    totalInterest: number;
    remainingAmount: number;
    paidAmount: number;
    status: string;
  } | null;
}

interface PaymentForm {
  clientId: string;
  invoiceIds: string[];
  invoicePayments: Array<{ invoiceId: string; amount: number }>;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'CARD';
  reference: string;
  paymentDate: string;
  observations: string;
}

interface PaymentRegisterTabProps {
  branchId?: string;
  initialClientId?: string;
  initialInvoiceIds?: string[];
  onPaymentCreated?: () => void;
  onNavigateToStatus?: (clientId: string) => void;
}

const PaymentRegisterTab = ({ branchId, initialClientId, initialInvoiceIds, onPaymentCreated, onNavigateToStatus }: PaymentRegisterTabProps) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<PaymentForm>({
    clientId: '',
    invoiceIds: [],
    invoicePayments: [],
    amount: 0,
    method: 'CASH',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    observations: '',
  });
  const [loading, setLoading] = useState(false);
  const [distributionMode, setDistributionMode] = useState<'auto' | 'manual'>('auto');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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
      fetchClientInvoices(selectedClientId);
      setForm(prev => ({ ...prev, clientId: selectedClientId }));
    }
  }, [selectedClientId, branchId]);

  useEffect(() => {
    if (initialInvoiceIds && initialInvoiceIds.length > 0 && invoices.length > 0) {
      // Pre-select invoices
      const newInvoiceIds = initialInvoiceIds.filter(id => 
        invoices.some(inv => inv.id === id && inv.balance > 0)
      );
      if (newInvoiceIds.length > 0) {
        const total = newInvoiceIds.reduce((sum, id) => {
          const invoice = invoices.find(inv => inv.id === id);
          return sum + (invoice ? invoice.balance : 0);
        }, 0);
        setForm(prev => ({
          ...prev,
          invoiceIds: newInvoiceIds,
          invoicePayments: newInvoiceIds.map(id => {
            const invoice = invoices.find(inv => inv.id === id);
            return { invoiceId: id, amount: invoice ? invoice.balance : 0 };
          }),
          amount: total,
        }));
      }
    }
  }, [initialInvoiceIds, invoices]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientInvoices = async (clientId: string) => {
    try {
      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }
      const accountStatus = await receivablesApi.getStatus(clientId, params);
      const pendingInvoices = accountStatus.invoices.filter((inv: any) => inv.balance > 0);
      setInvoices(pendingInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleInvoiceToggle = (invoiceId: string) => {
    setForm((prev) => {
      if (prev.invoiceIds.includes(invoiceId)) {
        const nextInvoiceIds = prev.invoiceIds.filter((id) => id !== invoiceId);
        const nextInvoicePayments = prev.invoicePayments.filter((ip) => ip.invoiceId !== invoiceId);

        return {
          ...prev,
          invoiceIds: nextInvoiceIds,
          invoicePayments: nextInvoicePayments,
          amount: calculateTotal(nextInvoiceIds, nextInvoicePayments),
        };
      }

      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return prev;

      const nextInvoiceIds = [...prev.invoiceIds, invoiceId];
      const nextInvoicePayments = [...prev.invoicePayments, { invoiceId, amount: invoice.balance }];

      return {
        ...prev,
        invoiceIds: nextInvoiceIds,
        invoicePayments: nextInvoicePayments,
        amount: calculateTotal(nextInvoiceIds, nextInvoicePayments),
      };
    });
  };

  const handleInvoiceAmountChange = (invoiceId: string, amount: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const maxAmount = invoice.balance;
    const actualAmount = Math.min(amount, maxAmount);

    setForm((prev) => {
      const nextInvoicePayments = prev.invoicePayments.map((ip) =>
        ip.invoiceId === invoiceId ? { ...ip, amount: actualAmount } : ip
      );

      return {
        ...prev,
        invoicePayments: nextInvoicePayments,
        amount: calculateTotal(prev.invoiceIds, nextInvoicePayments),
      };
    });
  };

  const calculateTotal = (
    invoiceIds: string[],
    invoicePayments: Array<{ invoiceId: string; amount: number }>
  ) => {
    if (distributionMode === 'manual') {
      return invoicePayments.reduce((sum, ip) => sum + ip.amount, 0);
    } else {
      const selectedInvoices = invoices.filter((inv) => invoiceIds.includes(inv.id));
      return selectedInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    }
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      amount: calculateTotal(prev.invoiceIds, prev.invoicePayments),
    }));
  }, [distributionMode, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.clientId) {
      showToast('Seleccione un cliente', 'error');
      return;
    }

    if (form.amount <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }

    try {
      setLoading(true);
      const paymentData: any = {
        clientId: form.clientId,
        amount: form.amount,
        method: form.method,
        reference: form.reference || undefined,
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
        observations: form.observations || undefined,
      };

      if (distributionMode === 'manual' && form.invoicePayments.length > 0) {
        paymentData.invoicePayments = form.invoicePayments;
      } else if (form.invoiceIds.length > 0) {
        paymentData.invoiceIds = form.invoiceIds;
      }

      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }

      await receivablesApi.createPayment(paymentData, params);
      showToast('Pago registrado exitosamente', 'success');
      
      // Reset form
      setForm({
        clientId: '',
        invoiceIds: [],
        invoicePayments: [],
        amount: 0,
        method: 'CASH',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0],
        observations: '',
      });
      setSelectedClientId('');
      setInvoices([]);
      setSearchTerm('');
      setShowSuggestions(false);
      
      if (onPaymentCreated) {
        onPaymentCreated();
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      showToast(error.response?.data?.error?.message || 'Error al registrar el pago', 'error');
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.identification && client.identification.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Registrar pago</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente con Buscador */}
          <div>
              <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                <HiSearch className="mr-1 h-4 w-4 text-slate-500 dark:text-slate-400" />
                Buscar Cliente *
              </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiUser className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Haz click para ver clientes o escribe para buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                  if (!e.target.value) {
                    setSelectedClientId('');
                    setInvoices([]);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onClick={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              />
              
              {/* Sugerencias */}
              {showSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                  <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {filteredClients.length} cliente(s) encontrado(s)
                    </p>
                  </div>
                  {filteredClients.map((client, index) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full border-b border-slate-100 px-3 py-3 text-left transition-all last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${
                        index === highlightedIndex ? 'bg-slate-50 dark:bg-slate-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                            <HiUser className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{client.name}</p>
                            {client.identification && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">ID: {client.identification}</p>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No hay resultados */}
              {showSuggestions && searchTerm && filteredClients.length === 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">No se encontraron clientes</p>
                </div>
              )}
            </div>
            
            {/* Cliente seleccionado */}
            {selectedClientId && clients.find(c => c.id === selectedClientId) && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center">
                  <HiCheckCircle className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cliente seleccionado</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {clients.find(c => c.id === selectedClientId)?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modo de Distribución */}
          {selectedClientId && invoices.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Modo de distribución</label>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:gap-4">
                <label className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    value="auto"
                    checked={distributionMode === 'auto'}
                    onChange={(e) => setDistributionMode(e.target.value as 'auto' | 'manual')}
                    className="mr-2"
                  />
                  Automática (proporcional)
                </label>
                <label className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    value="manual"
                    checked={distributionMode === 'manual'}
                    onChange={(e) => setDistributionMode(e.target.value as 'auto' | 'manual')}
                    className="mr-2"
                  />
                  Manual (especificar monto por factura)
                </label>
              </div>
            </div>
          )}

          {/* Facturas Pendientes */}
          {selectedClientId && invoices.length > 0 && (
            <div>
              <label className="mb-2 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                <HiCash className="mr-1 h-4 w-4 text-slate-500 dark:text-slate-400" />
                Facturas Pendientes ({invoices.length})
              </label>
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border-b border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={form.invoiceIds.includes(invoice.id)}
                          onChange={() => handleInvoiceToggle(invoice.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{invoice.number}</div>
                            {invoice.financingPlan && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                Financiada
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Balance a cobrar: {formatCurrency(invoice.balance)}
                          </div>
                          {invoice.financingPlan ? (
                            <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <div>Cuota: {formatCurrency(invoice.financingPlan.installmentAmount)}</div>
                              <div>Capital pendiente: {formatCurrency(invoice.principalBalance || 0)}</div>
                              <div>Saldo financiado: {formatCurrency(invoice.financingPlan.remainingAmount)}</div>
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Vence: {formatDate(invoice.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      {distributionMode === 'manual' && form.invoiceIds.includes(invoice.id) && (
                        <input
                          type="number"
                          min="0"
                          max={invoice.balance}
                          step="0.01"
                          value={
                            form.invoicePayments.find((ip) => ip.invoiceId === invoice.id)?.amount || 0
                          }
                          onChange={(e) =>
                            handleInvoiceAmountChange(invoice.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-32 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          placeholder="Monto"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monto Total */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Monto Total *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Método de Pago *</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as any })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CARD">Tarjeta</option>
            </select>
          </div>

          {/* Referencia */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Referencia</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Número de referencia (opcional)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Pago</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </form>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">Resumen</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Facturas seleccionadas</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{form.invoiceIds.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Monto total</span>
            <span className="text-lg font-bold text-slate-950 dark:text-white">{formatCurrency(form.amount)}</span>
          </div>
          {form.invoiceIds.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Detalle seleccionado</p>
              <div className="space-y-1">
                {invoices
                  .filter((inv) => form.invoiceIds.includes(inv.id))
                  .map((inv) => (
                    <div key={inv.id} className="text-xs text-slate-600 dark:text-slate-300">
                      <span>{inv.number}: {formatCurrency(inv.balance)}</span>
                      {inv.financingPlan && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                          cuota {formatCurrency(inv.financingPlan.installmentAmount)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRegisterTab;
