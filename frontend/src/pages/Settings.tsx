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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="inline-flex items-center">
                <tab.icon className="w-4 h-4 mr-2" />
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'branches' && <BranchesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'ncf' && <NCFTab />}
        {/* WhatsApp tab disabled */}
        {/* {activeTab === 'whatsapp' && <WhatsAppTab />} */}
      </div>
    </div>
  );
};

export default Settings;

