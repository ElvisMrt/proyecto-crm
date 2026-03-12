import { useState, useEffect } from 'react';
import { loansApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiX, HiSave, HiCalculator, HiUser, HiCurrencyDollar, HiCalendar } from 'react-icons/hi';
import { formatCurrency } from '../../utils/formatters';

interface Loan {
  id?: string;
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
  startDate: string;
  purpose: string;
  collateral?: string;
  guarantee?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit?: number;
  activeLoans?: number;
}

interface PaymentCalculation {
  paymentNumber: number;
  principal: number;
  interest: number;
  total: number;
  balance: number;
  dueDate: string;
}

type PaymentFrequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

interface LoanFormProps {
  loan?: Loan | null;
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ loan, clients, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentCalculation[]>([]);
  
  const [formData, setFormData] = useState({
    clientId: loan?.client?.id || '',
    amount: loan?.amount || 0,
    interestRate: loan?.interestRate || 10,
    termMonths: loan?.termMonths || 12,
    paymentFrequency: (loan?.paymentFrequency || 'MONTHLY') as PaymentFrequency,
    startDate: loan?.startDate || new Date().toISOString().split('T')[0],
    purpose: loan?.purpose || '',
    collateral: loan?.collateral || '',
    guarantee: loan?.guarantee || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formData.amount && formData.interestRate && formData.termMonths) {
      calculatePaymentSchedule();
    }
  }, [formData.amount, formData.interestRate, formData.termMonths, formData.paymentFrequency, formData.startDate]);

  const getPeriods = (termMonths: number, frequency: PaymentFrequency) => {
    switch (frequency) {
      case 'BIWEEKLY':
        return termMonths * 2;
      case 'WEEKLY':
        return termMonths * 4;
      default:
        return termMonths;
    }
  };

  const getPeriodicRate = (annualRate: number, frequency: PaymentFrequency) => {
    switch (frequency) {
      case 'BIWEEKLY':
        return annualRate / 26 / 100;
      case 'WEEKLY':
        return annualRate / 52 / 100;
      default:
        return annualRate / 12 / 100;
    }
  };

  const addPeriod = (dateString: string, frequency: PaymentFrequency, periods: number) => {
    const nextDate = new Date(dateString);

    if (frequency === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + periods);
    } else if (frequency === 'BIWEEKLY') {
      nextDate.setDate(nextDate.getDate() + (14 * periods));
    } else {
      nextDate.setDate(nextDate.getDate() + (7 * periods));
    }

    return nextDate;
  };

  const calculatePaymentSchedule = () => {
    const principal = formData.amount;
    const annualRate = formData.interestRate;
    const totalPeriods = getPeriods(formData.termMonths, formData.paymentFrequency);
    const periodicRate = getPeriodicRate(annualRate, formData.paymentFrequency);

    if (principal <= 0 || totalPeriods <= 0 || annualRate < 0) {
      setPaymentSchedule([]);
      return;
    }

    const installment = periodicRate === 0
      ? principal / totalPeriods
      : principal * ((periodicRate * Math.pow(1 + periodicRate, totalPeriods)) /
        (Math.pow(1 + periodicRate, totalPeriods) - 1));

    const schedule: PaymentCalculation[] = [];
    let balance = principal;

    for (let i = 1; i <= totalPeriods; i++) {
      const interestPayment = periodicRate === 0 ? 0 : balance * periodicRate;
      const principalPayment = i === totalPeriods
        ? balance
        : Math.min(balance, installment - interestPayment);
      const totalPaymentAmount = principalPayment + interestPayment;
      balance = Math.max(0, balance - principalPayment);
      const dueDate = addPeriod(formData.startDate, formData.paymentFrequency, i - 1);

      schedule.push({
        paymentNumber: i,
        principal: principalPayment,
        interest: interestPayment,
        total: totalPaymentAmount,
        balance,
        dueDate: dueDate.toISOString().split('T')[0]
      });
    }

    setPaymentSchedule(schedule);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) newErrors.clientId = 'Seleccione un cliente';
    if (formData.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0';
    if (formData.interestRate < 0) newErrors.interestRate = 'La tasa de interés no puede ser negativa';
    if (formData.termMonths <= 0) newErrors.termMonths = 'El plazo debe ser mayor a 0';
    if (!formData.purpose.trim()) newErrors.purpose = 'Ingrese el propósito del préstamo';
    if (!formData.startDate) newErrors.startDate = 'Seleccione la fecha de inicio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const loanData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        interestRate: parseFloat(formData.interestRate.toString()),
        termMonths: parseInt(formData.termMonths.toString())
      };

      if (loan?.id) {
        await loansApi.updateLoan(loan.id, loanData);
        showToast('Préstamo actualizado exitosamente', 'success');
      } else {
        await loansApi.createLoan(loanData);
        showToast('Préstamo creado exitosamente', 'success');
      }

      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar el préstamo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const totalPayment = paymentSchedule.reduce((sum, p) => sum + p.total, 0);
  const totalInterest = totalPayment - formData.amount;
  const paymentFrequencyLabel = {
    MONTHLY: 'Cuota mensual',
    BIWEEKLY: 'Cuota quincenal',
    WEEKLY: 'Cuota semanal',
  }[formData.paymentFrequency];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {loan?.id ? 'Editar Préstamo' : 'Nuevo Préstamo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <HiUser className="inline w-4 h-4 mr-1" />
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
              
              {selectedClient && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <div>Límite de crédito: {formatCurrency(selectedClient.creditLimit || 0)}</div>
                  <div>Préstamos activos: {selectedClient.activeLoans || 0}</div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <HiCurrencyDollar className="inline w-4 h-4 mr-1" />
                Monto del Préstamo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Interés Anual (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="10.0"
                step="0.1"
                min="0"
                max="100"
                required
              />
              {errors.interestRate && <p className="text-red-500 text-xs mt-1">{errors.interestRate}</p>}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <HiCalendar className="inline w-4 h-4 mr-1" />
                Plazo (meses) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.termMonths}
                onChange={(e) => setFormData({ ...formData, termMonths: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="12"
                min="1"
                max="360"
                required
              />
              {errors.termMonths && <p className="text-red-500 text-xs mt-1">{errors.termMonths}</p>}
            </div>

            {/* Payment Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia de Pago
              </label>
              <select
                value={formData.paymentFrequency}
                onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MONTHLY">Mensual</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="WEEKLY">Semanal</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propósito del Préstamo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describa el propósito del préstamo..."
              required
            />
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
          </div>

          {/* Collateral and Guarantee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garantía (Opcional)
              </label>
              <textarea
                value={formData.collateral}
                onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Describa la garantía del préstamo..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aval (Opcional)
              </label>
              <input
                type="text"
                value={formData.guarantee}
                onChange={(e) => setFormData({ ...formData, guarantee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del aval..."
              />
            </div>
          </div>

          {/* Calculator Summary */}
          {paymentSchedule.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-blue-900">Resumen del Préstamo</h4>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <HiCalculator className="w-4 h-4 mr-1" />
                  {showCalculator ? 'Ocultar' : 'Ver'} tabla de amortización
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Monto Principal:</span>
                  <div className="font-semibold text-blue-900">{formatCurrency(formData.amount)}</div>
                </div>
                <div>
                  <span className="text-blue-700">{paymentFrequencyLabel}:</span>
                  <div className="font-semibold text-blue-900">{formatCurrency(paymentSchedule[0]?.total || 0)}</div>
                </div>
                <div>
                  <span className="text-blue-700">Total Intereses:</span>
                  <div className="font-semibold text-blue-900">{formatCurrency(totalInterest)}</div>
                </div>
                <div>
                  <span className="text-blue-700">Total a Pagar:</span>
                  <div className="font-semibold text-blue-900">{formatCurrency(totalPayment)}</div>
                </div>
              </div>

              {showCalculator && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">Fecha</th>
                        <th className="px-2 py-1 text-right">Capital</th>
                        <th className="px-2 py-1 text-right">Interés</th>
                        <th className="px-2 py-1 text-right">Cuota</th>
                        <th className="px-2 py-1 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((payment) => (
                        <tr key={payment.paymentNumber} className="border-t border-blue-200">
                          <td className="px-2 py-1">{payment.paymentNumber}</td>
                          <td className="px-2 py-1">{new Date(payment.dueDate).toLocaleDateString()}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(payment.principal)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(payment.interest)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(payment.total)}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(payment.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <HiSave className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : (loan?.id ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanForm;
