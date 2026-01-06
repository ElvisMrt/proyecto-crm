import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const ReceivablesReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (branchId) params.branchId = branchId;

      const response = await reportsApi.getReceivablesReport(params);
      setData(response);
    } catch (error) {
      console.error('Error fetching receivables report:', error);
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

  const handleExportExcel = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = [
      { 'Concepto': 'Total por Cobrar', 'Monto': data.totalReceivable || 0 },
      { 'Concepto': 'Total Vencido', 'Monto': data.totalOverdue || 0 },
      { 'Concepto': '0-30 días', 'Monto': data.aging?.['0-30'] || 0 },
      { 'Concepto': '31-60 días', 'Monto': data.aging?.['31-60'] || 0 },
      { 'Concepto': '61-90 días', 'Monto': data.aging?.['61-90'] || 0 },
      { 'Concepto': '+90 días', 'Monto': data.aging?.['90+'] || 0 },
    ];

    exportToExcel(exportData, `Reporte_CuentasPorCobrar_${new Date().toISOString().split('T')[0]}`, 'Ctas. por Cobrar');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Concepto', dataKey: 'concepto', width: 100 },
      { header: 'Monto', dataKey: 'monto', width: 80 },
    ];

    const exportData = [
      { concepto: 'Total por Cobrar', monto: data.totalReceivable || 0 },
      { concepto: 'Total Vencido', monto: data.totalOverdue || 0 },
      { concepto: '0-30 días', monto: data.aging?.['0-30'] || 0 },
      { concepto: '31-60 días', monto: data.aging?.['31-60'] || 0 },
      { concepto: '61-90 días', monto: data.aging?.['61-90'] || 0 },
      { concepto: '+90 días', monto: data.aging?.['90+'] || 0 },
    ];

    const summary = {
      'Total Facturas': data.invoicesCount || 0,
    };

    exportToPDF(
      exportData,
      columns,
      `Reporte_CuentasPorCobrar_${new Date().toISOString().split('T')[0]}`,
      'Reporte de Cuentas por Cobrar',
      summary
    );
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!data}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total por Cobrar</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(data?.totalReceivable || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-sm font-medium text-gray-600">Total Vencido</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(data?.totalOverdue || 0)}
          </p>
        </div>
      </div>

      {/* Aging Report */}
      {data?.aging && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Antigüedad de Saldos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">0-30 días</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {formatCurrency(data.aging['0-30'] || 0)}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800">31-60 días</p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                {formatCurrency(data.aging['31-60'] || 0)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-800">61-90 días</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {formatCurrency(data.aging['61-90'] || 0)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">+90 días</p>
              <p className="text-2xl font-bold text-red-900 mt-2">
                {formatCurrency(data.aging['90+'] || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesReportTab;


