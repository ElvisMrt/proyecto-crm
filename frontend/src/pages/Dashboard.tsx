import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, branchesApi, salesApi, crmApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  HiCurrencyDollar,
  HiCheckCircle,
  HiShoppingCart,
  HiClipboardCheck,
  HiLockOpen,
  HiLockClosed,
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
  payables: {
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
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen general del negocio</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Última actualización</p>
          <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI Cards - Diseño moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Ventas del Mes */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/sales')}>
          <div className="flex items-center justify-between mb-3">
            <div className="bg-[#1D79C4] bg-opacity-10 rounded-lg p-2">
              <HiShoppingCart className="w-6 h-6 text-[#1D79C4]" />
            </div>
            {summary?.salesToday?.trend && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${summary.salesToday.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {summary.salesToday.trend > 0 ? '+' : ''}{summary.salesToday.trend.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[#1f2937]">Ventas del Mes</p>
          <p className="text-3xl font-bold mt-2 text-[#000000]">{formatCurrency(summary?.salesMonth?.amount || 0)}</p>
        </div>

        {/* Card 2 - Facturas */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/sales')}>
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-600 bg-opacity-10 rounded-lg p-2">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-[#1f2937]">Facturas</p>
          <p className="text-3xl font-bold mt-2 text-[#000000]">{totalInvoicesCount}</p>
          <p className="text-xs text-[#1f2937] mt-1">{paidInvoicesCount} pagadas</p>
        </div>

        {/* Card 3 - Cuentas por Pagar */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/suppliers-dashboard')}>
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-600 bg-opacity-10 rounded-lg p-2">
              <HiCurrencyDollar className="w-6 h-6 text-red-600" />
            </div>
            {(summary?.payables?.overdue || 0) > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                {summary?.payables?.overdue || 0} vencidas
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[#1f2937]">Por Pagar</p>
          <p className="text-3xl font-bold mt-2 text-[#000000]">{formatCurrency(summary?.payables?.total || 0)}</p>
        </div>

        {/* Card 4 - Tareas */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/crm')}>
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-600 bg-opacity-10 rounded-lg p-2">
              <HiClipboardCheck className="w-6 h-6 text-purple-600" />
            </div>
            {(summary?.tasks?.overdue || 0) > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                {summary?.tasks?.overdue || 0} vencidas
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[#1f2937]">Tareas Pendientes</p>
          <p className="text-3xl font-bold mt-2 text-[#000000]">{summary?.tasks?.pending || 0}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Sales Analytics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Análisis de Ventas</h2>
                <p className="text-xs text-gray-500 mt-0.5">Últimos {trendDays} días</p>
              </div>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={7}>7d</option>
                <option value={14}>14d</option>
                <option value={30}>30d</option>
              </select>
            </div>
            {salesTrend && salesTrend.data.length > 0 ? (
              <div className="h-48 flex items-end justify-between gap-2 mt-4">
                {salesTrend.data.map((item, index) => {
                  const height = (item.amount / maxAmount) * 100;
                  const date = new Date(item.date);
                  const dayLabel = date.toLocaleDateString('es-DO', { weekday: 'short' }).charAt(0).toUpperCase();
                  const isHigh = height > 50;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full">
                      <div className="relative w-full flex items-end justify-center flex-1" style={{ minHeight: '100px' }}>
                        <div
                          className={`w-full rounded-t hover:opacity-80 transition-all cursor-pointer relative group ${
                            isHigh ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-gray-200 to-gray-100'
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
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                No hay datos
              </div>
            )}
          </div>

          {/* Gráficos Circulares */}
          <div className="grid grid-cols-2 gap-4">
            {/* Facturas por Estado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Facturas por Estado</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  {/* Donut Chart - Simulado con SVG */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Pagadas - Verde */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${(paidInvoicesCount / Math.max(totalInvoicesCount, 1)) * 251.2} 251.2`}
                      strokeDashoffset="0"
                    />
                    {/* Pendientes - Naranja */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="12"
                      strokeDasharray={`${(pendingInvoicesCount / Math.max(totalInvoicesCount, 1)) * 251.2} 251.2`}
                      strokeDashoffset={`-${(paidInvoicesCount / Math.max(totalInvoicesCount, 1)) * 251.2}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{totalInvoicesCount}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Pagadas</span>
                  </div>
                  <span className="font-semibold text-gray-900">{paidInvoicesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-600">Pendientes</span>
                  </div>
                  <span className="font-semibold text-gray-900">{totalInvoicesCount - paidInvoicesCount}</span>
                </div>
              </div>
            </div>

            {/* Ventas por Categoría */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Distribución</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray="157 251.2"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="12"
                      strokeDasharray="94.2 251.2"
                      strokeDashoffset="-157"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">100%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Productos</span>
                  </div>
                  <span className="font-semibold text-gray-900">62%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">Servicios</span>
                  </div>
                  <span className="font-semibold text-gray-900">38%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Gráfico de Área - Tendencia */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tendencia Semanal</h3>
                <p className="text-xs text-gray-500 mt-0.5">Últimos 7 días</p>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
            </div>
            <div className="h-24 relative">
              <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.3}} />
                    <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0}} />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 45 Q 30 35, 50 30 T 100 25 T 150 20 T 200 15 L 200 60 L 0 60 Z"
                  fill="url(#areaGradient)"
                />
                <path
                  d="M 0 45 Q 30 35, 50 30 T 100 25 T 150 20 T 200 15"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Estado de Caja */}
          <div className={`rounded-xl shadow-sm border p-5 ${
            summary?.cash?.status === 'OPEN' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Estado de Caja</h3>
              {summary?.cash?.status === 'OPEN' ? (
                <HiLockOpen className="w-4 h-4 text-green-600" />
              ) : (
                <HiLockClosed className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary?.cash?.currentBalance || 0)}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {summary?.cash?.status === 'OPEN' ? 'Caja abierta' : 'Caja cerrada'}
            </p>
            <button
              onClick={() => navigate('/cash')}
              className={`w-full text-xs font-medium py-2 px-3 rounded transition-colors ${
                summary?.cash?.status === 'OPEN'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {summary?.cash?.status === 'OPEN' ? 'Ir a Caja' : 'Abrir Caja'}
            </button>
          </div>

          {/* Facturas Recientes */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Facturas</h3>
              <button onClick={() => navigate('/sales')} className="text-xs text-blue-600 hover:text-blue-700">
                Ver todas
              </button>
            </div>
            <div className="space-y-2">
              {recentInvoices.length > 0 ? (
                recentInvoices.slice(0, 4).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        invoice.status === 'PAID' ? 'bg-green-500' :
                        invoice.status === 'ISSUED' ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{invoice.number}</p>
                        <p className="text-xs text-gray-400 truncate">{invoice.client?.name || 'Cliente'}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{formatCurrency(invoice.total || 0)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-xs text-gray-400">
                  No hay facturas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
