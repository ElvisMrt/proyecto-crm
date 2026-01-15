import { useEffect, useState } from 'react';
import { inventoryApi, crmApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiEye, HiClipboardList } from 'react-icons/hi';

const AlertsTab = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getLowStockAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/inventory?tab=products&productId=${productId}`);
  };

  const handleCreateTask = async (alert: any) => {
    try {
      await crmApi.createTask({
        title: `Reordenar producto: ${alert.product.name}`,
        description: `El producto ${alert.product.name} (${alert.product.code}) tiene stock bajo.\nStock actual: ${alert.currentStock}\nStock mínimo: ${alert.minStock}\nSucursal: ${alert.branch?.name || 'N/A'}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
      });
      showToast('Tarea de reorden creada exitosamente', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al crear la tarea', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Productos con Stock Bajo</h2>
        <p className="text-sm text-gray-600 mt-1">
          Productos que están por debajo de su stock mínimo
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <HiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">No hay productos con stock bajo</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Sucursal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-red-800 uppercase">Stock Actual</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-red-800 uppercase">Stock Mínimo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-red-800 uppercase">Diferencia</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-red-800 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert, index) => (
                <tr key={index} className="hover:bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{alert.product.name}</div>
                    <div className="text-xs text-gray-500">{alert.product.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.branch?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                    {alert.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {alert.minStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                    {alert.difference < 0 ? alert.difference : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewProduct(alert.product.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Ver producto"
                      >
                        <HiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleCreateTask(alert)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Crear tarea de reorden"
                      >
                        <HiClipboardList className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlertsTab;



