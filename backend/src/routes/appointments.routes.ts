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
router.get('/unread/count', getUnreadAppointments);
router.get('/notifications/unread', getUnreadAppointments);
router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

// Citas no leídas y marcado
router.put('/:id/viewed', markAppointmentAsViewed);
router.put('/:id/view', markAppointmentAsViewed);
router.put('/:id/notified', markAppointmentAsNotified);
router.put('/:id/notify', markAppointmentAsNotified);

export default router;
