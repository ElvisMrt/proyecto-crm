import { useEffect, useState, useRef } from 'react';
import { crmApi, clientsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { HiSearch, HiUser } from 'react-icons/hi';

const ClientHistoryTab = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchHistory();
    } else {
      setHistory(null);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await crmApi.getClientHistory(selectedClientId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
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

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.identification && client.identification.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectClient = (client: any) => {
    setSelectedClientId(client.id);
    setSearchTerm(client.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredClients.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredClients.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectClient(filteredClients[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Vista 360° del Cliente</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <HiSearch className="w-4 h-4 mr-1 text-blue-600" />
            Buscar Cliente
          </label>
          <div className="relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Haz click para ver clientes o escribe para buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
                if (!e.target.value) {
                  setSelectedClientId('');
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onClick={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            
            {/* Dropdown de Sugerencias */}
            {showSuggestions && filteredClients.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs font-medium text-blue-800">
                    {filteredClients.length} cliente(s) encontrado(s)
                  </p>
                </div>
                {filteredClients.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-3 hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 ${
                      index === highlightedIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <HiUser className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                          {client.identification && (
                            <p className="text-xs text-gray-500">ID: {client.identification}</p>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No hay resultados */}
            {showSuggestions && searchTerm && clients.length > 0 && filteredClients.length === 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <p className="text-gray-500 text-center text-sm">No se encontraron clientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">Cargando...</div>
      )}

      {history && !loading && (
        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{history.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="text-sm font-medium text-gray-900">{history.client.identification}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{history.client.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{history.client.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          {history.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(history.summary.totalSales || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {history.summary.invoiceCount || 0} factura{history.summary.invoiceCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Balance Pendiente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(history.summary.totalReceivable || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {history.summary.paymentCount || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Tareas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {history.summary.taskCount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate(`/receivables?clientId=${selectedClientId}`)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md"
              >
                💵 Ir a CxC
              </button>
              <button
                onClick={() => navigate(`/sales?clientId=${selectedClientId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md"
              >
                🛒 Nueva Venta
              </button>
              <button
                onClick={() => navigate(`/clients?clientId=${selectedClientId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md"
              >
                👤 Ver Cliente
              </button>
            </div>
          </div>

          {/* Tareas */}
          {history.tasks && history.tasks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas</h3>
              <div className="space-y-3">
                {history.tasks.map((task: any) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {task.dueDate && `Fecha límite: ${formatDate(task.dueDate)}`}
                      {task.completedAt && ` • Completada: ${formatDate(task.completedAt)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facturas Recientes */}
          {history.recentInvoices && history.recentInvoices.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturas Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.recentInvoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(invoice.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'CANCELLED'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientHistoryTab;



