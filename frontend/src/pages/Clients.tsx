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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Relación</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Clientes</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Gestión de clientes y contactos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide">
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
