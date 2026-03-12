import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav, { allMobileItems } from './BottomNav';
import { useState } from 'react';
import { HiX, HiLogout } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { HiMoon, HiSun } from 'react-icons/hi';

const Layout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(226,232,240,0.65),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(71,85,105,0.22),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      {/* 
        En móvil: sidebar es fixed (no ocupa espacio en el flujo), 
        por eso este div ocupa w-full sin restricción.
        En lg+: sidebar es static, flex-1 toma el espacio restante.
      */}
      <div className="flex min-w-0 w-0 flex-1 flex-col overflow-hidden lg:w-auto">
        <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-20 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-5">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - solo móvil */}
      <BottomNav onMoreClick={() => setIsMobileMoreOpen(true)} />

      {/* Modal "Más" para móvil */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMoreOpen(false)}
          />
          <div className="relative w-full rounded-t-[28px] border border-slate-200 bg-white p-4 pb-8 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Todos los módulos</h2>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allMobileItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:active:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {theme === 'dark' ? <HiSun className="h-5 w-5" /> : <HiMoon className="h-5 w-5" />}
                {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              </button>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-medium text-white dark:bg-white dark:text-slate-950"
              >
                <HiLogout className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;











