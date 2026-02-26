import { useState } from 'react';
import CompanyTab from '../components/settings/CompanyTab';
import BranchesTab from '../components/settings/BranchesTab';
import UsersTab from '../components/settings/UsersTab';
import RolesTab from '../components/settings/RolesTab';
import NCFTab from '../components/settings/NCFTab';
// WhatsApp module disabled
// import WhatsAppTab from '../components/settings/WhatsAppTab';
import {
  HiOfficeBuilding,
  HiHome,
  HiUser,
  HiLockClosed,
  HiDocumentText,
  // HiChat, // WhatsApp icon disabled
} from 'react-icons/hi';

type TabType = 'company' | 'branches' | 'users' | 'roles' | 'ncf';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabType>('company');

  const tabs = [
    { id: 'company' as TabType, label: 'Empresa', icon: HiOfficeBuilding },
    { id: 'branches' as TabType, label: 'Sucursales', icon: HiHome },
    { id: 'users' as TabType, label: 'Usuarios', icon: HiUser },
    { id: 'roles' as TabType, label: 'Roles y Permisos', icon: HiLockClosed },
    { id: 'ncf' as TabType, label: 'NCF', icon: HiDocumentText },
    // WhatsApp tab disabled
    // { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: HiChat },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">Administración del sistema</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Configuración</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
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
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'company' && <CompanyTab />}
          {activeTab === 'branches' && <BranchesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'ncf' && <NCFTab />}
          {/* WhatsApp tab disabled */}
          {/* {activeTab === 'whatsapp' && <WhatsAppTab />} */}
        </div>
      </div>
    </div>
  );
};

export default Settings;

