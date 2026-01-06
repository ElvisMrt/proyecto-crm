import { useEffect, useState } from 'react';
import { clientsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ClientCardTabProps {
  clientId: string;
  onEdit: () => void;
}

const ClientCardTab = ({ clientId, onEdit }: ClientCardTabProps) => {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientsApi.getClient(clientId);
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando cliente...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        Cliente no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Documento: {client.identification}</p>
          </div>
          <div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              client.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {client.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm font-medium text-gray-900">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="text-sm font-medium text-gray-900">{client.phone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Dirección</p>
            <p className="text-sm font-medium text-gray-900">{client.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="text-sm font-medium text-gray-900">
              {client.creditLimit && client.creditLimit > 0 ? 'Crédito' : 'Contado'}
            </p>
          </div>
          {client.creditLimit && client.creditLimit > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-600">Límite de Crédito</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(client.creditLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Días de Crédito</p>
                <p className="text-sm font-medium text-gray-900">{client.creditDays} días</p>
              </div>
            </>
          )}
          <div>
            <p className="text-sm text-gray-600">Fecha de Registro</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Indicadores Rápidos */}
      {client.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-600">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(client.summary.totalSales || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {client.summary.invoiceCount || 0} factura{client.summary.invoiceCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-sm font-medium text-gray-600">Balance Pendiente</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(client.summary.totalReceivable || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cuentas por Cobrar</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {client.summary.paymentCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Registros de pago</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-sm font-medium text-gray-600">Cotizaciones</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {client.summary.quoteCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cotizaciones creadas</p>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md"
          >
            ✏️ Editar Cliente
          </button>
          <button
            onClick={() => navigate(`/receivables?clientId=${clientId}`)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md"
          >
            💵 Ir a CxC
          </button>
          <button
            onClick={() => navigate(`/sales?clientId=${clientId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md"
          >
            🛒 Nueva Venta
          </button>
        </div>
      </div>

      {/* Pagos Recientes */}
      {client.recentPayments && client.recentPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos Recientes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {client.recentPayments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCardTab;



