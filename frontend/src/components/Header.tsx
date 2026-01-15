import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { HiBell, HiLogout, HiX, HiCheckCircle, HiMoon, HiSun } from 'react-icons/hi';
import { crmApi, dashboardApi, inventoryApi } from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  taskId?: string; // ID de la tarea si es una notificación de tarea
  isTask?: boolean; // Indica si es una notificación de tarea
  isStockAlert?: boolean; // Indica si es una notificación de stock
  productId?: string; // ID del producto si es una notificación de stock
}

const Header = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API - tasks and alerts
  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [overdueTasksData, pendingTasksData, summaryData, lowStockData] = await Promise.all([
        crmApi.getOverdueTasks(),
        crmApi.getTasks({ status: 'PENDING', limit: 20 }),
        dashboardApi.getSummary(),
        inventoryApi.getLowStockAlerts().catch(() => ({ data: [] })),
      ]);

      // Tareas vencidas
      const overdueTasks = overdueTasksData.data || overdueTasksData || [];
      const overdueTaskNotifications: Notification[] = overdueTasks.slice(0, 5).map((task: any) => {
        const daysOverdue = task.dueDate 
          ? Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          id: `task-overdue-${task.id}`,
          title: 'Tarea vencida',
          message: `${task.title}${task.client ? ` - ${task.client.name}` : ''}${daysOverdue > 0 ? ` (${daysOverdue} día${daysOverdue > 1 ? 's' : ''} de retraso)` : ''}`,
          type: 'error' as const,
          read: false,
          createdAt: task.dueDate || task.createdAt,
          taskId: task.id,
          isTask: true,
        };
      });

      // Tareas pendientes (próximas a vencer)
      const pendingTasks = pendingTasksData.data || pendingTasksData || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const pendingTaskNotifications: Notification[] = pendingTasks
        .filter((task: any) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          // Mostrar tareas que vencen hoy o mañana
          return dueDate >= today && dueDate <= dayAfter;
        })
        .slice(0, 5)
        .map((task: any) => {
          const dueDate = new Date(task.dueDate);
          const isToday = dueDate.toDateString() === today.toDateString();
          return {
            id: `task-pending-${task.id}`,
            title: isToday ? 'Tarea vence hoy' : 'Tarea vence mañana',
            message: `${task.title}${task.client ? ` - ${task.client.name}` : ''}`,
            type: 'warning' as const,
            read: false,
            createdAt: task.dueDate || task.createdAt,
            taskId: task.id,
            isTask: true,
          };
        });

      // Notificaciones de stock bajo
      const lowStockItems = lowStockData.data || lowStockData || [];
      const stockNotifications: Notification[] = lowStockItems.slice(0, 5).map((item: any) => ({
        id: `stock-low-${item.product?.id || Math.random()}-${item.branch?.id || 'default'}`,
        title: 'Stock bajo',
        message: `${item.product?.name || 'Producto'} - Stock: ${item.currentStock || 0} (Mínimo: ${item.minStock || 0})${item.branch ? ` - ${item.branch.name}` : ''}`,
        type: 'warning' as const,
        read: false,
        createdAt: new Date().toISOString(),
        isStockAlert: true,
        productId: item.product?.id,
      }));

      // Alertas generales
      const alertNotifications: Notification[] = [];
      
      if (summaryData.alerts?.overdueInvoices > 0) {
        alertNotifications.push({
          id: 'alert-overdue-invoices',
          title: 'Facturas vencidas',
          message: `${summaryData.alerts.overdueInvoices} factura${summaryData.alerts.overdueInvoices > 1 ? 's' : ''} vencida${summaryData.alerts.overdueInvoices > 1 ? 's' : ''}`,
          type: 'error' as const,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Si hay más productos con stock bajo que los mostrados, agregar notificación resumen
      if (lowStockItems.length > 5) {
        alertNotifications.push({
          id: 'alert-stock-summary',
          title: 'Múltiples productos con stock bajo',
          message: `${lowStockItems.length} producto${lowStockItems.length > 1 ? 's' : ''} con stock bajo`,
          type: 'warning' as const,
          read: false,
          createdAt: new Date().toISOString(),
          isStockAlert: true,
        });
      }

      // Combinar todas las notificaciones, priorizando tareas vencidas
      setNotifications([...overdueTaskNotifications, ...pendingTaskNotifications, ...stockNotifications, ...alertNotifications]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const completeTask = async (taskId: string, notificationId: string) => {
    try {
      await crmApi.completeTask(taskId);
      showToast('Tarea completada exitosamente', 'success');
      // Remover la notificación de la lista
      setNotifications(notifications.filter(n => n.id !== notificationId));
      // Refrescar notificaciones
      fetchNotifications();
    } catch (error: any) {
      console.error('Error completing task:', error);
      showToast(error.response?.data?.error?.message || 'Error al completar la tarea', 'error');
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate('/crm');
    setShowNotifications(false);
  };

  const handleStockAlertClick = () => {
    navigate('/inventory?tab=alerts');
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'success':
        return '🟢';
      default:
        return '🔵';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar Tarea..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <HiSun className="w-5 h-5" />
            ) : (
              <HiMoon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              className={`flex items-start gap-3 flex-1 min-w-0 ${(notification.isTask || notification.isStockAlert) ? 'cursor-pointer' : ''}`}
                              onClick={
                                notification.isTask && notification.taskId 
                                  ? () => handleTaskClick(notification.taskId!)
                                  : notification.isStockAlert
                                    ? handleStockAlertClick
                                    : undefined
                              }
                            >
                              <span className="text-xl mt-0.5 flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString('es-DO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {notification.isTask && notification.taskId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeTask(notification.taskId!, notification.id);
                                  }}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600 hover:text-green-700 transition-colors"
                                  title="Completar tarea"
                                >
                                  <HiCheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                                  title="Marcar como leída"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 text-center bg-gray-50 flex gap-2">
                    <button 
                      onClick={() => {
                        navigate('/crm');
                        setShowNotifications(false);
                      }}
                      className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver tareas
                    </button>
                    {notifications.some(n => n.isStockAlert) && (
                      <button 
                        onClick={() => {
                          navigate('/inventory?tab=alerts');
                          setShowNotifications(false);
                        }}
                        className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Ver stock
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;







