import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

// Controladores de Proveedores
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersStats
} from '../controllers/supplier.controller';

// Controladores de Compras
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  receivePurchase,
  createInvoiceFromPurchase
} from '../controllers/purchase.controller';

import { generateInvoiceForPurchase } from '../controllers/purchase-invoice.controller';

// Controladores de Facturas de Proveedores
import {
  getSupplierInvoices,
  getSupplierInvoiceById,
  createSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  updateInvoiceStatus,
  getSupplierInvoicesStats
} from '../controllers/supplier-invoice.controller';

// Controladores de Pagos a Proveedores
import {
  getSupplierPayments,
  getSupplierPaymentById,
  createSupplierPayment,
  deleteSupplierPayment,
  getSupplierPaymentsStats
} from '../controllers/supplier-payment.controller';

const router = Router();

// Aplicar middlewares globales
router.use(tenantMiddleware);
router.use(authenticate);

// ============================================
// RUTAS DE PROVEEDORES
// ============================================
router.get('/suppliers/stats', getSuppliersStats);
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// ============================================
// RUTAS DE COMPRAS
// ============================================
router.get('/purchases', getPurchases);
router.get('/purchases/:id', getPurchaseById);
router.post('/purchases', createPurchase);
router.put('/purchases/:id', updatePurchase);
router.delete('/purchases/:id', deletePurchase);
router.post('/purchases/:id/receive', receivePurchase);
router.post('/purchases/:id/create-invoice', createInvoiceFromPurchase);
router.post('/purchases/:id/generate-invoice', generateInvoiceForPurchase);

// ============================================
// RUTAS DE FACTURAS DE PROVEEDORES
// ============================================
router.get('/supplier-invoices/stats', getSupplierInvoicesStats);
router.get('/supplier-invoices', getSupplierInvoices);
router.get('/supplier-invoices/:id', getSupplierInvoiceById);
router.post('/supplier-invoices', createSupplierInvoice);
router.put('/supplier-invoices/:id', updateSupplierInvoice);
router.delete('/supplier-invoices/:id', deleteSupplierInvoice);
router.patch('/supplier-invoices/:id/status', updateInvoiceStatus);

// ============================================
// RUTAS DE PAGOS A PROVEEDORES
// ============================================
router.get('/supplier-payments/stats', getSupplierPaymentsStats);
router.get('/supplier-payments', getSupplierPayments);
router.get('/supplier-payments/:id', getSupplierPaymentById);
router.post('/supplier-payments', createSupplierPayment);
router.delete('/supplier-payments/:id', deleteSupplierPayment);

export default router;
