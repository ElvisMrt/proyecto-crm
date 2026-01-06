import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  duplicateInvoice,
  cancelInvoice,
  deleteInvoice,
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  convertQuoteToInvoice,
  createPOSSale,
  getCreditNotes,
  getCreditNote,
  createCreditNote,
  getCancelledInvoices,
  getCancelledInvoicesCount,
} from '../controllers/sales.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.middleware';

const router = Router();

router.use(authenticate);

// Facturas
router.get('/invoices', requirePermission(PERMISSIONS.SALES_READ), getInvoices);
router.get('/invoices/:id', requirePermission(PERMISSIONS.SALES_READ), getInvoice);
router.post('/invoices', requirePermission(PERMISSIONS.SALES_CREATE), createInvoice);
router.put('/invoices/:id', requirePermission(PERMISSIONS.SALES_CREATE), updateInvoice);
router.delete('/invoices/:id', requirePermission(PERMISSIONS.SALES_CREATE), deleteInvoice);
router.post('/invoices/:id/duplicate', requirePermission(PERMISSIONS.SALES_CREATE), duplicateInvoice);
router.post('/invoices/:id/cancel', requirePermission(PERMISSIONS.SALES_CANCEL), cancelInvoice);

// Cotizaciones
router.get('/quotes', requirePermission(PERMISSIONS.SALES_READ), getQuotes);
router.get('/quotes/:id', requirePermission(PERMISSIONS.SALES_READ), getQuote);
router.post('/quotes', requirePermission(PERMISSIONS.SALES_CREATE), createQuote);
router.put('/quotes/:id', requirePermission(PERMISSIONS.SALES_CREATE), updateQuote);
router.delete('/quotes/:id', requirePermission(PERMISSIONS.SALES_CREATE), deleteQuote);
router.post('/quotes/:id/convert', requirePermission(PERMISSIONS.SALES_CREATE), convertQuoteToInvoice);

// Punto de Venta (POS)
router.post('/pos', requirePermission(PERMISSIONS.SALES_POS), createPOSSale);

// Notas de Crédito
router.get('/credit-notes', requirePermission(PERMISSIONS.SALES_READ), getCreditNotes);
router.get('/credit-notes/:id', requirePermission(PERMISSIONS.SALES_READ), getCreditNote);
router.post('/credit-notes', requirePermission(PERMISSIONS.SALES_CREDIT_NOTE), createCreditNote);

// Historial / Anulados
router.get('/cancelled', requirePermission(PERMISSIONS.SALES_READ), getCancelledInvoices);
router.get('/cancelled/count', requirePermission(PERMISSIONS.SALES_READ), getCancelledInvoicesCount);

export default router;

