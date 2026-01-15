import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, branchesApi, salesApi, crmApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  HiCurrencyDollar,
  HiCalendar,
  HiCash,
  HiOfficeBuilding,
  HiLockClosed,
  HiLockOpen,
  HiCheckCircle,
  HiArrowUp,
  HiArrowDown,
  HiPlus,
  HiDownload,
  HiTrendingUp,
  HiShoppingCart,
  HiDocumentText,
  HiClipboardCheck,
} from 'react-icons/hi';

interface DashboardSummary {
  salesToday: {
    amount: number;
    trend: number;
  };
  salesMonth: {
    amount: number;
    progress: number;
  };
  receivables: {
    total: number;
    overdue: number;
  };
  cash: {
    currentBalance: number;
    status: string;
    branchId: string | null;
    branchName: string | null;
  };
  stock: {
    lowStockCount: number;
  };
  tasks: {
    pending: number;
    overdue: number;
  };
  alerts: {
    overdueInvoices: number;
    lowStock: number;
    unclosedCash: number;
    ncfAboutToExpire: number;
    overdueTasks: number;
  };
}

interface Activity {
  date: string;
  type: string;
  reference: string;
  amount: number;
  client: string;
  user: string;
}

interface SalesTrend {
  period: string;
  data: Array<{
    date: string;
    amount: number;
  }>;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [trendDays, setTrendDays] = useState(7);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [invoicesPagination, setInvoicesPagination] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [crmSummary, setCrmSummary] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [summaryData, activitiesData, trendData, invoicesData, tasksData, crmData] = await Promise.all([
        dashboardApi.getSummary(selectedBranch ? { branchId: selectedBranch } : undefined),
        dashboardApi.getRecentActivity(10, selectedBranch ? { branchId: selectedBranch } : undefined),
        dashboardApi.getSalesTrend(trendDays),
        salesApi.getInvoices({ limit: 100, page: 1, ...(selectedBranch ? { branchId: selectedBranch } : {}) }),
        crmApi.getTasks({ limit: 5, status: 'PENDING' }),
        crmApi.getSummary(),
      ]);
      setSummary(summaryData);
      setActivities(activitiesData.activities || []);
      setSalesTrend(trendData);
      // Usar pagination.total si está disponible para el conteo real
      const invoicesList = invoicesData.data || invoicesData || [];
      setRecentInvoices(invoicesList);
      setInvoicesPagination(invoicesData.pagination || null);
      setRecentTasks(tasksData.data || tasksData || []);
      setCrmSummary(crmData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedBranch, trendDays]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
    }
  };

  // Calcular altura máxima del gráfico
  const maxAmount = salesTrend?.data.reduce((max, item) => Math.max(max, item.amount), 0) || 1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
      case 'ISSUED':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'COMPLETED': 'Completado',
      'IN_PROGRESS': 'En Progreso',
      'PENDING': 'Pendiente',
      'OVERDUE': 'Vencida',
      'ISSUED': 'Emitida',
      'PAID': 'Pagada',
      'CANCELLED': 'Anulada',
    };
    return labels[status] || status;
  };

  // Calcular estadísticas basadas en datos reales de la base de datos
  // Todos los datos vienen de la API, no hay datos ficticios
  // Usar pagination.total si está disponible para el conteo real, sino usar el length
  const totalInvoicesCount = invoicesPagination?.total || recentInvoices.length;
  const paidInvoicesCount = recentInvoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoicesCount = summary?.receivables?.overdue || 0; // Datos reales del summary de la API
  
  // Calcular progreso de tareas basado en datos reales del CRM
  // Usar los datos del summary que ahora incluye completedTasks y completionPercentage
  const totalTasks = crmSummary?.totalTasks || 0;
  const completedTasks = crmSummary?.completionPercentage || 0;
  const completedTasksCount = crmSummary?.completedTasks || 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Planifica, prioriza y completa tus tareas con facilidad.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/sales/new-invoice')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
          <button
            onClick={() => navigate('/crm')}
            className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del Mes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <HiShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Ventas del Mes</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary?.salesMonth?.amount || 0)}</p>
            {summary?.salesToday?.trend !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${summary.salesToday.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.salesToday.trend >= 0 ? (
                  <HiArrowUp className="w-4 h-4 mr-1" />
                ) : (
                  <HiArrowDown className="w-4 h-4 mr-1" />
                )}
                <span>{Math.abs(summary.salesToday.trend).toFixed(1)}% vs mes pasado</span>
              </div>
            )}
          </div>
        </div>

        {/* Facturas Pagadas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Facturas</p>
            <p className="text-3xl font-bold text-gray-900">{totalInvoicesCount}</p>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <span>{paidInvoicesCount} pagadas</span>
            </div>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <HiCurrencyDollar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Por Cobrar</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary?.receivables?.total || 0)}</p>
            {pendingInvoicesCount > 0 && (
              <div className="flex items-center mt-2 text-sm text-red-600">
                <span>{pendingInvoicesCount} vencidas</span>
              </div>
            )}
          </div>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <HiClipboardCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tareas Pendientes</p>
            <p className="text-3xl font-bold text-gray-900">{crmSummary?.pendingTasks || 0}</p>
            {crmSummary?.overdueTasks > 0 && (
              <div className="flex items-center mt-2 text-sm text-red-600">
                <span>{crmSummary.overdueTasks} vencidas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sales Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Análisis de Ventas</h2>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Últimos 7 Días</option>
                <option value={14}>Últimos 14 Días</option>
                <option value={30}>Últimos 30 Días</option>
              </select>
            </div>
            {salesTrend && salesTrend.data.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2">
                {salesTrend.data.map((item, index) => {
                  const height = (item.amount / maxAmount) * 100;
                  const date = new Date(item.date);
                  const dayLabel = date.toLocaleDateString('es-DO', { weekday: 'short' }).charAt(0).toUpperCase();
                  const isHigh = height > 50;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full">
                      <div className="relative w-full flex items-end justify-center flex-1" style={{ minHeight: '200px' }}>
                        <div
                          className={`w-full rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group ${
                            isHigh ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                          style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                          title={`${formatCurrency(item.amount)} - ${date.toLocaleDateString('es-DO')}`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 font-medium">
                        {dayLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay datos para mostrar
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              <button 
                onClick={() => navigate('/sales')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todo
              </button>
            </div>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <HiCurrencyDollar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.reference}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {activity.amount > 0 ? formatCurrency(activity.amount) : '-'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay actividad reciente
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reminders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recordatorios</h2>
            {crmSummary?.reminders > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Tienes {crmSummary.reminders} recordatorio{crmSummary.reminders > 1 ? 's' : ''}</p>
                <button 
                  onClick={() => navigate('/crm')}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Ver Recordatorios
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No hay recordatorios pendientes
              </div>
            )}
          </div>

          {/* Recent Invoices List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Facturas Recientes</h2>
              <button 
                onClick={() => navigate('/sales')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.slice(0, 5).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        invoice.status === 'PAID' ? 'bg-green-500' :
                        invoice.status === 'ISSUED' ? 'bg-orange-500' : 
                        invoice.status === 'OVERDUE' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{invoice.number}</p>
                        <p className="text-xs text-gray-500">
                          {invoice.client?.name || 'Cliente'} • {formatCurrency(invoice.total || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay facturas recientes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tareas Recientes</h2>
            <button 
              onClick={() => navigate('/crm')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.slice(0, 4).map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => navigate('/crm')}
                  className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {task.client?.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title || task.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {task.client?.name || 'Sin cliente'} • {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-DO') : 'Sin fecha'}
                    </p>
                    <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No hay tareas recientes
              </div>
            )}
          </div>
        </div>

        {/* Tasks Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Progreso de Tareas</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - completedTasks / 100)}`}
                  className="text-blue-600"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{completedTasks}%</p>
                  <p className="text-xs text-gray-500">Tareas Completadas</p>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{totalTasks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Completadas:</span>
                </div>
                <span className="font-semibold text-gray-900">{completedTasksCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Pendientes:</span>
                </div>
                <span className="font-semibold text-gray-900">{crmSummary?.pendingTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Vencidas:</span>
                </div>
                <span className="font-semibold text-gray-900">{crmSummary?.overdueTasks || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Status */}
        <div className="bg-blue-600 rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-lg font-semibold mb-6">Estado de Caja</h2>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{formatCurrency(summary?.cash?.currentBalance || 0)}</div>
            <p className="text-sm opacity-90 mb-4">
              {summary?.cash?.branchName || 'Sucursal Principal'}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={() => navigate('/cash')}
                className="w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                title="Ver Caja"
              >
                <HiCash className="w-6 h-6" />
              </button>
              <button 
                onClick={() => navigate('/cash')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
              >
                {summary?.cash?.status === 'OPEN' ? 'Cerrar Caja' : 'Abrir Caja'}
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <p className="text-xs opacity-75">
                {summary?.cash?.status === 'OPEN' ? (
                  <span className="flex items-center justify-center">
                    <HiLockOpen className="w-4 h-4 mr-1" />
                    Caja Abierta
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <HiLockClosed className="w-4 h-4 mr-1" />
                    Caja Cerrada
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
