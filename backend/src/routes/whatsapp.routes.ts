import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendMessage,
  getInstanceStatus,
  createInstance,
  getQRCode,
} from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Templates
router.get('/templates', requirePermission(PERMISSIONS.SETTINGS_READ), getTemplates);
router.get('/templates/:id', requirePermission(PERMISSIONS.SETTINGS_READ), getTemplate);
router.post('/templates', requirePermission(PERMISSIONS.SETTINGS_WRITE), createTemplate);
router.put('/templates/:id', requirePermission(PERMISSIONS.SETTINGS_WRITE), updateTemplate);
router.delete('/templates/:id', requirePermission(PERMISSIONS.SETTINGS_WRITE), deleteTemplate);

// Envío de mensajes
router.post('/send', requirePermission(PERMISSIONS.SALES_SEND), sendMessage);

// Gestión de instancia Evolution
router.get('/instance/status', requirePermission(PERMISSIONS.SETTINGS_READ), getInstanceStatus);
router.post('/instance/create', requirePermission(PERMISSIONS.SETTINGS_WRITE), createInstance);
router.get('/instance/qrcode', requirePermission(PERMISSIONS.SETTINGS_READ), getQRCode);

export default router;


