import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, branchesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  HiCurrencyDollar,
  HiCalendar,
  HiCash,
  HiOfficeBuilding,
  HiLockClosed,
  HiLockOpen,
  HiCheckCircle,
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [summaryData, activitiesData, trendData] = await Promise.all([
        dashboardApi.getSummary(selectedBranch ? { branchId: selectedBranch } : undefined),
        dashboardApi.getRecentActivity(10, selectedBranch ? { branchId: selectedBranch } : undefined),
        dashboardApi.getSalesTrend(trendDays),
      ]);
      setSummary(summaryData);
      setActivities(activitiesData.activities || []);
      setSalesTrend(trendData);
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

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FACTURA: 'Factura',
      PAGO: 'Pago',
      AJUSTE_INV: 'Ajuste Inv.',
    };
    return labels[type] || type;
  };

  // Calcular altura máxima del gráfico
  const maxAmount = salesTrend?.data.reduce((max, item) => Math.max(max, item.amount), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header con selector de sucursal */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {user?.role === 'ADMINISTRATOR' && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del Día */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Ventas del Día</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.salesToday?.amount || 0)}
              </p>
              {summary?.salesToday?.trend !== undefined && (
                <div className="flex items-center mt-2">
                  {summary.salesToday.trend >= 0 ? (
                    <span className="text-sm text-green-600 font-medium">
                      ↑ {Math.abs(summary.salesToday.trend).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-red-600 font-medium">
                      ↓ {Math.abs(summary.salesToday.trend).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-2">vs ayer</span>
                </div>
              )}
            </div>
            <HiCurrencyDollar className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.salesMonth?.amount || 0)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(summary?.salesMonth?.progress || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(summary?.salesMonth?.progress || 0)}% del mes
                </p>
              </div>
            </div>
            <HiCalendar className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Cuentas por Cobrar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.receivables?.total || 0)}
              </p>
              {(summary?.receivables?.overdue || 0) > 0 && (
                <p className="text-sm text-red-600 font-medium mt-2">
                  {summary?.receivables?.overdue || 0} vencidas
                </p>
              )}
            </div>
            <HiCash className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        {/* Caja */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Caja {summary?.cash?.branchName ? `- ${summary.cash.branchName}` : ''}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.cash?.currentBalance || 0)}
              </p>
              <p
                className={`text-sm font-medium mt-2 ${
                  summary?.cash?.status === 'OPEN' ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {summary?.cash?.status === 'OPEN' ? (
                  <>
                    <HiCheckCircle className="inline w-4 h-4 mr-1" />
                    Abierta
                  </>
                ) : (
                  <>
                    <HiLockClosed className="inline w-4 h-4 mr-1" />
                    Cerrada
                  </>
                )}
              </p>
            </div>
            <HiOfficeBuilding className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Accesos Rápidos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos Rápidos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/sales')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="mr-2">+</span> Nueva Venta
              </button>
              <button
                onClick={() => navigate('/receivables')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <HiCurrencyDollar className="inline w-4 h-4 mr-1" />
                Cobrar
              </button>
              <button
                onClick={() => navigate('/cash')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {summary?.cash?.status === 'OPEN' ? (
                  <HiLockClosed className="inline w-4 h-4 mr-1" />
                ) : (
                  <HiLockOpen className="inline w-4 h-4 mr-1" />
                )}
                Cierre de Caja
              </button>
              <button
                onClick={() => navigate('/crm')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <HiCheckCircle className="inline w-4 h-4 mr-1" />
                Crear Tarea
              </button>
            </div>
          </div>
        </div>

        {/* Alertas Críticas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Alertas Críticas</h2>
              <button 
                onClick={() => navigate('/receivables')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {(summary?.alerts?.overdueInvoices || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-center">
                    <span className="text-red-600 font-bold mr-3">
                      {summary?.alerts?.overdueInvoices || 0}
                    </span>
                    <span className="text-red-700 font-medium">Facturas vencidas</span>
                  </div>
                  <button
                    onClick={() => navigate('/receivables')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Ver →
                  </button>
                </div>
              )}

              {(summary?.alerts?.lowStock || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <div className="flex items-center">
                    <span className="text-yellow-600 font-bold mr-3">{summary?.alerts?.lowStock || 0}</span>
                    <span className="text-yellow-700 font-medium">Stock crítico</span>
                  </div>
                  <button
                    onClick={() => navigate('/inventory')}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Ver →
                  </button>
                </div>
              )}

              {(summary?.alerts?.ncfAboutToExpire || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                  <div className="flex items-center">
                    <span className="text-orange-600 font-bold mr-3">
                      {summary?.alerts?.ncfAboutToExpire || 0}
                    </span>
                    <span className="text-orange-700 font-medium">NCF por agotarse</span>
                  </div>
                  <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                    Ver →
                  </button>
                </div>
              )}

              {(summary?.alerts?.unclosedCash || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-center">
                    <span className="text-red-600 font-bold mr-3">{summary?.alerts?.unclosedCash || 0}</span>
                    <span className="text-red-700 font-medium">Caja sin cerrar (ayer)</span>
                  </div>
                  <button
                    onClick={() => navigate('/cash')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Ver →
                  </button>
                </div>
              )}

              {(summary?.alerts?.overdueTasks || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-center">
                    <span className="text-red-600 font-bold mr-3">{summary?.alerts?.overdueTasks || 0}</span>
                    <span className="text-red-700 font-medium">Tareas vencidas</span>
                  </div>
                  <button 
                    onClick={() => navigate('/crm')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Ver →
                  </button>
                </div>
              )}

              {(!summary?.alerts?.overdueInvoices &&
                !summary?.alerts?.lowStock &&
                !summary?.alerts?.ncfAboutToExpire &&
                !summary?.alerts?.unclosedCash &&
                !summary?.alerts?.overdueTasks) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay alertas críticas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ventas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ventas de los Últimos {trendDays} Días</h2>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-3 py-1"
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
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${formatCurrency(item.amount)} - ${date.toLocaleDateString('es-DO')}`}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center transform -rotate-45 origin-top-left whitespace-nowrap">
                      {date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
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

        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Actividad Reciente</h2>
            <button 
              onClick={() => navigate('/sales')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Fecha</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Referencia</th>
                  <th className="text-right py-2 px-2 text-gray-600 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-700">{formatDate(activity.date)}</td>
                      <td className="py-2 px-2 text-gray-700">{getActivityTypeLabel(activity.type)}</td>
                      <td className="py-2 px-2 text-gray-700 font-mono text-xs">{activity.reference}</td>
                      <td className="py-2 px-2 text-right text-gray-900 font-medium">
                        {activity.amount > 0 ? formatCurrency(activity.amount) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No hay actividad reciente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
