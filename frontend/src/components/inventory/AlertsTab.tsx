import { useEffect, useState } from 'react';
import { inventoryApi } from '../../services/api';

const AlertsTab = () => {
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
          <div className="text-4xl mb-2">✅</div>
          <p>No hay productos con stock bajo</p>
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



