import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { crmApi, clientsApi } from '../../services/api';
import { branchesApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  HiDotsVertical, 
  HiPencil, 
  HiTrash, 
  HiCheckCircle, 
  HiArrowUp, 
  HiArrowDown, 
  HiSearch, 
  HiDocumentDownload,
  HiXCircle,
  HiClock,
  HiExclamationCircle
} from 'react-icons/hi';
import { exportTasksToExcel, exportTasksToPDF } from '../../utils/exportUtils';

interface TasksTabProps {
  onTaskChanged: () => void;
}

export interface TasksTabRef {
  handleExportExcel: () => void;
  handleExportPDF: () => void;
}

const TasksTab = forwardRef<TasksTabRef, TasksTabProps>(({ onTaskChanged }, ref) => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [lateCollections, setLateCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    branchId: '',
    clientId: '',
    status: '',
    priority: '',
    dateFilter: 'all', // today, tomorrow, week, all
    assignedToUserId: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
  });
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    fetchClients();
    fetchBranches();
    fetchReminders();
    fetchLateCollections();
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters.page, filters.clientId, filters.status, filters.priority, filters.dateFilter, filters.assignedToUserId, filters.search, filters.startDate, filters.endDate]);

  const fetchBranches = async () => {
    try {
      await branchesApi.getBranches();
      // Branches are fetched but not used in this component
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
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignedToUserId) params.userId = filters.assignedToUserId;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      // Date filter shortcuts
      if (filters.dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = tomorrow.toISOString().split('T')[0];
      } else if (filters.dateFilter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        params.startDate = tomorrow.toISOString().split('T')[0];
        params.endDate = dayAfter.toISOString().split('T')[0];
      } else if (filters.dateFilter === 'week') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = weekLater.toISOString().split('T')[0];
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
      // Preparar datos para enviar
      const taskData: any = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
      };

      // Agregar clientId solo si está seleccionado
      if (form.clientId) {
        taskData.clientId = form.clientId;
      }

      // Convertir dueDate a formato ISO si existe
      if (form.dueDate) {
        // datetime-local devuelve formato YYYY-MM-DDTHH:mm, necesitamos convertirlo a ISO
        const date = new Date(form.dueDate);
        taskData.dueDate = date.toISOString();
      }

      // Agregar assignedToUserId solo si está seleccionado
      if (form.assignedToUserId) {
        taskData.assignedToUserId = form.assignedToUserId;
      }

      if (editingTask) {
        await crmApi.updateTask(editingTask.id, taskData);
        showToast('Tarea actualizada exitosamente', 'success');
        setShowEditForm(false);
        setEditingTask(null);
      } else {
        await crmApi.createTask(taskData);
        showToast('Tarea creada exitosamente', 'success');
        setShowForm(false);
      }
      setForm({
        title: '',
        description: '',
        clientId: '',
        dueDate: '',
        assignedToUserId: user?.id || '',
        priority: 'MEDIUM',
      });
      fetchTasks();
      fetchReminders();
      onTaskChanged();
    } catch (error: any) {
      console.error('Error creating/updating task:', error);
      showToast(error.response?.data?.error?.message || `Error al ${editingTask ? 'actualizar' : 'crear'} la tarea`, 'error');
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      assignedToUserId: task.userId || user?.id || '',
      priority: task.priority || 'MEDIUM',
    });
    setShowEditForm(true);
  };

  const handleDelete = async (taskId: string) => {
    showConfirm(
      'Eliminar Tarea',
      '¿Está seguro de eliminar esta tarea? Esta acción no se puede deshacer.',
      async () => {
        try {
          await crmApi.deleteTask(taskId);
          showToast('Tarea eliminada exitosamente', 'success');
          fetchTasks();
          fetchReminders();
          onTaskChanged();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar la tarea', 'error');
    }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
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

  const handleExportExcel = () => {
    try {
      exportTasksToExcel(tasks);
      showToast('Exportando a Excel...', 'info');
    } catch (error) {
      showToast('Error al exportar a Excel', 'error');
    }
  };

  const handleExportPDF = () => {
    try {
      exportTasksToPDF(tasks);
      showToast('Exportando a PDF...', 'info');
    } catch (error) {
      showToast('Error al exportar a PDF', 'error');
    }
  };

  useImperativeHandle(ref, () => ({
    handleExportExcel,
    handleExportPDF,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-4">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center">
                <HiSearch className="w-4 h-4 mr-1 text-gray-400" />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Título, descripción, cliente..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') fetchTasks();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                <option value="PENDING">Pendientes</option>
                <option value="COMPLETED">Completadas</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <select
                value={filters.dateFilter}
                onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todas</option>
                <option value="today">Hoy</option>
                <option value="tomorrow">Mañana</option>
                <option value="week">Esta semana</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-end space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md text-sm inline-flex items-center whitespace-nowrap"
              >
                <HiSearch className="w-4 h-4 mr-1" />
                Filtros
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md text-sm inline-flex items-center justify-center whitespace-nowrap"
              >
                <HiCheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">Nueva Tarea</span>
              </button>
            </div>
          </div>

          {/* Filtros Avanzados */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    value={filters.clientId}
                    onChange={(e) => setFilters({ ...filters, clientId: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Todos</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, dateFilter: 'all', page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
            <div className="flex items-end">
              <button
                    onClick={() => {
                      setFilters({
                        ...filters,
                        clientId: '',
                        assignedToUserId: '',
                        startDate: '',
                        endDate: '',
                        dateFilter: 'all',
                        priority: '',
                        status: '',
                        search: '',
                        page: 1,
                      });
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md text-sm inline-flex items-center justify-center"
              >
                    <HiXCircle className="w-4 h-4 mr-1" />
                    Limpiar
              </button>
            </div>
          </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, dateFilter: 'all', page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
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
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : task.isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status === 'COMPLETED' ? (
                              <>
                                <HiCheckCircle className="w-3 h-3 mr-1" />
                                Completada
                              </>
                            ) : task.isOverdue ? (
                              <>
                                <HiExclamationCircle className="w-3 h-3 mr-1" />
                                Vencida
                              </>
                            ) : (
                              <>
                                <HiClock className="w-3 h-3 mr-1" />
                                Pendiente
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            task.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority === 'HIGH' && <HiArrowUp className="w-3 h-3 mr-1" />}
                            {task.priority === 'LOW' && <HiArrowDown className="w-3 h-3 mr-1" />}
                            {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
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
                          <div className="flex items-center justify-end gap-2">
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleComplete(task.id)}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                title="Completar tarea"
                            >
                                <HiCheckCircle className="w-5 h-5" />
                            </button>
                          )}
                            <div className="relative">
                              <button
                                onClick={() => setActionMenuOpen(actionMenuOpen === task.id ? null : task.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Más opciones"
                              >
                                <HiDotsVertical className="w-5 h-5" />
                              </button>
                              {actionMenuOpen === task.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setActionMenuOpen(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl z-20 border border-gray-200 overflow-hidden">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handleEdit(task);
                                          setActionMenuOpen(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 inline-flex items-center transition-colors gap-2"
                                      >
                                        <HiPencil className="w-4 h-4 flex-shrink-0" />
                                        <span>Editar</span>
                                      </button>
                                      <div className="border-t border-gray-100 my-1"></div>
                                      <button
                                        onClick={() => {
                                          handleDelete(task.id);
                                          setActionMenuOpen(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 inline-flex items-center transition-colors gap-2"
                                      >
                                        <HiTrash className="w-4 h-4 flex-shrink-0" />
                                        <span>Eliminar</span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
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

      {/* Modal de Nueva/Editar Tarea */}
      {(showForm || showEditForm) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          aria-describedby="task-modal-description"
          onClick={() => {
            setShowForm(false);
            setShowEditForm(false);
            setEditingTask(null);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 id="task-modal-title" className="text-lg font-semibold text-gray-900 mb-4">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <p id="task-modal-description" className="sr-only">
                Formulario para {editingTask ? 'editar' : 'crear'} una tarea en el CRM.
              </p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
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
                    {editingTask ? 'Actualizar' : 'Crear'} Tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setShowEditForm(false);
                      setEditingTask(null);
                    }}
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
});

TasksTab.displayName = 'TasksTab';

export default TasksTab;
