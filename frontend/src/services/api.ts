import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  getStatus: async (clientId: string) => {
    const response = await api.get(`/receivables/status/${clientId}`);
    return response.data;
  },
  getOverdue: async (params?: any) => {
    const response = await api.get('/receivables/overdue', { params });
    return response.data;
  },
  createPayment: async (data: any) => {
    const response = await api.post('/receivables/payments', data);
    return response.data;
  },
  getPayments: async (params?: any) => {
    const response = await api.get('/receivables/payments', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/receivables/summary');
    return response.data;
  },
};

export const cashApi = {
  getCurrentCash: async () => {
    const response = await api.get('/cash/current');
    return response.data;
  },
  openCash: async (data: any) => {
    const response = await api.post('/cash/open', data);
    return response.data;
  },
  getCurrentCash: async (params?: any) => {
    const response = await api.get('/cash/current', { params });
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
    const response = await api.post('/cash/close', data);
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

export const whatsappApi = {
  getTemplates: async (params?: any) => {
    const response = await api.get('/whatsapp/templates', { params });
    return response.data;
  },
  getTemplate: async (id: string) => {
    const response = await api.get(`/whatsapp/templates/${id}`);
    return response.data;
  },
  createTemplate: async (data: any) => {
    const response = await api.post('/whatsapp/templates', data);
    return response.data;
  },
  updateTemplate: async (id: string, data: any) => {
    const response = await api.put(`/whatsapp/templates/${id}`, data);
    return response.data;
  },
  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/whatsapp/templates/${id}`);
    return response.data;
  },
  sendMessage: async (data: any) => {
    const response = await api.post('/whatsapp/send', data);
    return response.data;
  },
};

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
