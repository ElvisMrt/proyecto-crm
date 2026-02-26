import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Login con detección de tenant (por header o subdominio)
router.post('/login', tenantMiddleware, login);

router.post('/logout', tenantMiddleware, authenticate, logout);
router.get('/me', tenantMiddleware, authenticate, me);

export default router;














