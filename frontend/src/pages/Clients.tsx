import { useState } from 'react';
import ClientsListTab from '../components/clients/ClientsListTab';
import ClientFormTab from '../components/clients/ClientFormTab';
import ClientCardTab from '../components/clients/ClientCardTab';
import {
  HiClipboardList,
  HiPencil,
  HiReceiptTax,
} from 'react-icons/hi';

type TabType = 'list' | 'form' | 'card';

const Clients = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any>(null);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('card');
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setActiveTab('form');
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setActiveTab('form');
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedClientId(null);
    setEditingClient(null);
  };

  const tabs = [
    { id: 'list' as TabType, label: 'Listado de Clientes', icon: HiClipboardList },
    { id: 'form' as TabType, label: editingClient ? 'Editar Cliente' : 'Nuevo Cliente', icon: HiPencil },
    { id: 'card' as TabType, label: 'Ficha del Cliente', icon: HiReceiptTax },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de clientes y contactos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Clientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'list') {
                  handleBackToList();
                } else if (tab.id === 'form' && !editingClient && !selectedClientId) {
                  handleNewClient();
                } else if (tab.id === 'card' && selectedClientId) {
                  setActiveTab('card');
                }
              }}
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
          {activeTab === 'list' && (
            <ClientsListTab
              onClientSelect={handleClientSelect}
              onClientEdit={handleEditClient}
            />
          )}
          {activeTab === 'form' && (
            <ClientFormTab
              client={editingClient}
              onSave={() => {
                handleBackToList();
              }}
              onCancel={handleBackToList}
            />
          )}
          {activeTab === 'card' && selectedClientId && (
            <ClientCardTab
              clientId={selectedClientId}
              onEdit={() => {
                // Will be handled by fetching client data
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
