import { useEffect, useState } from 'react';
import { loansApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const LoansReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [delinquency, setDelinquency] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioResponse, agingResponse, delinquencyResponse, performanceResponse] = await Promise.all([
        loansApi.getPortfolioReport(),
        loansApi.getAgingReport(),
        loansApi.getDelinquencyReport(),
        loansApi.getPerformanceReport(),
      ]);

      setPortfolio(portfolioResponse.data || null);
      setAging(agingResponse.data || null);
      setDelinquency(delinquencyResponse.data || []);
      setPerformance(performanceResponse.data || null);
    } catch (error: any) {
      console.error('Error fetching loans report:', error);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de préstamos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="py-12 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Préstamos registrados</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{portfolio?.totalLoans || 0}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Cartera total</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(portfolio?.totalPortfolio || 0)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Cartera activa</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(portfolio?.activePortfolio || 0)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Tasa de recuperación</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{Number(performance?.recoveryRate || 0).toFixed(2)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Antigüedad de cartera</h3>
          <div className="space-y-3">
            {[
              ['0-30', aging?.['0-30'] || 0],
              ['31-60', aging?.['31-60'] || 0],
              ['61-90', aging?.['61-90'] || 0],
              ['90+', aging?.['90+'] || 0],
            ].map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium text-gray-700">{label} días</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(amount))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Desempeño</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Total préstamos</span>
              <span className="text-sm font-semibold text-gray-900">{performance?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Pagados totalmente</span>
              <span className="text-sm font-semibold text-gray-900">{performance?.paidOff || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">En mora</span>
              <span className="text-sm font-semibold text-red-600">{performance?.delinquent || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Préstamos en mora</h3>
        {delinquency.length === 0 ? (
          <div className="rounded-md bg-green-50 px-4 py-6 text-center text-sm text-green-700">
            No hay préstamos en mora actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Saldo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Días mora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {delinquency.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{loan.client?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(loan.remainingAmount || 0)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{loan.overdueDays || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansReportTab;
