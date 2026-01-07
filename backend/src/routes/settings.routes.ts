import { Router } from 'express';
import {
  getCompany,
  updateCompany,
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  getUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getRoles,
  getPermissions,
} from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.SETTINGS_READ));

// Company
router.get('/company', getCompany);
router.put('/company', requirePermission(PERMISSIONS.SETTINGS_UPDATE), updateCompany);

// Branches
router.get('/branches', getBranches);
router.get('/branches/:id', getBranch);
router.post('/branches', requirePermission(PERMISSIONS.SETTINGS_UPDATE), createBranch);
router.put('/branches/:id', requirePermission(PERMISSIONS.SETTINGS_UPDATE), updateBranch);
router.delete('/branches/:id', requirePermission(PERMISSIONS.SETTINGS_UPDATE), deleteBranch);

// Users
router.get('/users', requirePermission(PERMISSIONS.SETTINGS_USERS_READ), getUsers);
router.get('/users/:id', requirePermission(PERMISSIONS.SETTINGS_USERS_READ), getUser);
router.post('/users', requirePermission(PERMISSIONS.SETTINGS_USERS_CREATE), createUser);
router.put('/users/:id', requirePermission(PERMISSIONS.SETTINGS_USERS_UPDATE), updateUser);
router.patch('/users/:id/status', requirePermission(PERMISSIONS.SETTINGS_USERS_UPDATE), toggleUserStatus);
router.delete('/users/:id', requirePermission(PERMISSIONS.SETTINGS_USERS_DELETE), deleteUser);

// Roles & Permissions
router.get('/roles', getRoles);
router.get('/permissions', getPermissions);

export default router;



