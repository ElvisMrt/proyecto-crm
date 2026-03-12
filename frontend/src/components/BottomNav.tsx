import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  HiHome,
  HiShoppingCart,
  HiCube,
  HiUsers,
  HiDotsHorizontal,
  HiClipboardCheck,
  HiCurrencyDollar,
  HiTruck,
  HiCash,
  HiChartBar,
  HiCog,
} from 'react-icons/hi';

interface BottomNavProps {
  onMoreClick: () => void;
}

const primaryItems = [
  { path: '/dashboard', label: 'Inicio', icon: HiHome },
  { path: '/sales', label: 'Ventas', icon: HiShoppingCart },
  { path: '/inventory', label: 'Inventario', icon: HiCube },
  { path: '/crm', label: 'CRM', icon: HiClipboardCheck },
];

export const allMobileItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiHome },
  { path: '/sales', label: 'Ventas', icon: HiShoppingCart },
  { path: '/receivables', label: 'Cobrar', icon: HiCurrencyDollar },
  { path: '/suppliers-dashboard', label: 'Proveedores', icon: HiTruck },
  { path: '/cash', label: 'Caja', icon: HiCash },
  { path: '/inventory', label: 'Inventario', icon: HiCube },
  { path: '/clients', label: 'Clientes', icon: HiUsers },
  { path: '/crm', label: 'CRM', icon: HiClipboardCheck },
  { path: '/reports', label: 'Reportes', icon: HiChartBar },
  { path: '/settings', label: 'Config.', icon: HiCog },
];

const BottomNav = ({ onMoreClick }: BottomNavProps) => {
  const location = useLocation();
  const { theme } = useTheme();

  const isPrimaryActive = primaryItems.some(item => location.pathname === item.path);
  const isMoreActive = !isPrimaryActive;
  const navBackground = theme === 'dark' ? '#020617' : '#ffffff';
  const navBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <nav
      className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-[140] isolate overflow-hidden shadow-[0_-12px_28px_rgba(15,23,42,0.12)] lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: navBackground,
        borderTop: `1px solid ${navBorder}`,
      }}
    >
      <div className="absolute inset-0 -z-10" style={{ backgroundColor: navBackground }} />
      <div className="flex h-16 items-stretch" style={{ backgroundColor: navBackground }}>
        {primaryItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:bg-slate-50 dark:active:bg-slate-900 flex ${
                isActive
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-slate-950 dark:bg-white" />
              )}
            </Link>
          );
        })}

        {/* Botón Más */}
        <button
          onClick={onMoreClick}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors active:bg-slate-50 dark:active:bg-slate-900 ${
            isMoreActive
              ? 'text-slate-950 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <HiDotsHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Más</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
