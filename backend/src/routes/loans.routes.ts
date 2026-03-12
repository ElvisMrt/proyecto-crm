import { Router } from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  approveLoan,
  disburseLoan,
  rejectLoan,
  cancelLoan,
  getLoanPayments,
  createLoanPayment,
  reverseLoanPayment,
  sendLoanPaymentReceiptByEmail,
  sendLoanPaymentReceiptByWhatsApp,
  updateLoanPayment,
  processLoanPayment,
  getPaymentSchedule,
  getPortfolioReport,
  getAgingReport,
  getDelinquencyReport,
  getPerformanceReport,
} from '../controllers/loans.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticate);

router.get('/reports/portfolio', getPortfolioReport);
router.get('/reports/aging', getAgingReport);
router.get('/reports/delinquency', getDelinquencyReport);
router.get('/reports/performance', getPerformanceReport);

// Préstamos
router.get('/', getLoans);
router.get('/:id', getLoan);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);
router.post('/:id/approve', approveLoan);
router.post('/:id/disburse', disburseLoan);
router.post('/:id/reject', rejectLoan);
router.post('/:id/cancel', cancelLoan);

// Pagos
router.get('/:loanId/payments', getLoanPayments);
router.post('/:loanId/payments', createLoanPayment);
router.post('/:loanId/payments/:paymentId/reverse', reverseLoanPayment);
router.post('/:loanId/payments/:paymentId/send-email', sendLoanPaymentReceiptByEmail);
router.post('/:loanId/payments/:paymentId/send-whatsapp', sendLoanPaymentReceiptByWhatsApp);
router.put('/:loanId/payments/:paymentId', updateLoanPayment);
router.post('/:loanId/payments/:paymentId/pay', processLoanPayment);
router.get('/:loanId/payment-schedule', getPaymentSchedule);

export default router;
