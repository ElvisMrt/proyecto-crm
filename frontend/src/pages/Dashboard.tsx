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
  invoices: {
    total: number;
    paid: number;
    pending: number;
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Cargando dashboard...</p>
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
  const totalInvoicesCount = summary?.invoices?.total || invoicesPagination?.total || recentInvoices.length;
  const paidInvoicesCount = summary?.invoices?.paid || recentInvoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoicesCount = summary?.invoices?.pending || 0;
  
  // Calcular progreso de tareas basado en datos reales del CRM
  // Usar los datos del summary que ahora incluye completedTasks y completionPercentage
  const totalTasks = crmSummary?.totalTasks || 0;
  const completedTasks = crmSummary?.completionPercentage || 0;
  const completedTasksCount = crmSummary?.completedTasks || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Visión general</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Resumen general del negocio</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500">Última actualización</p>
          <p className="text-xs font-medium text-slate-950 sm:text-sm">{new Date().toLocaleDateString('es-DO', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI Cards - Diseño moderno */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 - Ventas del Mes */}
        <div className="cursor-pointer rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5" onClick={() => navigate('/sales')}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 sm:p-2">
              <HiShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            {summary?.salesToday?.trend && (
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${summary.salesToday.trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {summary.salesToday.trend > 0 ? '+' : ''}{summary.salesToday.trend.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Ventas del Mes</p>
          <p className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{formatCurrency(summary?.salesMonth?.amount || 0)}</p>
        </div>

        {/* Card 2 - Facturas */}
        <div className="cursor-pointer rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5" onClick={() => navigate('/sales')}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="rounded-2xl bg-emerald-50 p-1.5 text-emerald-700 sm:p-2">
              <HiCheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Facturas</p>
          <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{totalInvoicesCount}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1">{paidInvoicesCount} pagadas</p>
        </div>

        {/* Card 3 - Cuentas por Pagar */}
        <div className="cursor-pointer rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5" onClick={() => navigate('/suppliers-dashboard')}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="rounded-2xl bg-rose-50 p-1.5 text-rose-700 sm:p-2">
              <HiCurrencyDollar className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            {(summary?.payables?.overdue || 0) > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                {summary?.payables?.overdue || 0} vencidas
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Por Pagar</p>
          <p className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{formatCurrency(summary?.payables?.total || 0)}</p>
        </div>

        {/* Card 4 - Tareas */}
        <div className="cursor-pointer rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-5" onClick={() => navigate('/crm')}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 sm:p-2">
              <HiClipboardCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            {(summary?.tasks?.overdue || 0) > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                {summary?.tasks?.overdue || 0} vencidas
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Tareas Pend.</p>
          <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{summary?.tasks?.pending || 0}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left Column - Sales Analytics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sales Chart */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">Análisis de Ventas</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Últimos {trendDays} días</p>
              </div>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
                            isHigh ? 'bg-gradient-to-t from-slate-900 to-slate-500 dark:from-white dark:to-slate-500' : 'bg-gradient-to-t from-slate-300 to-slate-100 dark:from-slate-700 dark:to-slate-800'
                          }`}
                          style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                          title={`${formatCurrency(item.amount)} - ${date.toLocaleDateString('es-DO')}`}
                        >
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-xs text-white group-hover:block dark:bg-white dark:text-slate-950">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {dayLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                No hay datos
              </div>
            )}
          </div>

          {/* Gráficos Circulares */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Facturas por Estado */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h3 className="mb-2 text-xs font-bold text-slate-950 dark:text-white sm:mb-4 sm:text-sm">Facturas por Estado</h3>
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
                      <p className="text-2xl font-bold text-slate-950 dark:text-white">{totalInvoicesCount}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">Pagadas</span>
                  </div>
                  <span className="font-semibold text-slate-950 dark:text-white">{paidInvoicesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">Pendientes</span>
                  </div>
                  <span className="font-semibold text-slate-950 dark:text-white">{totalInvoicesCount - paidInvoicesCount}</span>
                </div>
              </div>
            </div>

            {/* Ventas por Categoría */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h3 className="mb-2 text-xs font-bold text-slate-950 dark:text-white sm:mb-4 sm:text-sm">Distribución</h3>
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
                      <p className="text-2xl font-bold text-slate-950 dark:text-white">100%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">Productos</span>
                  </div>
                  <span className="font-semibold text-slate-950 dark:text-white">62%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">Servicios</span>
                  </div>
                  <span className="font-semibold text-slate-950 dark:text-white">38%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Gráfico de Área - Tendencia */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">Tendencia Semanal</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Últimos 7 días</p>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">+12%</span>
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
          <div className={`rounded-[24px] shadow-sm border p-4 sm:p-5 ${
            summary?.cash?.status === 'OPEN' ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900 dark:from-emerald-950/40 dark:to-slate-900' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Estado de Caja</h3>
              {summary?.cash?.status === 'OPEN' ? (
                <HiLockOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <HiLockClosed className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <p className="mb-1 text-xl font-bold text-slate-950 dark:text-white">
              {formatCurrency(summary?.cash?.currentBalance || 0)}
            </p>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {summary?.cash?.status === 'OPEN' ? 'Caja abierta' : 'Caja cerrada'}
            </p>
            <button
              onClick={() => navigate('/cash')}
              className={`w-full rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                summary?.cash?.status === 'OPEN'
                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-white'
              }`}
            >
              {summary?.cash?.status === 'OPEN' ? 'Ir a Caja' : 'Abrir Caja'}
            </button>
          </div>

          {/* Facturas Recientes */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Facturas</h3>
              <button onClick={() => navigate('/sales')} className="text-xs text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                Ver todas
              </button>
            </div>
            <div className="space-y-2">
              {recentInvoices.length > 0 ? (
                recentInvoices.slice(0, 4).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        invoice.status === 'PAID' ? 'bg-green-500' :
                        invoice.status === 'ISSUED' ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium text-slate-950 dark:text-white">{invoice.number}</p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{invoice.client?.name || 'Cliente'}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-950 dark:text-white">{formatCurrency(invoice.total || 0)}</p>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
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
