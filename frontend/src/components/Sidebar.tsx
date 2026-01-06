import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiHome,
  HiDocumentText,
  HiCurrencyDollar,
  HiCash,
  HiCube,
  HiUsers,
  HiClipboardList,
  HiChartBar,
  HiCog,
} from 'react-icons/hi';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiHome },
  { path: '/sales', label: 'Ventas', icon: HiDocumentText },
  { path: '/receivables', label: 'Cuentas por Cobrar', icon: HiCurrencyDollar },
  { path: '/cash', label: 'Caja', icon: HiCash },
  { path: '/inventory', label: 'Inventario', icon: HiCube },
  { path: '/clients', label: 'Clientes', icon: HiUsers },
  { path: '/crm', label: 'CRM', icon: HiClipboardList },
  { path: '/reports', label: 'Reportes', icon: HiChartBar },
  { path: '/settings', label: 'Configuración', icon: HiCog },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">CRM</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

