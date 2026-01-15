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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        {activeTab === 'list' && (
          <button
            onClick={handleNewClient}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            + Nuevo Cliente
          </button>
        )}
        {activeTab !== 'list' && (
          <button
            onClick={handleBackToList}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
          >
            ← Volver al Listado
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
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
                py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="inline-flex items-center">
                <tab.icon className="w-5 h-5 mr-2" />
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
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
  );
};

export default Clients;
