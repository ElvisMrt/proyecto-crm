import { Router } from 'express';
import { createPublicAppointment, getEmbedConfig } from '../controllers/appointments.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Solo requiere tenant middleware (sin autenticación)
router.use(tenantMiddleware);

// POST /api/public/appointments - Crear cita desde formulario público
router.post('/appointments', createPublicAppointment);

// GET /api/public/appointments/embed-config - Configuración para embed
router.get('/appointments/embed-config', getEmbedConfig);

export default router;
