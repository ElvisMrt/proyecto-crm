import { useEffect, useState } from 'react';
import { crmApi, clientsApi, receivablesApi } from '../../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface TasksTabProps {
  onTaskChanged: () => void;
}

const TasksTab = ({ onTaskChanged }: TasksTabProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [lateCollections, setLateCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    branchId: '',
    clientId: '',
    status: '',
    dateFilter: 'today', // today, tomorrow, week, all
    assignedToUserId: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [form, setForm] = useState({
    title: '',
    description: '',
    clientId: '',
    dueDate: '',
    assignedToUserId: user?.id || '',
  });

  useEffect(() => {
    fetchClients();
    fetchBranches();
    fetchReminders();
    fetchLateCollections();
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters.page, filters.clientId, filters.status, filters.dateFilter, filters.assignedToUserId]);

  const fetchBranches = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBranches(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await crmApi.getReminders();
      setReminders(response.data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchLateCollections = async () => {
    try {
      const response = await crmApi.getLateCollections();
      setLateCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching late collections:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.status) params.status = filters.status;
      if (filters.assignedToUserId) params.userId = filters.assignedToUserId;

      // Date filter
      if (filters.dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // This would need backend support for date filtering
      }

      const response = await crmApi.getTasks(params);
      setTasks(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.createTask(form);
      showToast('Tarea creada exitosamente', 'success');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        clientId: '',
        dueDate: '',
        assignedToUserId: user?.id || '',
      });
      fetchTasks();
      fetchReminders();
      onTaskChanged();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al crear la tarea', 'error');
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await crmApi.completeTask(taskId);
      showToast('Tarea completada exitosamente', 'success');
      fetchTasks();
      fetchReminders();
      onTaskChanged();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al completar la tarea', 'error');
    }
  };

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `Hoy ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else if (diffDays === 1) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `Mañana ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return `Hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-DO');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-4">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <select
                value={filters.branchId}
                onChange={(e) => setFilters({ ...filters, branchId: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <select
                value={filters.dateFilter}
                onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="today">Hoy</option>
                <option value="tomorrow">Mañana</option>
                <option value="week">Esta semana</option>
                <option value="all">Todas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
              <select
                value={filters.assignedToUserId}
                onChange={(e) => setFilters({ ...filters, assignedToUserId: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value={user?.id}>{user?.name}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm"
              >
                + Nueva Tarea
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No hay tareas</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarea</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : task.isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status === 'COMPLETED' ? 'Completada' : task.isOverdue ? 'Vencida' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.client?.name || '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeDate(task.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.user?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Completar
                            </button>
                          )}
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
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} Tareas Pendientes
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={filters.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters({ ...filters, page })}
                          className={`px-3 py-1 border rounded text-sm ${
                            filters.page === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      disabled={filters.page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* Recordatorios */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recordatorios</h3>
            <button className="text-gray-400 hover:text-gray-600">⌄</button>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay recordatorios</p>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-start space-x-3">
                    {reminder.client ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-blue-600">
                          {reminder.client.name.charAt(0)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">📋</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{formatRelativeDate(reminder.dueDate)}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{reminder.title}</p>
                      {reminder.client && (
                        <p className="text-xs text-gray-500 mt-1">{reminder.client.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cobro Tardío */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Cobro Tardío</h3>
            <button className="text-gray-400 hover:text-gray-600">⌄</button>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {lateCollections.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay cobros tardíos</p>
            ) : (
              <>
                {lateCollections.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-red-600 font-medium">
                            +{item.daysOverdue} día{item.daysOverdue !== 1 ? 's' : ''}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {item.number} {item.client.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{formatCurrency(item.balance)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/receivables?clientId=${item.client.id}`)}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        📄
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/receivables')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver Recordatorios Pendientes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nueva Tarea */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Tarea</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sin cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Crear Tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksTab;
