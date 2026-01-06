import { Router } from 'express';
import {
  getNcfSequences,
  getNcfSequence,
  createNcfSequence,
  updateNcfSequence,
  deleteNcfSequence,
  getNcfStats,
} from '../controllers/ncf.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener estadísticas de NCF
router.get('/stats', requirePermission(PERMISSIONS.SETTINGS_READ), getNcfStats);

// Obtener todas las secuencias NCF
router.get('/', requirePermission(PERMISSIONS.SETTINGS_READ), getNcfSequences);

// Obtener una secuencia NCF por ID
router.get('/:id', requirePermission(PERMISSIONS.SETTINGS_READ), getNcfSequence);

// Crear nueva secuencia NCF
router.post('/', requirePermission(PERMISSIONS.SETTINGS_WRITE), createNcfSequence);

// Actualizar secuencia NCF
router.put('/:id', requirePermission(PERMISSIONS.SETTINGS_WRITE), updateNcfSequence);

// Eliminar/desactivar secuencia NCF
router.delete('/:id', requirePermission(PERMISSIONS.SETTINGS_WRITE), deleteNcfSequence);

export default router;


