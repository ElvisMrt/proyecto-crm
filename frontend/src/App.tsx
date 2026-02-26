import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './hooks/useConfirm.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Sales from './pages/Sales';
import InvoiceForm from './components/sales/InvoiceForm';
import InvoiceDetail from './components/sales/InvoiceDetail';
import QuoteForm from './components/sales/QuoteForm';
import QuoteDetail from './components/sales/QuoteDetail';
import CreditNoteForm from './components/sales/CreditNoteForm';
import CreditNoteDetail from './components/sales/CreditNoteDetail';
import Receivables from './pages/Receivables';
import Cash from './pages/Cash';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import CRM from './pages/CRM';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuppliersDashboard from './pages/SuppliersDashboard';
import Purchases from './pages/Purchases';
import PurchasesTest from './pages/PurchasesTest';
import SupplierInvoices from './pages/SupplierInvoices';
import SupplierPayments from './pages/SupplierPayments';
import Appointments from './pages/Appointments';
import PublicAppointments from './pages/PublicAppointments';

// SaaS Admin - COMPLETAMENTE INDEPENDIENTE del CRM
import SaaSLogin from './pages/SaaSLogin';
import SaaSDashboard from './pages/SaaSDashboard';
import SaaSTenants from './pages/SaaSTenants';
import SaaSTenantDetail from './pages/SaaSTenantDetail';
import SaaSBilling from './pages/SaaSBilling';
import SaaSSettings from './pages/SaaSSettings';
import { SaaSLayout } from './components/SaaSLayout';
import { SaaSPrivateRoute } from './components/SaaSPrivateRoute';

// Detectar si estamos en modo SaaS Admin (sin tenant específico)
const isSaaSAdminMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Si hay parámetro ?mode=saas en localhost, forzar modo SaaS
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && searchParams.get('mode') === 'saas') {
    return true;
  }
  
  // Si hay parámetro ?mode=crm en localhost, forzar modo CRM
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && searchParams.get('mode') === 'crm') {
    return false;
  }
  
  // Localhost sin subdominio = CRM por defecto (para desarrollo)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  
  // Detectar subdominios de localhost (ej: mi-empresa-demo.localhost)
  if (hostname.includes('.localhost')) {
    const parts = hostname.split('.');
    // Si tiene un subdominio antes de .localhost, es modo CRM
    if (parts.length > 1) {
      return false; // cualquier subdominio.localhost = CRM
    }
  }
  
  // Subdominios específicos de admin = SaaS
  if (hostname.startsWith('admin.') || hostname.startsWith('app.') || hostname.startsWith('www.')) {
    return true;
  }
  
  // Dominio base sin subdominio = SaaS
  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return true; // neypier.com = SaaS
  }
  
  // Cualquier otro subdominio = Tenant CRM
  return false; // tenant.neypier.com = CRM
};

function App() {
  const saasMode = isSaaSAdminMode();

  return (
    <BrowserRouter>
      <Routes>
        {saasMode ? (
          // Modo SaaS Admin
          <>
            <Route path="/login" element={<SaaSLogin />} />
            <Route
              path="/*"
              element={
                <SaaSPrivateRoute>
                  <SaaSLayout />
                </SaaSPrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<SaaSDashboard />} />
              <Route path="tenants" element={<SaaSTenants />} />
              <Route path="tenants/:id" element={<SaaSTenantDetail />} />
              <Route path="billing" element={<SaaSBilling />} />
              <Route path="settings" element={<SaaSSettings />} />
            </Route>
          </>
        ) : (
          // Modo CRM Tenant
          <Route
            path="/*"
            element={
              <ThemeProvider>
                <ToastProvider>
                  <ConfirmProvider>
                    <AuthProvider>
                      <CRMRoutes />
                    </AuthProvider>
                  </ConfirmProvider>
                </ToastProvider>
              </ThemeProvider>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}

// Componente separado para las rutas del CRM
function CRMRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="purchases-test" element={<PurchasesTest />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new-invoice" element={<InvoiceForm />} />
        <Route path="sales/invoices/:id" element={<InvoiceDetail />} />
        <Route path="sales/invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="sales/quotes/new" element={<QuoteForm />} />
        <Route path="sales/quotes/:id" element={<QuoteDetail />} />
        <Route path="sales/quotes/:id/edit" element={<QuoteForm />} />
        <Route path="sales/credit-notes/new" element={<CreditNoteForm />} />
        <Route path="sales/credit-notes/:id" element={<CreditNoteDetail />} />
        <Route path="/receivables" element={<Receivables />} />
        <Route path="/suppliers-dashboard" element={<SuppliersDashboard />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/supplier-invoices" element={<SupplierInvoices />} />
        <Route path="/supplier-payments" element={<SupplierPayments />} />
        <Route path="/cash" element={<Cash />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/crm" element={<CRM />}>
          <Route path="appointments" element={<Appointments />} />
          <Route path="public-appointments" element={<PublicAppointments />} />
        </Route>
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
