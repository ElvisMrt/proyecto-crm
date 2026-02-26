import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

// Permisos del sistema
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  
  // Sales
  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  SALES_UPDATE: 'sales:update',
  SALES_DELETE: 'sales:delete',
  SALES_CANCEL: 'sales:cancel',
  SALES_PRINT: 'sales:print',
  SALES_SEND: 'sales:send',
  SALES_NCF: 'sales:ncf',
  SALES_POS: 'sales:pos',
  SALES_CREDIT_NOTE: 'sales:credit-note',
  
  // Receivables
  RECEIVABLES_READ: 'receivables:read',
  RECEIVABLES_PAYMENT_CREATE: 'receivables:payment:create',
  RECEIVABLES_PAYMENT_DELETE: 'receivables:payment:delete',
  RECEIVABLES_OVERDUE_READ: 'receivables:overdue:read',
  RECEIVABLES_REMINDER_SEND: 'receivables:reminder:send',
  RECEIVABLES_REPORT_READ: 'receivables:report:read',
  
  // Cash
  CASH_READ: 'cash:read',
  CASH_OPEN: 'cash:open',
  CASH_CLOSE: 'cash:close',
  CASH_UPDATE: 'cash:update',
  CASH_MOVEMENT_CREATE: 'cash:movement:create',
  CASH_MOVEMENT_DELETE: 'cash:movement:delete',
  CASH_HISTORY_READ: 'cash:history:read',
  
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_PRODUCT_CREATE: 'inventory:product:create',
  INVENTORY_PRODUCT_UPDATE: 'inventory:product:update',
  INVENTORY_PRODUCT_DELETE: 'inventory:product:delete',
  INVENTORY_STOCK_READ: 'inventory:stock:read',
  INVENTORY_MOVEMENT_READ: 'inventory:movement:read',
  INVENTORY_ADJUST_CREATE: 'inventory:adjust:create',
  INVENTORY_ADJUST_DELETE: 'inventory:adjust:delete',
  
  // Clients
  CLIENTS_READ: 'clients:read',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // CRM
  CRM_READ: 'crm:read',
  CRM_TASK_CREATE: 'crm:task:create',
  CRM_TASK_UPDATE: 'crm:task:update',
  CRM_TASK_DELETE: 'crm:task:delete',
  CRM_NOTE_CREATE: 'crm:note:create',
  CRM_COMMUNICATION_SEND: 'crm:communication:send',
  
  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_USERS_READ: 'settings:users:read',
  SETTINGS_USERS_CREATE: 'settings:users:create',
  SETTINGS_USERS_UPDATE: 'settings:users:update',
  SETTINGS_USERS_DELETE: 'settings:users:delete',
} as const;

// Matriz de permisos por rol
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRATOR: Object.values(PERMISSIONS),
  SUPERVISOR: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_CANCEL,
    PERMISSIONS.SALES_NCF,
    PERMISSIONS.SALES_POS,
    PERMISSIONS.SALES_CREDIT_NOTE,
    PERMISSIONS.RECEIVABLES_READ,
    PERMISSIONS.RECEIVABLES_PAYMENT_CREATE,
    PERMISSIONS.RECEIVABLES_OVERDUE_READ,
    PERMISSIONS.RECEIVABLES_REMINDER_SEND,
    PERMISSIONS.RECEIVABLES_REPORT_READ,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPEN,
    PERMISSIONS.CASH_CLOSE,
    PERMISSIONS.CASH_UPDATE,
    PERMISSIONS.CASH_MOVEMENT_CREATE,
    PERMISSIONS.CASH_HISTORY_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_PRODUCT_CREATE,
    PERMISSIONS.INVENTORY_PRODUCT_UPDATE,
    PERMISSIONS.INVENTORY_STOCK_READ,
    PERMISSIONS.INVENTORY_MOVEMENT_READ,
    PERMISSIONS.INVENTORY_ADJUST_CREATE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_TASK_CREATE,
    PERMISSIONS.CRM_TASK_UPDATE,
    PERMISSIONS.CRM_NOTE_CREATE,
    PERMISSIONS.CRM_COMMUNICATION_SEND,
    PERMISSIONS.REPORTS_READ,
  ],
  OPERATOR: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_NCF,
    PERMISSIONS.SALES_POS,
    PERMISSIONS.SALES_PRINT,
    PERMISSIONS.SALES_SEND,
    PERMISSIONS.RECEIVABLES_READ,
    PERMISSIONS.RECEIVABLES_PAYMENT_CREATE,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPEN,
    PERMISSIONS.CASH_MOVEMENT_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_STOCK_READ,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CRM_READ,
    PERMISSIONS.CRM_TASK_CREATE,
  ],
  CASHIER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_POS,
    PERMISSIONS.SALES_PRINT,
    PERMISSIONS.SALES_SEND,
    PERMISSIONS.RECEIVABLES_READ,
    PERMISSIONS.RECEIVABLES_PAYMENT_CREATE,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPEN,
    PERMISSIONS.CASH_MOVEMENT_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_STOCK_READ,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CRM_READ,
  ],
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `You do not have permission: ${permission}`
        }
      });
    }

    next();
  };
};

