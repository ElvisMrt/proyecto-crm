import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const TenantIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9h.01" />
    <path d="M9 13h.01" />
    <path d="M9 17h.01" />
  </svg>
);

const BillingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, description: 'Visión general' },
  { to: '/tenants', label: 'Tenants', icon: TenantIcon, description: 'Gestión operativa' },
  { to: '/billing', label: 'Facturación', icon: BillingIcon, description: 'Cobros y planes' },
  { to: '/products', label: 'Website', icon: ProductIcon, description: 'Productos públicos' },
  { to: '/settings', label: 'Configuración', icon: SettingsIcon, description: 'Opciones del panel' },
];

export const SaaSLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const saasUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('saasUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const currentSection = useMemo(() => {
    return navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'SaaS Admin';
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('saasToken');
    localStorage.removeItem('saasUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="flex min-h-screen">
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menu"
            className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-slate-200 bg-white/92 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xl font-black uppercase tracking-[0.26em] text-slate-950">NEYPIER</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">CONTROL HUB</p>
              <h1 className="text-sm font-semibold text-slate-950">SaaS Admin</h1>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sesión</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{saasUser?.name || 'Super Admin'}</p>
            <p className="text-xs text-slate-500">{saasUser?.email || 'saas@admin.local'}</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]'
                        : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-current/10">
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">SaaS</p>
                  <h2 className="text-lg font-semibold text-slate-950">{currentSection}</h2>
                </div>
              </div>
              <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 sm:block">
                Panel maestro multi-tenant
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
