import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';
import {
  HiHome,
  HiShoppingCart,
  HiCurrencyDollar,
  HiCash,
  HiCube,
  HiUsers,
  HiClipboardCheck,
  HiChartBar,
  HiCog,
  HiChevronLeft,
  HiChevronRight,
  HiLogout,
} from 'react-icons/hi';
import logoSrc from '../utils/Logos.svg';
import logo2Src from '../utils/Logos 2.svg';
import logo3Src from '../utils/3.svg';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiHome },
  { path: '/sales', label: 'Ventas', icon: HiShoppingCart },
  { path: '/receivables', label: 'Cuentas por Cobrar', icon: HiCurrencyDollar },
  { path: '/cash', label: 'Caja', icon: HiCash },
  { path: '/inventory', label: 'Inventario', icon: HiCube },
  { path: '/clients', label: 'Clientes', icon: HiUsers },
  { path: '/crm', label: 'CRM', icon: HiClipboardCheck },
  { path: '/reports', label: 'Reportes', icon: HiChartBar },
];

const generalItems = [
  { path: '/settings', label: 'Configuración', icon: HiCog },
  { path: '#', label: 'Cerrar Sesión', icon: HiLogout, action: 'logout' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Seleccionar logo según el tema cuando está expandido
  const expandedLogoSrc = theme === 'light' ? logo3Src : logoSrc;

  const handleItemClick = (item: any) => {
    if (item.action === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 relative shadow-sm`}>
      {/* Logo Section */}
      <div className={`${isCollapsed ? 'px-3 py-4' : 'px-6 py-4'} border-b border-gray-200 dark:border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-auto overflow-hidden flex items-center justify-center flex-shrink-0">
                <img 
                  src={expandedLogoSrc} 
                  alt="Logo" 
                  className="w-auto object-contain object-center"
                  style={{ maxHeight: '40px', height: 'auto' }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 flex-shrink-0"
              title="Colapsar"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center space-y-3">
            <img 
              src={logo2Src} 
              alt="Logo" 
              className="h-10 w-auto"
            />
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 w-full flex justify-center"
              title="Expandir"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Menu Section */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'} space-y-1 overflow-y-auto overflow-x-hidden`}>
        {!isCollapsed && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">Menú</p>
        )}
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-2 px-3 py-2'} rounded-lg transition-all group relative ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
              {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity duration-200">
                  {item.label}
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* General Section */}
      <div className={`border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'} space-y-1`}>
        {!isCollapsed && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">General</p>
        )}
        {generalItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Component = item.action === 'logout' ? 'button' : Link;
          const props = item.action === 'logout' 
            ? { onClick: () => handleItemClick(item) }
            : { to: item.path };
          
          return (
            <Component
              key={item.path}
              {...props}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-2 px-3 py-2'} rounded-lg transition-all group relative w-full ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
              {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity duration-200">
                  {item.label}
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></span>
                </span>
              )}
            </Component>
          );
        })}
      </div>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-3">
          <div className="flex items-center space-x-2 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
      
      {isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold group relative">
            {user?.name.charAt(0).toUpperCase()}
            <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity duration-200">
              {user?.name}
              <span className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></span>
            </span>
          </div>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;

