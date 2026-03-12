import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loansApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiX, HiUser, HiCheck, HiXCircle, HiExclamationCircle, HiClock, HiDownload, HiMail, HiRefresh, HiPlay, HiChatAlt2 } from 'react-icons/hi';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface Loan {
  id: string;
  number: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: string;
  productType?: 'CASH_LOAN' | 'FINANCED_SALE';
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'DELINQUENT' | 'PAID_OFF' | 'CANCELLED' | 'DEFAULTED';
  purpose: string;
  collateral?: string;
  guarantee?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  paidAmount?: number;
  remainingAmount?: number;
  nextPaymentDate?: string;
  overdueDays?: number;
  saleInvoice?: {
    id: string;
    number: string;
    balance: number;
    total: number;
    issueDate: string;
    dueDate?: string;
  } | null;
}

interface Payment {
  id: string;
  paymentId?: string | null;
  paymentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidAt?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  lateFee: number;
  notes?: string;
}

interface LoanDetailProps {
  loan: Loan;
  onClose: () => void;
  onUpdated?: () => void;
}

const LoanDetail: React.FC<LoanDetailProps> = ({ loan, onClose, onUpdated }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'schedule'>('info');
  const [loanData, setLoanData] = useState<Loan>(loan);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Payment | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    observations: '',
  });

  useEffect(() => {
    setLoanData(loan);
  }, [loan]);

  useEffect(() => {
    fetchLoan();
  }, [loan.id]);

  useEffect(() => {
    if (activeTab === 'payments' || activeTab === 'schedule') {
      fetchPayments();
    }
  }, [activeTab, loan.id]);

  const fetchLoan = async () => {
    try {
      const response = await loansApi.getLoan(loan.id);
      setLoanData(response.data);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar el préstamo', 'error');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await loansApi.getLoanPayments(loan.id);
      setPayments(response.data || []);
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cargar los pagos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DELINQUENT': return 'bg-red-100 text-red-800';
      case 'PAID_OFF': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'DEFAULTED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'ACTIVE': return 'Activo';
      case 'DELINQUENT': return 'En Mora';
      case 'PAID_OFF': return 'Pagado';
      case 'CANCELLED': return 'Cancelado';
      case 'DEFAULTED': return 'Incumplido';
      case 'PAID': return 'Pagado';
      case 'OVERDUE': return 'Vencido';
      case 'PARTIAL': return 'Parcial';
      default: return status;
    }
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const overduePayments = payments.filter(p => p.status === 'OVERDUE').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL' || p.status === 'OVERDUE').length;
  const visiblePayments = activeTab === 'payments'
    ? payments.filter((payment) => payment.paidAmount > 0)
    : payments;

  const openPaymentModal = (installment: Payment) => {
    const outstanding = Math.max(0, installment.totalAmount - installment.paidAmount);
    setSelectedInstallment(installment);
    setPaymentForm({
      amount: outstanding.toFixed(2),
      method: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      observations: '',
    });
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedInstallment(null);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstallment) {
      return;
    }

    const amount = Number(paymentForm.amount);
    const outstanding = Math.max(0, selectedInstallment.totalAmount - selectedInstallment.paidAmount);

    if (!amount || amount <= 0) {
      showToast('Ingrese un monto de pago valido', 'error');
      return;
    }

    if (amount > outstanding) {
      showToast('El monto no puede exceder el saldo pendiente de la cuota', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);
      const response = await loansApi.createLoanPayment(loan.id, {
        installmentId: selectedInstallment.id,
        amount,
        method: paymentForm.method,
        paymentDate: paymentForm.paymentDate,
        reference: paymentForm.reference || undefined,
        observations: paymentForm.observations || undefined,
      });

      if (response.data?.receiptUrl) {
        window.open(response.data.receiptUrl, '_blank');
      }
      showToast('Pago registrado exitosamente', 'success');
      closePaymentModal();
      await Promise.all([fetchLoan(), fetchPayments()]);
      onUpdated?.();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al registrar pago', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDisburse = async () => {
    try {
      const response = await loansApi.disburseLoan(loan.id, { method: 'TRANSFER' });
      if (response.data?.disbursementReceiptUrl) {
        window.open(response.data.disbursementReceiptUrl, '_blank');
      }
      showToast('Préstamo desembolsado exitosamente', 'success');
      await fetchLoan();
      onUpdated?.();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al desembolsar el préstamo', 'error');
    }
  };

  const handleReversePayment = async (payment: Payment) => {
    if (!payment.paymentId) {
      showToast('No hay un pago aplicado para revertir', 'error');
      return;
    }
    const reason = window.prompt('Motivo de reversión del pago');
    if (!reason) return;

    try {
      setBusyPaymentId(payment.id);
      await loansApi.reverseLoanPayment(loan.id, payment.paymentId, { reason });
      showToast('Pago revertido exitosamente', 'success');
      await Promise.all([fetchLoan(), fetchPayments()]);
      onUpdated?.();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al revertir pago', 'error');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleSendReceiptEmail = async (payment: Payment) => {
    if (!payment.paymentId) {
      showToast('No hay un comprobante disponible para enviar', 'error');
      return;
    }
    try {
      setBusyPaymentId(payment.id);
      await loansApi.sendLoanPaymentReceiptEmail(loan.id, payment.paymentId);
      showToast('Comprobante enviado por correo', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al enviar comprobante', 'error');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleSendReceiptWhatsApp = async (payment: Payment) => {
    if (!payment.paymentId) {
      showToast('No hay un comprobante disponible para enviar', 'error');
      return;
    }
    try {
      setBusyPaymentId(payment.id);
      await loansApi.sendLoanPaymentReceiptWhatsApp(loan.id, payment.paymentId);
      showToast('Comprobante enviado por WhatsApp', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al enviar comprobante por WhatsApp', 'error');
    } finally {
      setBusyPaymentId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Detalles del Préstamo</h3>
            <p className="text-sm text-gray-600">
              {loan.number}
              {loanData.productType === 'FINANCED_SALE' ? ' · Venta financiada' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loanData.status === 'APPROVED' && (
              <button
                onClick={handleDisburse}
                className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <span className="inline-flex items-center gap-2">
                  <HiPlay className="h-4 w-4" />
                  Desembolsar
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-slate-900 text-slate-950'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              Información General
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-slate-900 text-slate-950'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              Cobros
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-slate-900 text-slate-950'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              Cronograma
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Loan Status Card */}
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-slate-950">Estado del Préstamo</h4>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loanData.status)}`}>
                  {getStatusText(loanData.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <span className="text-sm text-slate-600">Monto Original</span>
                    <div className="text-lg font-semibold text-slate-950">{formatCurrency(loanData.amount)}</div>
                </div>
                <div>
                    <span className="text-sm text-slate-600">Pagado hasta la fecha</span>
                    <div className="text-lg font-semibold text-emerald-700">{formatCurrency(loanData.paidAmount ?? totalPaid)}</div>
                </div>
                <div>
                    <span className="text-sm text-slate-600">Saldo Pendiente</span>
                    <div className="text-lg font-semibold text-rose-700">{formatCurrency(loanData.remainingAmount ?? 0)}</div>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h4 className="mb-4 text-lg font-medium text-slate-950">Información del Préstamo</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Número:</span>
                    <span className="text-sm font-medium">{loanData.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Monto:</span>
                    <span className="text-sm font-medium">{formatCurrency(loanData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tipo:</span>
                    <span className="text-sm font-medium">
                      {loanData.productType === 'FINANCED_SALE' ? 'Venta financiada' : 'Préstamo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tasa de Interés:</span>
                    <span className="text-sm font-medium">{loanData.interestRate}% anual</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Plazo:</span>
                    <span className="text-sm font-medium">{loanData.termMonths} meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Frecuencia:</span>
                    <span className="text-sm font-medium">{loanData.paymentFrequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Fecha Inicio:</span>
                    <span className="text-sm font-medium">{formatDate(loanData.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Fecha Vencimiento:</span>
                    <span className="text-sm font-medium">{formatDate(loanData.endDate)}</span>
                  </div>
                  {loanData.nextPaymentDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Proximo Pago:</span>
                      <span className="text-sm font-medium">{formatDate(loanData.nextPaymentDate)}</span>
                    </div>
                  )}
                  {loanData.saleInvoice && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 text-sm font-medium text-slate-900">Origen del financiamiento</div>
                      <div className="text-sm text-slate-700">
                        Factura {loanData.saleInvoice.number}
                      </div>
                      <div className="text-xs text-slate-600">
                        Total {formatCurrency(loanData.saleInvoice.total)} · Balance actual {formatCurrency(loanData.saleInvoice.balance)}
                      </div>
                      <button
                        onClick={() => navigate(`/sales/invoices/${loanData.saleInvoice?.id}`)}
                        className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Ver factura
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h4 className="mb-4 text-lg font-medium text-slate-950">Información del Cliente</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <HiUser className="mr-2 h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium">{loanData.client.name}</div>
                      <div className="text-xs text-slate-500">{loanData.client.email}</div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Teléfono:</span>
                    <span className="text-sm font-medium">{loanData.client.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Propósito:</span>
                    <span className="text-sm font-medium text-right max-w-xs">{loanData.purpose}</span>
                  </div>
                  {loanData.collateral && (
                    <div>
                      <span className="text-sm text-slate-600">Garantía:</span>
                      <div className="text-sm font-medium mt-1">{loanData.collateral}</div>
                    </div>
                  )}
                  {loanData.guarantee && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Aval:</span>
                      <span className="text-sm font-medium">{loanData.guarantee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts */}
            {loanData.status === 'DELINQUENT' && (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start">
                  <HiExclamationCircle className="mr-3 mt-0.5 h-5 w-5 text-rose-700" />
                  <div>
                    <h3 className="text-sm font-medium text-rose-800">Préstamo en Mora</h3>
                    <p className="mt-1 text-sm text-rose-700">
                      Este préstamo tiene pagos vencidos. Por favor contacte al cliente para regularizar la situación.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'payments' || activeTab === 'schedule') && (
          <div>
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <HiCheck className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <div className="text-sm text-green-800">Pagados</div>
                    <div className="text-lg font-semibold text-green-900">
                      {payments.filter(p => p.status === 'PAID').length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <HiClock className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <div className="text-sm text-yellow-800">Pendientes / Parciales</div>
                    <div className="text-lg font-semibold text-yellow-900">
                      {pendingPayments}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <HiXCircle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <div className="text-sm text-red-800">Vencidos</div>
                    <div className="text-lg font-semibold text-red-900">{overduePayments}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando pagos...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capital</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visiblePayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {payment.paymentNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.principalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.interestAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatCurrency(payment.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.paidAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {getStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paidAt ? formatDateTime(payment.paidAt) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-3">
                              {(loanData.status === 'ACTIVE' || loanData.status === 'DELINQUENT') &&
                              ['PENDING', 'PARTIAL', 'OVERDUE'].includes(payment.status) ? (
                                <button
                                  onClick={() => openPaymentModal(payment)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Registrar pago
                                </button>
                              ) : null}
                              {payment.paidAmount > 0 && (
                                <>
                                  <button
                                    onClick={() => handleSendReceiptEmail(payment)}
                                    disabled={busyPaymentId === payment.id}
                                    className="text-amber-600 hover:text-amber-800"
                                    title="Enviar comprobante"
                                  >
                                    <HiMail className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleSendReceiptWhatsApp(payment)}
                                    disabled={busyPaymentId === payment.id}
                                    className="text-emerald-600 hover:text-emerald-800"
                                    title="Enviar por WhatsApp"
                                  >
                                    <HiChatAlt2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReversePayment(payment)}
                                    disabled={busyPaymentId === payment.id}
                                    className="text-rose-600 hover:text-rose-800"
                                    title="Revertir pago"
                                  >
                                    <HiRefresh className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {payment.receiptUrl && (
                                <a
                                  href={payment.receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-600 hover:text-slate-800"
                                  title="Descargar comprobante"
                                >
                                  <HiDownload className="h-4 w-4" />
                                </a>
                              )}
                              {!payment.receiptUrl && payment.paidAmount <= 0 && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {visiblePayments.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                            {activeTab === 'payments'
                              ? 'Aun no hay cobros registrados para este prestamo'
                              : 'No hay cuotas generadas para este prestamo'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {paymentModalOpen && selectedInstallment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Registrar pago</h4>
                <p className="text-sm text-gray-600">
                  Cuota #{selectedInstallment.paymentNumber} - saldo pendiente {formatCurrency(selectedInstallment.totalAmount - selectedInstallment.paidAmount)}
                </p>
              </div>
              <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Math.max(0, selectedInstallment.totalAmount - selectedInstallment.paidAmount)}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((current) => ({ ...current, amount: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Método</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm((current) => ({ ...current, method: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CARD">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de pago</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((current) => ({ ...current, paymentDate: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Referencia</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((current) => ({ ...current, reference: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Numero de recibo, transferencia o nota"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  value={paymentForm.observations}
                  onChange={(e) => setPaymentForm((current) => ({ ...current, observations: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detalle adicional del cobro"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPayment ? 'Registrando...' : 'Registrar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetail;
