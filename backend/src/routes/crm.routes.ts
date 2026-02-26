import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  getOverdueTasks,
  getClientHistory,
  getNotes,
  createNote,
  getCRMSummary,
  getReminders,
  getLateCollections,
} from '../controllers/crm.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);

// Tasks
router.get('/tasks', requirePermission(PERMISSIONS.CRM_READ), getTasks);
router.get('/tasks/overdue', requirePermission(PERMISSIONS.CRM_READ), getOverdueTasks);
router.get('/tasks/:id', requirePermission(PERMISSIONS.CRM_READ), getTask);
router.post('/tasks', requirePermission(PERMISSIONS.CRM_TASK_CREATE), createTask);
router.put('/tasks/:id', requirePermission(PERMISSIONS.CRM_TASK_UPDATE), updateTask);
router.patch('/tasks/:id/complete', requirePermission(PERMISSIONS.CRM_TASK_UPDATE), completeTask);
router.delete('/tasks/:id', requirePermission(PERMISSIONS.CRM_TASK_DELETE), deleteTask);

// Client History (360° View)
router.get('/clients/:clientId/history', requirePermission(PERMISSIONS.CRM_READ), getClientHistory);

// Notes
router.get('/clients/:clientId/notes', requirePermission(PERMISSIONS.CRM_READ), getNotes);
router.post('/notes', requirePermission(PERMISSIONS.CRM_TASK_CREATE), createNote);

// Summary and panels
router.get('/summary', requirePermission(PERMISSIONS.CRM_READ), getCRMSummary);
router.get('/reminders', requirePermission(PERMISSIONS.CRM_READ), getReminders);
router.get('/late-collections', requirePermission(PERMISSIONS.CRM_READ), getLateCollections);

export default router;

