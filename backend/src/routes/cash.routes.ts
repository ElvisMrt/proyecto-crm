import { Router } from 'express';
import { openCash, getCurrentCash, getMovements, createMovement, closeCash, getHistory, getDailySummary } from '../controllers/cash.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

router.post('/open', requirePermission(PERMISSIONS.CASH_OPEN), openCash);
router.get('/current', requirePermission(PERMISSIONS.CASH_READ), getCurrentCash);
router.get('/movements', requirePermission(PERMISSIONS.CASH_READ), getMovements);
router.post('/movements', requirePermission(PERMISSIONS.CASH_MOVEMENT_CREATE), createMovement);
router.post('/close/:id', requirePermission(PERMISSIONS.CASH_CLOSE), closeCash);
router.get('/history', requirePermission(PERMISSIONS.CASH_HISTORY_READ), getHistory);
router.get('/daily-summary', requirePermission(PERMISSIONS.CASH_READ), getDailySummary);

export default router;

