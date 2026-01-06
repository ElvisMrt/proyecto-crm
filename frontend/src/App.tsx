import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
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

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
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
            <Route path="sales" element={<Sales />} />
            <Route path="sales/new-invoice" element={<InvoiceForm />} />
            <Route path="sales/invoices/:id" element={<InvoiceDetail />} />
            <Route path="sales/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="sales/quotes/new" element={<QuoteForm />} />
            <Route path="sales/quotes/:id" element={<QuoteDetail />} />
            <Route path="sales/quotes/:id/edit" element={<QuoteForm />} />
            <Route path="sales/credit-notes/new" element={<CreditNoteForm />} />
            <Route path="sales/credit-notes/:id" element={<CreditNoteDetail />} />
            <Route path="receivables" element={<Receivables />} />
            <Route path="cash" element={<Cash />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="clients" element={<Clients />} />
            <Route path="crm" element={<CRM />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;

