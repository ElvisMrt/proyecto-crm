import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logoSrc from '../utils/3.svg';

// Iconos SVG inline (sin dependencias externas)
const Building2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M12 6h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/><path d="M8 6h.01"/><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/></svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const LayoutDashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
);

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
);

export const SaaSLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('saasToken');
    localStorage.removeItem('saasUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header SaaS */}
      <header className="text-white shadow-lg" style={{ background: 'linear-gradient(to right, #1D79C4, #1f2937)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img src={logoSrc} alt="Neypier" className="h-8 w-auto" />
              <h1 className="text-lg sm:text-xl font-bold">Administrador SaaS</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-2 sm:px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <LogOutIcon />
              <span className="hidden sm:inline ml-2">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Overlay para móvil */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar SaaS */}
        <aside className={`
          w-64 bg-white shadow-md min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)]
          fixed lg:static inset-y-0 left-0 z-50
          transform lg:transform-none transition-transform duration-300
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          top-14 sm:top-16 lg:top-0
        `}>
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-3 sm:px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors group"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 121, 196, 0.1)';
                e.currentTarget.style.color = '#1D79C4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <LayoutDashboardIcon />
              <span className="ml-2 sm:ml-3 font-medium">Dashboard</span>
            </Link>
            <Link
              to="/tenants"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-3 sm:px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors group"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 121, 196, 0.1)';
                e.currentTarget.style.color = '#1D79C4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <UsersIcon />
              <span className="ml-2 sm:ml-3 font-medium">Tenants</span>
            </Link>
            <Link
              to="/billing"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-3 sm:px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors group"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 121, 196, 0.1)';
                e.currentTarget.style.color = '#1D79C4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <CreditCardIcon />
              <span className="ml-2 sm:ml-3 font-medium">Facturación</span>
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-3 sm:px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors group"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 121, 196, 0.1)';
                e.currentTarget.style.color = '#1D79C4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <ShoppingBagIcon />
              <span className="ml-2 sm:ml-3 font-medium">Productos Website</span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-3 sm:px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors group"
              style={{ color: '#1f2937' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 121, 196, 0.1)';
                e.currentTarget.style.color = '#1D79C4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1f2937';
              }}
            >
              <SettingsIcon />
              <span className="ml-2 sm:ml-3 font-medium">Configuración</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
