import { useEffect, useState } from 'react';
import { crmApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

interface OverdueTasksTabProps {
  onTaskChanged: () => void;
}

const OverdueTasksTab = ({ onTaskChanged }: OverdueTasksTabProps) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getOverdueTasks();
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await crmApi.completeTask(taskId);
      showToast('Tarea completada exitosamente', 'success');
      fetchTasks();
      onTaskChanged();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al completar la tarea', 'error');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-red-900 mb-2">⚠️ Tareas Vencidas</h2>
        <p className="text-sm text-red-700">
          Estas tareas requieren atención urgente. Complétalas o reprograma las fechas límite.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            🎉 No hay tareas vencidas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Vencidos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-red-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.client?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                        {task.daysOverdue} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleComplete(task.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Completar
                        </button>
                        {task.client && (
                          <button
                            onClick={() => navigate(`/receivables?clientId=${task.client.id}`)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Ir a Cliente
                          </button>
                        )}
                      </div>
                    </td>
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

export default OverdueTasksTab;


