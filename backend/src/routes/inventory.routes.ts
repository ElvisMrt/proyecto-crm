import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStock,
  getMovements,
  createAdjustment,
  getLowStockAlerts,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);

// Categories
router.get('/categories', requirePermission(PERMISSIONS.INVENTORY_READ), getCategories);
router.post('/categories', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_CREATE), createCategory);
router.put('/categories/:id', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_UPDATE), updateCategory);
router.delete('/categories/:id', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_UPDATE), deleteCategory);

// Products
router.get('/products', requirePermission(PERMISSIONS.INVENTORY_READ), getProducts);
router.get('/products/:id', requirePermission(PERMISSIONS.INVENTORY_READ), getProduct);
router.post('/products', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_CREATE), createProduct);
router.put('/products/:id', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_UPDATE), updateProduct);
router.delete('/products/:id', requirePermission(PERMISSIONS.INVENTORY_PRODUCT_UPDATE), deleteProduct);

// Stock
router.get('/stock', requirePermission(PERMISSIONS.INVENTORY_STOCK_READ), getStock);

// Movements
router.get('/movements', requirePermission(PERMISSIONS.INVENTORY_MOVEMENT_READ), getMovements);

// Adjustments
router.post('/adjustments', requirePermission(PERMISSIONS.INVENTORY_ADJUST_CREATE), createAdjustment);

// Alerts
router.get('/alerts/low-stock', requirePermission(PERMISSIONS.INVENTORY_READ), getLowStockAlerts);

export default router;

