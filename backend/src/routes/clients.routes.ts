import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, toggleClientStatus } from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CLIENTS_READ), getClients);
router.get('/:id', requirePermission(PERMISSIONS.CLIENTS_READ), getClient);
router.post('/', requirePermission(PERMISSIONS.CLIENTS_CREATE), createClient);
router.put('/:id', requirePermission(PERMISSIONS.CLIENTS_UPDATE), updateClient);
router.patch('/:id/status', requirePermission(PERMISSIONS.CLIENTS_UPDATE), toggleClientStatus);

export default router;

