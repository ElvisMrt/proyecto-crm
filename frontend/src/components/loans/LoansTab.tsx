import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loansApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { HiPlus, HiSearch, HiEye, HiTrash, HiCheck, HiX, HiCalendar, HiCurrencyDollar, HiUser, HiExclamationCircle, HiPlay } from 'react-icons/hi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoanForm from './LoanForm';
import LoanDetail from './LoanDetail';

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
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'DELINQUENT' | 'PAID_OFF' | 'CANCELLED' | 'DEFAULTED';
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

const LoansTab = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchLoans();
    fetchClients();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [searchTerm, statusFilter, loans]);

  useEffect(() => {
    const loanId = searchParams.get('loanId');
    if (!loanId || loans.length === 0 || showDetail) {
      return;
    }

    const loanToOpen = loans.find((loan) => loan.id === loanId);
    if (!loanToOpen) {
      return;
    }

    setSelectedLoan(loanToOpen);
    setShowDetail(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('loanId');
      return next;
    }, { replace: true });
  }, [loans, searchParams, setSearchParams, showDetail]);

  const filterLoans = () => {
    let filtered = loans;

    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
    setCurrentPage(1);
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loansApi.getLoans({ limit: 100 });
      setLoans(response.data || []);
    } catch (error: any) {
      console.error('Error fetching loans:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar los préstamos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients();
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleApprove = async (loanId: string) => {
    try {
      await loansApi.approveLoan(loanId);
      showToast('Préstamo aprobado exitosamente', 'success');
      fetchLoans();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al aprobar el préstamo', 'error');
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      await loansApi.rejectLoan(loanId);
      showToast('Préstamo rechazado', 'info');
      fetchLoans();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al rechazar el préstamo', 'error');
    }
  };

  const handleDisburse = async (loanId: string) => {
    try {
      await loansApi.disburseLoan(loanId, { method: 'TRANSFER' });
      showToast('Préstamo desembolsado exitosamente', 'success');
      fetchLoans();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al desembolsar el préstamo', 'error');
    }
  };

  const handleCancel = async (loanId: string) => {
    try {
      await loansApi.cancelLoan(loanId);
      showToast('Préstamo cancelado', 'info');
      fetchLoans();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cancelar el préstamo', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-slate-100 text-slate-700';
      case 'SUBMITTED': return 'bg-indigo-100 text-indigo-700';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-rose-100 text-rose-700';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DELINQUENT': return 'bg-red-100 text-red-800';
      case 'PAID_OFF': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'DEFAULTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'DRAFT': return 'Borrador';
      case 'SUBMITTED': return 'Enviado';
      case 'UNDER_REVIEW': return 'En revision';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      case 'ACTIVE': return 'Activo';
      case 'DELINQUENT': return 'En Mora';
      case 'PAID_OFF': return 'Pagado';
      case 'CANCELLED': return 'Cancelado';
      case 'DEFAULTED': return 'Incumplido';
      default: return status;
    }
  };

  const canApprove = user?.role === 'ADMINISTRATOR' || user?.role === 'SUPERVISOR';

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, endIndex);

  // Calculate summary stats
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE').length;
  const delinquentLoans = loans.filter(loan => loan.status === 'DELINQUENT').length;
  const pendingLoans = loans.filter(loan => loan.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Préstamos</h2>
          <p className="text-sm text-gray-600 mt-1">Gestión de préstamos y financiamiento</p>
        </div>
        <button
          onClick={() => {
            setSelectedLoan(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Nuevo Préstamo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portafolio Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-50 rounded-lg p-3">
              <HiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Préstamos Activos</p>
              <p className="text-xl font-bold text-gray-900">{activeLoans}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-50 rounded-lg p-3">
              <HiExclamationCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Mora</p>
              <p className="text-xl font-bold text-gray-900">{delinquentLoans}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-50 rounded-lg p-3">
              <HiCalendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-xl font-bold text-gray-900">{pendingLoans}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o propósito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="DRAFT">Borradores</option>
              <option value="SUBMITTED">Enviados</option>
              <option value="UNDER_REVIEW">En revisión</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobados</option>
              <option value="REJECTED">Rechazados</option>
              <option value="ACTIVE">Activos</option>
              <option value="DELINQUENT">En Mora</option>
              <option value="PAID_OFF">Pagados</option>
              <option value="CANCELLED">Cancelados</option>
              <option value="DEFAULTED">Incumplidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando préstamos...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron préstamos' : 'No hay préstamos registrados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plazo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col">
                          <span>{loan.number}</span>
                          {loan.productType === 'FINANCED_SALE' && (
                            <span className="text-xs font-medium text-indigo-600">
                              Venta financiada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <HiUser className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{loan.client.name}</div>
                            <div className="text-xs text-gray-500">
                              {loan.saleInvoice ? `Origen: ${loan.saleInvoice.number}` : loan.client.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.interestRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.termMonths} meses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(loan.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowDetail(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalles"
                          >
                            <HiEye className="w-5 h-5" />
                          </button>
                          {['PENDING', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(loan.status) && canApprove && (
                            <>
                              <button
                                onClick={() => handleApprove(loan.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Aprobar"
                              >
                                <HiCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(loan.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Rechazar"
                              >
                                <HiX className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {loan.status === 'APPROVED' && canApprove && (
                            <button
                              onClick={() => handleDisburse(loan.id)}
                              className="text-cyan-600 hover:text-cyan-900"
                              title="Desembolsar"
                            >
                              <HiPlay className="w-5 h-5" />
                            </button>
                          )}
                          {(loan.status === 'ACTIVE' || loan.status === 'APPROVED') && (
                            <button
                              onClick={() => handleCancel(loan.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancelar"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredLoans.length)} de {filteredLoans.length} préstamos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loan Form Modal */}
      {showForm && (
        <LoanForm
          loan={selectedLoan || undefined}
          clients={clients}
          onClose={() => {
            setShowForm(false);
            setSelectedLoan(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedLoan(null);
            fetchLoans();
          }}
        />
      )}

      {/* Loan Detail Modal */}
      {showDetail && selectedLoan && (
        <LoanDetail
          loan={selectedLoan}
          onUpdated={fetchLoans}
          onClose={() => {
            setShowDetail(false);
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
};

export default LoansTab;
