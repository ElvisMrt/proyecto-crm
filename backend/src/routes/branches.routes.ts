import { Router } from 'express';
import { getBranches } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);
// Simple endpoint for other modules to use
router.get('/', getBranches);

export default router;



