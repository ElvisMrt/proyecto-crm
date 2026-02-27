import { useState, useEffect, useRef } from 'react';
import { crmApi } from '../services/api';
import TasksTab, { TasksTabRef } from '../components/crm/TasksTab';
import OverdueTasksTab from '../components/crm/OverdueTasksTab';
import ClientHistoryTab from '../components/crm/ClientHistoryTab';
import Appointments from './Appointments';
import { MinimalStatCard } from '../components/MinimalStatCard';
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiSearch,
  HiClipboardCheck,
  HiBell,
  HiCalendar,
} from 'react-icons/hi';

type TabType = 'tasks' | 'overdue' | 'history' | 'appointments';

const CRM = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [summary, setSummary] = useState({
    pendingTasks: 0,
    overdueTasks: 0,
    reminders: 0,
  });
  const tasksTabRef = useRef<TasksTabRef>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await crmApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const tabs = [
    { id: 'tasks' as TabType, label: 'Tareas Pendientes', icon: HiClipboardCheck },
    { id: 'overdue' as TabType, label: 'Tareas Vencidas', icon: HiExclamationCircle, badge: summary.overdueTasks },
    { id: 'history' as TabType, label: 'Historial del Cliente', icon: HiSearch },
    { id: 'appointments' as TabType, label: 'Citas', icon: HiCalendar },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de tareas y seguimiento de clientes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">CRM</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MinimalStatCard
          title="Tareas Pendientes"
          value={summary.pendingTasks}
          icon={<HiClipboardCheck className="w-full h-full" />}
          color="orange"
        />
        <MinimalStatCard
          title="Tareas Vencidas"
          value={summary.overdueTasks}
          icon={<HiExclamationCircle className="w-full h-full" />}
          color="red"
        />
        <MinimalStatCard
          title="Recordatorios"
          value={summary.reminders}
          icon={<HiBell className="w-full h-full" />}
          color="blue"
        />
        <MinimalStatCard
          title="Completadas Hoy"
          value={0}
          icon={<HiCheckCircle className="w-full h-full" />}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="inline-flex items-center gap-2">
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-red-100 text-red-600 py-1 px-2 rounded-full text-xs font-medium">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'tasks' && <TasksTab ref={tasksTabRef} onTaskChanged={fetchSummary} />}
          {activeTab === 'overdue' && <OverdueTasksTab onTaskChanged={fetchSummary} />}
          {activeTab === 'history' && <ClientHistoryTab />}
          {activeTab === 'appointments' && <Appointments />}
        </div>
      </div>
    </div>
  );
};

export default CRM;
