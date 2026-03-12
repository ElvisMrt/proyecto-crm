import { useState } from 'react';
import CompanyTab from '../components/settings/CompanyTab';
import BranchesTab from '../components/settings/BranchesTab';
import UsersTab from '../components/settings/UsersTab';
import RolesTab from '../components/settings/RolesTab';
import NCFTab from '../components/settings/NCFTab';
import WhatsAppTab from '../components/settings/WhatsAppTab';
import {
  HiOfficeBuilding,
  HiHome,
  HiUser,
  HiLockClosed,
  HiDocumentText,
  HiChat,
} from 'react-icons/hi';

type TabType = 'company' | 'branches' | 'users' | 'roles' | 'ncf' | 'whatsapp';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabType>('company');

  const tabs = [
    { id: 'company' as TabType, label: 'Empresa', icon: HiOfficeBuilding },
    { id: 'branches' as TabType, label: 'Sucursales', icon: HiHome },
    { id: 'users' as TabType, label: 'Usuarios', icon: HiUser },
    { id: 'roles' as TabType, label: 'Roles y Permisos', icon: HiLockClosed },
    { id: 'ncf' as TabType, label: 'NCF', icon: HiDocumentText },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: HiChat },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sistema</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Configuración</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Administración del sistema</p>
        </div>
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
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'company' && <CompanyTab />}
          {activeTab === 'branches' && <BranchesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'ncf' && <NCFTab />}
          {activeTab === 'whatsapp' && <WhatsAppTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
