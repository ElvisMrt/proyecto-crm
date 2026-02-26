import { Router } from 'express';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createPublicAppointment,
  getEmbedConfig,
  getUnreadAppointments,
  markAppointmentAsViewed,
  markAppointmentAsNotified,
} from '../controllers/appointments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren tenant + autenticación
router.use(tenantMiddleware);
router.use(authenticate);

// CRUD de citas
router.get('/', getAppointments);
router.get('/:id', getAppointment);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

// Citas no leídas y marcado
router.get('/unread/count', getUnreadAppointments);
router.put('/:id/viewed', markAppointmentAsViewed);
router.put('/:id/notified', markAppointmentAsNotified);

export default router;
