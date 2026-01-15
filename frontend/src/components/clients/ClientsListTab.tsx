import { useEffect, useState } from 'react';
import { clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiEye, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiSearch, HiFilter, HiCalendar, HiDocumentDownload } from 'react-icons/hi';
import { exportClientsToExcel, exportClientsToPDF } from '../../utils/exportUtils';

interface ClientsListTabProps {
  onClientSelect: (clientId: string) => void;
  onClientEdit: (client: any) => void;
}

const ClientsListTab = ({ onClientSelect, onClientEdit }: ClientsListTabProps) => {
  const { showToast, showConfirm } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'true',
    clientType: '',
    startDate: '',
    endDate: '',
    minCreditLimit: '',
    maxCreditLimit: '',
    hasOverdue: '',
    page: 1,
    limit: 20,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [filters.page, filters.isActive, filters.clientType]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.isActive) params.isActive = filters.isActive;
      if (filters.clientType) params.clientType = filters.clientType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minCreditLimit) params.minCreditLimit = filters.minCreditLimit;
      if (filters.maxCreditLimit) params.maxCreditLimit = filters.maxCreditLimit;
      if (filters.hasOverdue) params.hasOverdue = filters.hasOverdue;

      const response = await clientsApi.getClients(params);
      setClients(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (client: any) => {
    setActionMenuOpen(null);
    showConfirm(
      client.isActive ? 'Desactivar Cliente' : 'Activar Cliente',
      `¿Está seguro de ${client.isActive ? 'desactivar' : 'activar'} el cliente "${client.name}"?`,
      async () => {
    try {
      await clientsApi.toggleClientStatus(client.id, !client.isActive);
      showToast(`Cliente ${client.isActive ? 'desactivado' : 'activado'} exitosamente`, 'success');
      fetchClients();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al cambiar el estado', 'error');
    }
      },
      { type: client.isActive ? 'warning' : 'info', confirmText: client.isActive ? 'Desactivar' : 'Activar', cancelText: 'Cancelar' }
    );
  };

  const handleDelete = async (client: any) => {
    setActionMenuOpen(null);
    showConfirm(
      'Eliminar Cliente',
      `¿Está seguro de eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await clientsApi.deleteClient(client.id);
          showToast('Cliente eliminado exitosamente', 'success');
          fetchClients();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar el cliente', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getClientType = (client: any) => {
    return client.creditLimit && client.creditLimit > 0 ? 'Crédito' : 'Contado';
  };

  // Búsqueda con sugerencias
  const handleSearchChange = async (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
    
    if (value.length >= 2) {
      try {
        const response = await clientsApi.getClients({ search: value, limit: 5 });
        setSearchSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (client: any) => {
    setFilters({ ...filters, search: client.name, page: 1 });
    setShowSuggestions(false);
    fetchClients();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      isActive: 'true',
      clientType: '',
      startDate: '',
      endDate: '',
      minCreditLimit: '',
      maxCreditLimit: '',
      hasOverdue: '',
      page: 1,
      limit: 20,
    });
    setShowAdvancedFilters(false);
    fetchClients();
  };

  const handleExportExcel = () => {
    try {
      exportClientsToExcel(clients);
      showToast('Exportando a Excel...', 'info');
    } catch (error) {
      showToast('Error al exportar a Excel', 'error');
    }
  };

  const handleExportPDF = () => {
    try {
      exportClientsToPDF(clients);
      showToast('Exportando a PDF...', 'info');
    } catch (error) {
      showToast('Error al exportar a PDF', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con botones de exportación */}
      {clients.length > 0 && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
          >
            <HiDocumentDownload className="w-4 h-4 mr-2" />
            Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
          >
            <HiDocumentDownload className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center">
              <HiSearch className="w-4 h-4 mr-1 text-gray-400" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, documento, email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchSuggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  fetchClients();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchSuggestions.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectSuggestion(client)}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-sm">{client.name}</div>
                    <div className="text-xs text-gray-500">{client.identification}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center">
              <HiFilter className="w-4 h-4 mr-1 text-gray-400" />
              Estado
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center">
              <HiFilter className="w-4 h-4 mr-1 text-gray-400" />
              Tipo
            </label>
            <select
              value={filters.clientType}
              onChange={(e) => setFilters({ ...filters, clientType: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="CASH">Contado</option>
              <option value="CREDIT">Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center">
              <HiCalendar className="w-4 h-4 mr-1 text-gray-400" />
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center justify-center"
            >
              <HiFilter className="w-4 h-4 mr-2" />
              {showAdvancedFilters ? 'Ocultar' : 'Avanzados'}
            </button>
            <button
              onClick={fetchClients}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center justify-center"
            >
              <HiSearch className="w-4 h-4 mr-2" />
              Buscar
            </button>
          </div>
        </div>

        {/* Filtros Avanzados */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito Mínimo
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minCreditLimit}
                  onChange={(e) => setFilters({ ...filters, minCreditLimit: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito Máximo
                </label>
                <input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxCreditLimit}
                  onChange={(e) => setFilters({ ...filters, maxCreditLimit: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Morosidad
                </label>
                <select
                  value={filters.hasOverdue}
                  onChange={(e) => setFilters({ ...filters, hasOverdue: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Con facturas vencidas</option>
                  <option value="false">Sin facturas vencidas</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay clientes</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre / Razón Social</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.identification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getClientType(client)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === client.id ? null : client.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === client.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      onClientSelect(client.id);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <HiEye className="w-4 h-4 mr-2" />
                            Ver
                          </button>
                          <button
                                    onClick={() => {
                                      onClientEdit(client);
                                      setActionMenuOpen(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                                    <HiPencil className="w-4 h-4 mr-2" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client)}
                                    className={`block w-full text-left px-4 py-2 text-sm flex items-center ${
                                      client.isActive 
                                        ? 'text-orange-700 hover:bg-orange-50' 
                                        : 'text-green-700 hover:bg-green-50'
                            }`}
                          >
                                    {client.isActive ? (
                                      <>
                                        <HiXCircle className="w-4 h-4 mr-2" />
                                        Desactivar
                                      </>
                                    ) : (
                                      <>
                                        <HiCheckCircle className="w-4 h-4 mr-2" />
                                        Activar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(client)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                  >
                                    <HiTrash className="w-4 h-4 mr-2" />
                                    Eliminar
                          </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} clientes
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientsListTab;


