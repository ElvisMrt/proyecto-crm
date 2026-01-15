import { useState } from 'react';
import GeneralSummaryTab from '../components/reports/GeneralSummaryTab';
import SalesReportTab from '../components/reports/SalesReportTab';
import ReceivablesReportTab from '../components/reports/ReceivablesReportTab';
import CashReportTab from '../components/reports/CashReportTab';
import InventoryReportTab from '../components/reports/InventoryReportTab';
import DailyProfitTab from '../components/reports/DailyProfitTab';
import {
  HiChartBar,
  HiCurrencyDollar,
  HiReceiptTax,
  HiCash,
  HiCube,
  HiStar,
} from 'react-icons/hi';

type TabType = 'summary' | 'sales' | 'receivables' | 'cash' | 'inventory' | 'profit';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const tabs = [
    { id: 'summary' as TabType, label: 'Resumen General', icon: HiChartBar },
    { id: 'sales' as TabType, label: 'Ventas', icon: HiCurrencyDollar },
    { id: 'receivables' as TabType, label: 'Ctas. por Cobrar', icon: HiReceiptTax },
    { id: 'cash' as TabType, label: 'Caja', icon: HiCash },
    { id: 'inventory' as TabType, label: 'Inventario', icon: HiCube },
    { id: 'profit' as TabType, label: '¿Cuánto gané hoy?', icon: HiStar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
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
        {activeTab === 'summary' && <GeneralSummaryTab />}
        {activeTab === 'sales' && <SalesReportTab />}
        {activeTab === 'receivables' && <ReceivablesReportTab />}
        {activeTab === 'cash' && <CashReportTab />}
        {activeTab === 'inventory' && <InventoryReportTab />}
        {activeTab === 'profit' && <DailyProfitTab />}
      </div>
    </div>
  );
};

export default Reports;

