import { useState, useEffect } from 'react';
import { crmApi } from '../services/api';
import TasksTab from '../components/crm/TasksTab';
import OverdueTasksTab from '../components/crm/OverdueTasksTab';
import ClientHistoryTab from '../components/crm/ClientHistoryTab';
import {
  HiCheckCircle,
  HiExclamation,
  HiSearch,
  HiClipboardList,
  HiBell,
  HiChartBar,
} from 'react-icons/hi';

type TabType = 'tasks' | 'overdue' | 'history';

const CRM = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [summary, setSummary] = useState({
    pendingTasks: 0,
    overdueTasks: 0,
    reminders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await crmApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'tasks' as TabType, label: 'Tareas Pendientes', icon: HiCheckCircle },
    { id: 'overdue' as TabType, label: 'Tareas Vencidas', icon: HiExclamation, badge: summary.overdueTasks },
    { id: 'history' as TabType, label: 'Historial del Cliente', icon: HiSearch },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Tareas Pendientes</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{summary.pendingTasks}</p>
            </div>
            <HiClipboardList className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Tareas Vencidas</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{summary.overdueTasks}</p>
            </div>
            <HiExclamation className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Recordatorios</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{summary.reminders}</p>
            </div>
            <HiBell className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Historial del Cliente</p>
              <p className="text-xs text-gray-600 mt-1">Vista 360°</p>
            </div>
            <HiChartBar className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'tasks' && <TasksTab onTaskChanged={fetchSummary} />}
        {activeTab === 'overdue' && <OverdueTasksTab onTaskChanged={fetchSummary} />}
        {activeTab === 'history' && <ClientHistoryTab />}
      </div>
    </div>
  );
};

export default CRM;
