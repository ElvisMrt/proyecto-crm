import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  HiHome,
  HiShoppingCart,
  HiCurrencyDollar,
  HiTruck,
  HiCash,
  HiCube,
  HiUsers,
  HiClipboardCheck,
  HiChartBar,
  HiCog,
  HiLogout,
  HiChevronLeft,
  HiChevronRight,
  HiCreditCard,
} from 'react-icons/hi';
import ManualDownloader from './ManualDownloader';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiHome },
  { path: '/sales', label: 'Ventas', icon: HiShoppingCart },
  { path: '/receivables', label: 'Cuentas por Cobrar', icon: HiCurrencyDollar },
  { path: '/suppliers-dashboard', label: 'Proveedores y Compras', icon: HiTruck },
  { path: '/cash', label: 'Caja', icon: HiCash },
  { path: '/inventory', label: 'Inventario', icon: HiCube },
  { path: '/clients', label: 'Clientes', icon: HiUsers },
  { path: '/loans', label: 'Préstamos', icon: HiCreditCard },
  { path: '/crm', label: 'CRM', icon: HiClipboardCheck },
  { path: '/reports', label: 'Reportes', icon: HiChartBar },
];

const generalItems = [
  { path: '/settings', label: 'Configuración', icon: HiCog },
  { path: '#', label: 'Cerrar Sesión', icon: HiLogout, action: 'logout' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarBackground = theme === 'dark' ? '#020617' : '#ffffff';
  const sidebarBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  const handleItemClick = (item: any) => {
    if (item.action === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const tooltip = (label: string) => (
    <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
      {label}
      <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1 -translate-y-1/2 rotate-45 bg-slate-950"></span>
    </span>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 shrink-0 flex flex-col shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300
          lg:static lg:z-auto lg:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-72 lg:w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundColor: sidebarBackground,
          borderRight: `1px solid ${sidebarBorder}`,
        }}
      >
        <div className={`${isCollapsed ? 'px-3 py-4' : 'px-6 py-5'} flex items-center border-b border-slate-200 dark:border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <span className="text-xl font-black uppercase tracking-[0.26em] text-slate-950 dark:text-white">
                    NEYPIER
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                    OPERATING CRM
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex-shrink-0 rounded-xl border border-slate-200 p-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                title="Colapsar"
              >
                <HiChevronLeft className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex w-full flex-col items-center space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black uppercase tracking-[0.22em] text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                N
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex w-full justify-center rounded-xl border border-slate-200 p-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                title="Expandir"
              >
                <HiChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'} space-y-1 overflow-x-hidden overflow-y-auto`}>
          {!isCollapsed && (
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Módulos</p>
          )}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-2 px-3 py-2.5'} rounded-2xl transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200'}`} />
                {!isCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                {isCollapsed && tooltip(item.label)}
              </Link>
            );
          })}
        </nav>

      <div className={`border-t border-slate-200 dark:border-slate-800 ${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'} space-y-1`}>
          {!isCollapsed && (
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">General</p>
          )}
          {generalItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.action === 'logout') {
              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex w-full items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-2 px-3 py-2.5'} rounded-2xl text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200`} />
                  {!isCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                  {isCollapsed && tooltip(item.label)}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex w-full items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-2 px-3 py-2.5'} rounded-2xl transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200'}`} />
                {!isCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                {isCollapsed && tooltip(item.label)}
              </Link>
            );
          })}

          {!isCollapsed && (
            <div className="px-3 py-2">
              <ManualDownloader variant="menu" />
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center py-2">
              <ManualDownloader variant="icon" />
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="border-t border-slate-200 px-3 py-4 dark:border-slate-800">
            <div className="flex items-center space-x-2 px-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-950 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-semibold text-white">
              {user?.name.charAt(0).toUpperCase()}
              {tooltip(user?.name || 'Usuario')}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
