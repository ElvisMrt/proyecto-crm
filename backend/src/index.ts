import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Localhost dev
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      // IP directa VPS
      'http://66.94.111.139',
      // Dominio raíz y www
      'http://neypier.com',
      'https://neypier.com',
      'http://www.neypier.com',
      'https://www.neypier.com',
      // Wildcard subdominios localhost
      /https?:\/\/.*\.localhost(:\d+)?$/,
      // Wildcard nip.io (acceso por IP)
      /https?:\/\/.*\.nip\.io(:\d+)?$/,
      // Wildcard neypier.com (todos los tenants + admin)
      /https?:\/\/[^.]+\.neypier\.com(:\d+)?$/,
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Carpeta de uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import salesRoutes from './routes/sales.routes';
import receivablesRoutes from './routes/receivables.routes';
import cashRoutes from './routes/cash.routes';
import inventoryRoutes from './routes/inventory.routes';
import clientsRoutes from './routes/clients.routes';
import crmRoutes from './routes/crm.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';
import branchesRoutes from './routes/branches.routes';
import ncfRoutes from './routes/ncf.routes';
import appointmentsRoutes from './routes/appointments.routes';
import publicRoutes from './routes/public.routes';
import saasRoutes from './routes/saas.routes';
import supplierRoutes from './routes/supplier.routes';
import { sendWebsiteContact, sendWebsiteQuote } from './services/email.service';
// WhatsApp module disabled
// import whatsappRoutes from './routes/whatsapp.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/receivables', receivablesRoutes);
app.use('/api/v1/cash', cashRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/ncf', ncfRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1', supplierRoutes);

// Upload imagen para productos del website (solo SaaS admin)
import { saasAdminMiddleware } from './middleware/tenant.middleware';
app.post('/api/v1/saas/upload-image', saasAdminMiddleware, upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió imagen' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al subir imagen' });
  }
});
// WhatsApp routes disabled
// app.use('/api/v1/whatsapp', whatsappRoutes);

// Endpoint público: listar productos del website
app.get('/api/website/products', async (req, res) => {
  try {
    const { PrismaClient: MasterPrisma } = await import('@prisma/client');
    const mp = new MasterPrisma({ datasources: { db: { url: process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL } } });
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category && category !== 'all') where.category = category;
    const products = await mp.websiteProduct.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    await mp.$disconnect();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('[Website Products] Error:', error);
    res.status(500).json({ success: false, message: 'Error al cargar productos' });
  }
});

// Endpoints públicos del website Neypier (sin tenant middleware)
app.post('/api/website/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Nombre, email y mensaje son requeridos' });
    }
    await sendWebsiteContact({ name, email, phone, subject, message });
    res.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('[Website Contact] Error:', error);
    res.status(500).json({ success: false, message: 'Error al enviar el mensaje. Intenta de nuevo.' });
  }
});

app.post('/api/website/quote', async (req, res) => {
  try {
    const { name, email, phone, notes, products, total } = req.body;
    if (!name || !products || !products.length) {
      return res.status(400).json({ success: false, message: 'Nombre y productos son requeridos' });
    }
    await sendWebsiteQuote({ name, email, phone, notes, products, total });
    res.json({ success: true, message: 'Cotización enviada correctamente' });
  } catch (error) {
    console.error('[Website Quote] Error:', error);
    res.status(500).json({ success: false, message: 'Error al enviar la cotización. Intenta de nuevo.' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

