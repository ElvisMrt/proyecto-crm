import { Router } from 'express';
import { getSummary, getSalesTrend, getRecentActivity } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(tenantMiddleware);  // Primero detectar tenant
router.use(authenticate);    // Luego autenticar con BD correcta
router.use(requirePermission(PERMISSIONS.DASHBOARD_READ));

router.get('/summary', getSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/recent-activity', getRecentActivity);

export default router;














