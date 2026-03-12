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
    completedToday: 0,
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Seguimiento</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">CRM</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Gestión de tareas y seguimiento de clientes</p>
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
          value={summary.completedToday}
          icon={<HiCheckCircle className="w-full h-full" />}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-2 sm:px-0 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }
              `}
              title={tab.label}
            >
              <span className="inline-flex items-center gap-1.5">
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.label.split(' ')[0]}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-slate-100 py-0.5 px-1.5 text-[10px] font-medium text-slate-700 sm:text-xs">
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
