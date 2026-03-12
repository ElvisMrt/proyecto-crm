import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { HiBell, HiX, HiCheckCircle, HiMoon, HiSun, HiMenu } from 'react-icons/hi';
import { crmApi, dashboardApi, inventoryApi } from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  taskId?: string;
  isTask?: boolean;
  isStockAlert?: boolean;
  productId?: string;
}

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

const Header = ({ onMobileMenuClick }: HeaderProps) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await fetchNotifications();
    };

    run();
    const interval = window.setInterval(run, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const [overdueTasksData, pendingTasksData, summaryData, lowStockData] = await Promise.all([
        crmApi.getOverdueTasks(),
        crmApi.getTasks({ status: 'PENDING', limit: 20 }),
        dashboardApi.getSummary(),
        inventoryApi.getLowStockAlerts().catch(() => ({ data: [] })),
      ]);

      const overdueTasks = overdueTasksData.data || overdueTasksData || [];
      const overdueTaskNotifications: Notification[] = overdueTasks.slice(0, 5).map((task: any) => {
        const daysOverdue = task.dueDate
          ? Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          id: `task-overdue-${task.id}`,
          title: 'Tarea vencida',
          message: `${task.title}${task.client ? ` - ${task.client.name}` : ''}${daysOverdue > 0 ? ` (${daysOverdue} día${daysOverdue > 1 ? 's' : ''} de retraso)` : ''}`,
          type: 'error',
          read: false,
          createdAt: task.dueDate || task.createdAt,
          taskId: task.id,
          isTask: true,
        };
      });

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
            type: 'warning',
            read: false,
            createdAt: task.dueDate || task.createdAt,
            taskId: task.id,
            isTask: true,
          };
        });

      const lowStockItems = lowStockData.data || lowStockData || [];
      const stockNotifications: Notification[] = lowStockItems.slice(0, 5).map((item: any) => ({
        id: `stock-low-${item.product?.id || Math.random()}-${item.branch?.id || 'default'}`,
        title: 'Stock bajo',
        message: `${item.product?.name || 'Producto'} - Stock: ${item.currentStock || 0} (Mínimo: ${item.minStock || 0})${item.branch ? ` - ${item.branch.name}` : ''}`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        isStockAlert: true,
        productId: item.product?.id,
      }));

      const alertNotifications: Notification[] = [];

      if (summaryData.alerts?.overdueInvoices > 0) {
        alertNotifications.push({
          id: 'alert-overdue-invoices',
          title: 'Facturas vencidas',
          message: `${summaryData.alerts.overdueInvoices} factura${summaryData.alerts.overdueInvoices > 1 ? 's' : ''} vencida${summaryData.alerts.overdueInvoices > 1 ? 's' : ''}`,
          type: 'error',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (lowStockItems.length > 5) {
        alertNotifications.push({
          id: 'alert-stock-summary',
          title: 'Múltiples productos con stock bajo',
          message: `${lowStockItems.length} producto${lowStockItems.length > 1 ? 's' : ''} con stock bajo`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
          isStockAlert: true,
        });
      }

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

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
  };

  const completeTask = async (taskId: string, notificationId: string) => {
    try {
      await crmApi.completeTask(taskId);
      showToast('Tarea completada exitosamente', 'success');
      setNotifications(notifications.filter((notification) => notification.id !== notificationId));
      fetchNotifications();
    } catch (error: any) {
      console.error('Error completing task:', error);
      showToast(error.response?.data?.error?.message || 'Error al completar la tarea', 'error');
    }
  };

  const handleTaskClick = () => {
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
    <header className="relative z-[100] isolate shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
        <button
          onClick={onMobileMenuClick}
          className="mr-2 rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
        >
          <HiMenu className="h-6 w-6" />
        </button>

        <div className="hidden max-w-md flex-1 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar tarea..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-600 dark:focus:bg-slate-950 dark:focus:ring-slate-800"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ml-2 flex items-center space-x-2 sm:ml-6 sm:space-x-4">
          <button
            onClick={toggleTheme}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <HiSun className="h-5 w-5" /> : <HiMoon className="h-5 w-5" />}
          </button>

          <div className="relative z-[220]" ref={notificationRef}>
            <button
              onClick={() => {
                if (!showNotifications) {
                  fetchNotifications();
                }
                setShowNotifications(!showNotifications);
              }}
              className="relative rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <HiBell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-[240] bg-slate-950/10 backdrop-blur-[1px] sm:hidden" />
                <div className="fixed left-2 right-2 top-16 z-[250] flex max-h-[75vh] w-auto flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:z-[250] sm:mt-3 sm:max-h-96 sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Centro</p>
                    <h3 className="font-semibold text-slate-950 dark:text-white">Notificaciones</h3>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${!notification.read ? 'bg-slate-50/70 dark:bg-slate-900/80' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`flex min-w-0 flex-1 items-start gap-3 ${(notification.isTask || notification.isStockAlert) ? 'cursor-pointer' : ''}`}
                              onClick={
                                notification.isTask
                                  ? handleTaskClick
                                  : notification.isStockAlert
                                    ? handleStockAlertClick
                                    : undefined
                              }
                            >
                              <span className="mt-0.5 flex-shrink-0 text-xl">{getNotificationIcon(notification.type)}</span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {notification.title}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                  {new Date(notification.createdAt).toLocaleDateString('es-DO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                              {notification.isTask && notification.taskId && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    completeTask(notification.taskId!, notification.id);
                                  }}
                                  className="rounded-xl p-1.5 text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
                                  title="Completar tarea"
                                >
                                  <HiCheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {!notification.read && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                  title="Marcar como leída"
                                >
                                  <HiX className="h-4 w-4" />
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
                  <div className="flex gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900">
                    <button
                      onClick={() => {
                        navigate('/crm');
                        setShowNotifications(false);
                      }}
                      className="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      Ver tareas
                    </button>
                    {notifications.some((notification) => notification.isStockAlert) && (
                      <button
                        onClick={() => {
                          navigate('/inventory?tab=alerts');
                          setShowNotifications(false);
                        }}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        Ver stock
                      </button>
                    )}
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white lg:block"
          >
            Salir
          </button>

          <div className="flex items-center space-x-2 border-l border-slate-200 pl-2 dark:border-slate-800 sm:space-x-3 sm:pl-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white sm:h-10 sm:w-10">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-950 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
