import { Router } from 'express';
import { getStatus, getOverdue, createPayment, getPayments, getSummary } from '../controllers/receivables.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

router.get('/status/:clientId', requirePermission(PERMISSIONS.RECEIVABLES_READ), getStatus);
router.get('/overdue', requirePermission(PERMISSIONS.RECEIVABLES_OVERDUE_READ), getOverdue);
router.post('/payments', requirePermission(PERMISSIONS.RECEIVABLES_PAYMENT_CREATE), createPayment);
router.get('/payments', requirePermission(PERMISSIONS.RECEIVABLES_READ), getPayments);
router.get('/summary', requirePermission(PERMISSIONS.RECEIVABLES_REPORT_READ), getSummary);

export default router;



