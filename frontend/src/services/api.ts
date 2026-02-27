import axios from 'axios';
import { getTenantSubdomain } from './tenant.service';

// URL del API: si hay VITE_API_URL la usa, sino construye dinámicamente
// desde el host actual (funciona con cualquier subdominio nip.io o dominio real)
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : 'http://localhost:3001/api/v1');

// ============================================
// API para CRM (usa token del tenant)
// ============================================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const subdomain = getTenantSubdomain();
    if (subdomain) {
      config.headers['X-Tenant-Subdomain'] = subdomain;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo manejar 401 sin redirigir automáticamente (causa loops)
    // La redirección debe ser manejada por los componentes
    return Promise.reject(error);
  }
);

// ============================================
// API para SaaS Admin (usa saasToken)
// ============================================
const saasApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

saasApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saasToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

saasApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('saasToken');
      localStorage.removeItem('saasUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { saasApi };

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const dashboardApi = {
  getSummary: async (params?: { branchId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.branchId) {
      queryParams.append('branchId', params.branchId);
    }
    const response = await api.get(`/dashboard/summary?${queryParams.toString()}`);
    return response.data;
  },
  getSalesTrend: async (days = 7) => {
    const response = await api.get(`/dashboard/sales-trend?days=${days}`);
    return response.data;
  },
  getRecentActivity: async (limit = 10, params?: { branchId?: string }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    if (params?.branchId) {
      queryParams.append('branchId', params.branchId);
    }
    const response = await api.get(`/dashboard/recent-activity?${queryParams.toString()}`);
    return response.data;
  },
};

export const salesApi = {
  getInvoices: async (params?: any) => {
    const response = await api.get('/sales/invoices', { params });
    return response.data;
  },
  getInvoice: async (id: string) => {
    const response = await api.get(`/sales/invoices/${id}`);
    return response.data;
  },
  createInvoice: async (data: any) => {
    const response = await api.post('/sales/invoices', data);
    return response.data;
  },
  updateInvoice: async (id: string, data: any) => {
    const response = await api.put(`/sales/invoices/${id}`, data);
    return response.data;
  },
  duplicateInvoice: async (id: string) => {
    const response = await api.post(`/sales/invoices/${id}/duplicate`);
    return response.data;
  },
  cancelInvoice: async (id: string, reason: string) => {
    const response = await api.post(`/sales/invoices/${id}/cancel`, { reason });
    return response.data;
  },
  deleteInvoice: async (id: string) => {
    const response = await api.delete(`/sales/invoices/${id}`);
    return response.data;
  },
  getQuotes: async (params?: any) => {
    const response = await api.get('/sales/quotes', { params });
    return response.data;
  },
  getQuote: async (id: string) => {
    const response = await api.get(`/sales/quotes/${id}`);
    return response.data;
  },
  createQuote: async (data: any) => {
    const response = await api.post('/sales/quotes', data);
    return response.data;
  },
  updateQuote: async (id: string, data: any) => {
    const response = await api.put(`/sales/quotes/${id}`, data);
    return response.data;
  },
  deleteQuote: async (id: string) => {
    const response = await api.delete(`/sales/quotes/${id}`);
    return response.data;
  },
  convertQuoteToInvoice: async (id: string, data: any) => {
    const response = await api.post(`/sales/quotes/${id}/convert`, data);
    return response.data;
  },
  createPOSSale: async (data: any) => {
    const response = await api.post('/sales/pos', data);
    return response.data;
  },
  getCreditNotes: async (params?: any) => {
    const response = await api.get('/sales/credit-notes', { params });
    return response.data;
  },
  getCreditNote: async (id: string) => {
    const response = await api.get(`/sales/credit-notes/${id}`);
    return response.data;
  },
  createCreditNote: async (data: any) => {
    const response = await api.post('/sales/credit-notes', data);
    return response.data;
  },
  getCancelledInvoices: async (params?: any) => {
    const response = await api.get('/sales/cancelled', { params });
    return response.data;
  },
  getCancelledInvoicesCount: async () => {
    const response = await api.get('/sales/cancelled/count');
    return response.data;
  },
};

export const receivablesApi = {
  getStatus: async (clientId: string, params?: any) => {
    const response = await api.get(`/receivables/status/${clientId}`, { params });
    return response.data;
  },
  getOverdue: async (params?: any) => {
    const response = await api.get('/receivables/overdue', { params });
    return response.data;
  },
  createPayment: async (data: any, params?: any) => {
    const response = await api.post('/receivables/payments', data, { params });
    return response.data;
  },
  getPayments: async (params?: any) => {
    const response = await api.get('/receivables/payments', { params });
    return response.data;
  },
  getSummary: async (params?: any) => {
    const response = await api.get('/receivables/summary', { params });
    return response.data;
  },
};

export const cashApi = {
  getCurrentCash: async (params?: any) => {
    const response = await api.get('/cash/current', { params });
    return response.data;
  },
  openCash: async (data: any) => {
    const response = await api.post('/cash/open', data);
    return response.data;
  },
  getMovements: async (params?: any) => {
    const response = await api.get('/cash/movements', { params });
    return response.data;
  },
  createMovement: async (data: any) => {
    const response = await api.post('/cash/movements', data);
    return response.data;
  },
  closeCash: async (data: any) => {
    const { cashRegisterId, ...rest } = data;
    const response = await api.post(`/cash/close/${cashRegisterId}`, rest);
    return response.data;
  },
  updateCash: async (id: string, data: any) => {
    const response = await api.put(`/cash/${id}`, data);
    return response.data;
  },
  getHistory: async (params?: any) => {
    const response = await api.get('/cash/history', { params });
    return response.data;
  },
  getDailySummary: async (params?: any) => {
    const response = await api.get('/cash/daily-summary', { params });
    return response.data;
  },
};

export const inventoryApi = {
  getCategories: async () => {
    const response = await api.get('/inventory/categories');
    return response.data;
  },
  createCategory: async (data: any) => {
    const response = await api.post('/inventory/categories', data);
    return response.data;
  },
  updateCategory: async (id: string, data: any) => {
    const response = await api.put(`/inventory/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/inventory/categories/${id}`);
    return response.data;
  },
  getProducts: async (params?: any) => {
    const response = await api.get('/inventory/products', { params });
    return response.data;
  },
  getProduct: async (id: string) => {
    const response = await api.get(`/inventory/products/${id}`);
    return response.data;
  },
  createProduct: async (data: any) => {
    const response = await api.post('/inventory/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/inventory/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/inventory/products/${id}`);
    return response.data;
  },
  getStock: async (params?: any) => {
    const response = await api.get('/inventory/stock', { params });
    return response.data;
  },
  getMovements: async (params?: any) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },
  createAdjustment: async (data: any) => {
    const response = await api.post('/inventory/adjustments', data);
    return response.data;
  },
  getLowStockAlerts: async (params?: any) => {
    const response = await api.get('/inventory/alerts/low-stock', { params });
    return response.data;
  },
};

export const clientsApi = {
  getClients: async (params?: any) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },
  getClient: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  createClient: async (data: any) => {
    const response = await api.post('/clients', data);
    return response.data;
  },
  updateClient: async (id: string, data: any) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },
  toggleClientStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/clients/${id}/status`, { isActive });
    return response.data;
  },
  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
  getClientInvoices: async (id: string, params?: any) => {
    const response = await api.get(`/clients/${id}/invoices`, { params });
    return response.data;
  },
  getClientQuotes: async (id: string, params?: any) => {
    const response = await api.get(`/clients/${id}/quotes`, { params });
    return response.data;
  },
  getClientPayments: async (id: string, params?: any) => {
    const response = await api.get(`/clients/${id}/payments`, { params });
    return response.data;
  },
};

export const crmApi = {
  getTasks: async (params?: any) => {
    const response = await api.get('/crm/tasks', { params });
    return response.data;
  },
  getTask: async (id: string) => {
    const response = await api.get(`/crm/tasks/${id}`);
    return response.data;
  },
  createTask: async (data: any) => {
    const response = await api.post('/crm/tasks', data);
    return response.data;
  },
  updateTask: async (id: string, data: any) => {
    const response = await api.put(`/crm/tasks/${id}`, data);
    return response.data;
  },
  completeTask: async (id: string) => {
    const response = await api.patch(`/crm/tasks/${id}/complete`);
    return response.data;
  },
  deleteTask: async (id: string) => {
    const response = await api.delete(`/crm/tasks/${id}`);
    return response.data;
  },
  getOverdueTasks: async () => {
    const response = await api.get('/crm/tasks/overdue');
    return response.data;
  },
  getClientHistory: async (clientId: string) => {
    const response = await api.get(`/crm/clients/${clientId}/history`);
    return response.data;
  },
  getNotes: async (clientId: string) => {
    const response = await api.get(`/crm/clients/${clientId}/notes`);
    return response.data;
  },
  createNote: async (data: any) => {
    const response = await api.post('/crm/notes', data);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/crm/summary');
    return response.data;
  },
  getReminders: async () => {
    const response = await api.get('/crm/reminders');
    return response.data;
  },
  getLateCollections: async () => {
    const response = await api.get('/crm/late-collections');
    return response.data;
  },
};

export const reportsApi = {
  getGeneralSummary: async (params?: any) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },
  getDailyProfit: async (params?: any) => {
    const response = await api.get('/reports/daily-profit', { params });
    return response.data;
  },
  getSalesReport: async (params?: any) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },
  getReceivablesReport: async (params?: any) => {
    const response = await api.get('/reports/receivables', { params });
    return response.data;
  },
  getCashReport: async (params?: any) => {
    const response = await api.get('/reports/cash', { params });
    return response.data;
  },
  getInventoryReport: async (params?: any) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },
};

export const branchesApi = {
  getBranches: async () => {
    const response = await api.get('/settings/branches');
    return response.data;
  },
  getBranch: async (id: string) => {
    const response = await api.get(`/settings/branches/${id}`);
    return response.data;
  },
  createBranch: async (data: any) => {
    const response = await api.post('/settings/branches', data);
    return response.data;
  },
  updateBranch: async (id: string, data: any) => {
    const response = await api.put(`/settings/branches/${id}`, data);
    return response.data;
  },
};

// WhatsApp API disabled - WhatsApp module removed
// export const whatsappApi = {
//   getTemplates: async (params?: any) => {
//     const response = await api.get('/whatsapp/templates', { params });
//     return response.data;
//   },
//   getTemplate: async (id: string) => {
//     const response = await api.get(`/whatsapp/templates/${id}`);
//     return response.data;
//   },
//   createTemplate: async (data: any) => {
//     const response = await api.post('/whatsapp/templates', data);
//     return response.data;
//   },
//   updateTemplate: async (id: string, data: any) => {
//     const response = await api.put(`/whatsapp/templates/${id}`, data);
//     return response.data;
//   },
//   deleteTemplate: async (id: string) => {
//     const response = await api.delete(`/whatsapp/templates/${id}`);
//     return response.data;
//   },
//   sendMessage: async (data: any) => {
//     const response = await api.post('/whatsapp/send', data);
//     return response.data;
//   },
//   getInstanceStatus: async () => {
//     const response = await api.get('/whatsapp/instance/status');
//     return response.data;
//   },
//   createInstance: async () => {
//     const response = await api.post('/whatsapp/instance/create');
//     return response.data;
//   },
//   getQRCode: async () => {
//     const response = await api.get('/whatsapp/instance/qrcode');
//     return response.data;
//   },
// };

export const ncfApi = {
  getSequences: async (params?: any) => {
    const response = await api.get('/ncf', { params });
    return response.data;
  },
  getSequence: async (id: string) => {
    const response = await api.get(`/ncf/${id}`);
    return response.data;
  },
  createSequence: async (data: any) => {
    const response = await api.post('/ncf', data);
    return response.data;
  },
  updateSequence: async (id: string, data: any) => {
    const response = await api.put(`/ncf/${id}`, data);
    return response.data;
  },
  deleteSequence: async (id: string) => {
    const response = await api.delete(`/ncf/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/ncf/stats');
    return response.data;
  },
};

