import { Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  toggleClientStatus,
  deleteClient,
  getClientInvoices,
  getClientQuotes,
  getClientPayments,
} from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CLIENTS_READ), getClients);
router.get('/:id', requirePermission(PERMISSIONS.CLIENTS_READ), getClient);
router.get('/:id/invoices', requirePermission(PERMISSIONS.CLIENTS_READ), getClientInvoices);
router.get('/:id/quotes', requirePermission(PERMISSIONS.CLIENTS_READ), getClientQuotes);
router.get('/:id/payments', requirePermission(PERMISSIONS.CLIENTS_READ), getClientPayments);
router.post('/', requirePermission(PERMISSIONS.CLIENTS_CREATE), createClient);
router.put('/:id', requirePermission(PERMISSIONS.CLIENTS_UPDATE), updateClient);
router.patch('/:id/status', requirePermission(PERMISSIONS.CLIENTS_UPDATE), toggleClientStatus);
router.delete('/:id', requirePermission(PERMISSIONS.CLIENTS_DELETE), deleteClient);

export default router;

