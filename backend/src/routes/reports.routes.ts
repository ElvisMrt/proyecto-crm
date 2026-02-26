import { Router } from 'express';
import {
  getGeneralSummary,
  getDailyProfit,
  getSalesReport,
  getReceivablesReport,
  getCashReport,
  getInventoryReport,
  getSuppliersReport,
  getPurchasesReport,
  getPayablesReport,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.REPORTS_READ));

router.get('/summary', getGeneralSummary);
router.get('/daily-profit', getDailyProfit);
router.get('/sales', getSalesReport);
router.get('/receivables', getReceivablesReport);
router.get('/cash', getCashReport);
router.get('/inventory', getInventoryReport);
router.get('/suppliers', getSuppliersReport);
router.get('/purchases', getPurchasesReport);
router.get('/payables', getPayablesReport);

export default router;