export const settingsApi = {
  // Company
  getCompany: async () => {
    const response = await api.get('/settings/company');
    return response.data;
  },
  updateCompany: async (data: any) => {
    const response = await api.put('/settings/company', data);
    return response.data;
  },
  // Branches
  getBranches: async () => {
    const response = await api.get('/settings/branches');
    return response.data;
  },
  getBranch: async (id: string) => {
    const response = await api.get(`/settings/branches/${id}`);
    return response.data;
  },
  createBranch: async (data: any) => {
    const response = await api.post('/settings/branches', data);
    return response.data;
  },
  updateBranch: async (id: string, data: any) => {
    const response = await api.put(`/settings/branches/${id}`, data);
    return response.data;
  },
  deleteBranch: async (id: string) => {
    const response = await api.delete(`/settings/branches/${id}`);
    return response.data;
  },
  // Users
  getUsers: async () => {
    const response = await api.get('/settings/users');
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/settings/users/${id}`);
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await api.post('/settings/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/settings/users/${id}`, data);
    return response.data;
  },
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/settings/users/${id}/status`, { isActive });
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/settings/users/${id}`);
    return response.data;
  },
  // Roles & Permissions
  getRoles: async () => {
    const response = await api.get('/settings/roles');
    return response.data;
  },
  getPermissions: async () => {
    const response = await api.get('/settings/permissions');
    return response.data;
  },
};

export const appointmentApi = {
  getAppointments: async (params?: any) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  getAppointment: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  createAppointment: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  updateAppointment: async (id: string, data: any) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },
  deleteAppointment: async (id: string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
};

export default api;
