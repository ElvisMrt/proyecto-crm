# 📋 DOCUMENTACIÓN COMPLETA - PROYECTO CRM

## 🤖 **GUÍA PARA AGENTES IA - CONTEXTO COMPLETO**

### **🎯 Propósito Principal del Proyecto**
Sistema **CRM (Customer Relationship Management)** multi-tenant para **gestión de negocios pequeños/medianos** con:
- **Gestión de ventas** y facturación
- **Control de inventario** 
- **Caja registradora** con movimientos
- **Gestión de proveedores** y compras
- **Multi-sucursal** (tenant por sucursal)
- **Autenticación** por roles y permisos

### **🏢 Contexto del Negocio**
- **Target**: PyMEs (Pequeñas y Medianas Empresas)
- **Industrias**: Retail, servicios, distribución
- **Problema resuelto**: Centralizar operaciones en un solo sistema
- **Valor**: Automatización, control, reportes en tiempo real

---

## 🏗️ **ARQUITECTURA TÉCNICA DETALLADA**

### **Stack Tecnológico Completo**
```
Backend:
├── Node.js 18 + TypeScript
├── Express.js (REST API)
├── Prisma ORM (PostgreSQL)
├── JWT (autenticación)
├── Zod (validación)
├── Nodemailer (email)
└── Docker (contenerización)

Frontend:
├── React 18 + TypeScript
├── Vite (build tool)
├── TailwindCSS (estilos)
├── React Router (navegación)
├── React Hook Form (formularios)
├── React Query (estado servidor)
└── Lucide React (iconos)

Infraestructura:
├── PostgreSQL 15 (base de datos)
├── Docker Compose (orquestación)
├── Nginx (frontend serving)
└── VPS (producción)
```

### **Patrones de Diseño Implementados**
```typescript
// 1. Repository Pattern (con Prisma)
class ClientRepository {
  async findMany(filters: ClientFilters): Promise<Client[]> {
    return prisma.client.findMany({ where: filters });
  }
}

// 2. Service Layer
class ClientService {
  constructor(private repo: ClientRepository) {}
  
  async createClient(data: CreateClientDto): Promise<Client> {
    // Lógica de negocio aquí
    return this.repo.create(data);
  }
}

// 3. Controller Pattern
export class ClientController {
  constructor(private service: ClientService) {}
  
  async create(req: Request, res: Response): Promise<void> {
    const client = await this.service.createClient(req.body);
    res.status(201).json(client);
  }
}

// 4. Middleware Chain
app.use('/api/v1/clients', 
  authenticateToken,      // 1. Verificar JWT
  tenantMiddleware,       // 2. Setear Prisma tenant
  roleMiddleware('SALES'), // 3. Verificar permisos
  clientController.create  // 4. Ejecutar lógica
);
```

---

## 🗄️ **BASE DE DATOS - MODELO DE DOMINIO COMPLETO**

### **Relaciones Clave**
```mermaid
erDiagram
    User ||--o{ Branch : belongs_to
    Branch ||--o{ Client : has
    Branch ||--o{ CashRegister : manages
    Branch ||--o{ Invoice : issues
    Branch ||--o{ Product : stocks
    
    Client ||--o{ Invoice : receives
    Invoice ||--o{ InvoiceItem : contains
    Product ||--o{ InvoiceItem : billed_as
    
    Supplier ||--o{ Purchase : provides
    Purchase ||--o{ PurchaseItem : contains
    Product ||--o{ PurchaseItem : bought_as
    
    CashRegister ||--o{ CashMovement : tracks
    User ||--o{ CashMovement : creates
    
    Invoice ||--o{ Payment : receives
    SupplierInvoice ||--o{ SupplierPayment : receives
```

### **Enums y Estados del Sistema**
```typescript
// Estados de Factura
enum InvoiceStatus {
  DRAFT = 'DRAFT',           // Borrador
  PENDING = 'PENDING',       // Emitida, pendiente pago
  PARTIAL = 'PARTIAL',       // Pago parcial
  PAID = 'PAID',            // Pagada completamente
  OVERDUE = 'OVERDUE',       // Vencida
  CANCELLED = 'CANCELLED'    // Cancelada
}

// Estados de Caja
enum CashStatus {
  OPEN = 'OPEN',             // Abierta
  CLOSED = 'CLOSED'          // Cerrada
}

// Tipos de Movimiento de Caja
enum MovementType {
  OPENING = 'OPENING',           // Apertura
  SALE = 'SALE',                 // Venta
  PAYMENT = 'PAYMENT',           // Pago de factura
  MANUAL_ENTRY = 'MANUAL_ENTRY', // Entrada manual
  MANUAL_EXIT = 'MANUAL_EXIT',   // Salida manual
  CLOSING = 'CLOSING'            // Cierre
}

// Roles de Usuario
enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR', // Acceso total
  MANAGER = 'MANAGER',            // Gestión completa
  CASHIER = 'CASHIER',            // Ventas y caja
  SALES = 'SALES',                // Solo ventas
  VIEWER = 'VIEWER'               // Solo lectura
}

// Métodos de Pago
enum PaymentMethod {
  CASH = 'CASH',         // Efectivo
  TRANSFER = 'TRANSFER', // Transferencia
  CARD = 'CARD',         // Tarjeta
  CREDIT = 'CREDIT',     // Crédito
  MIXED = 'MIXED'        // Mixto
}
```

---

## 🔐 **SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN**

### **Flujo de Autenticación Completo**
```typescript
// 1. Login Request
POST /api/v1/auth/login
{
  "email": "user@empresa.com",
  "password": "password123"
}

// 2. Login Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@empresa.com",
    "name": "Juan Pérez",
    "role": "SALES",
    "branchId": "branch_456"
  }
}

// 3. Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  branchId?: string;
  iat: number;    // Issued at
  exp: number;    // Expiration (7 días)
}

// 4. Middleware Chain
app.use('/api/v1', [
  corsMiddleware,           // CORS
  helmetMiddleware,        // Security headers
  requestLogger,           // Logging
  rateLimitMiddleware,      // Rate limiting
  authenticateToken,       // JWT verification
  tenantMiddleware,        // Multi-tenant setup
  errorHandler            // Error handling
]);
```

### **Matriz de Permisos por Rol**
```typescript
const ROLE_PERMISSIONS = {
  ADMINISTRATOR: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'branches:create', 'branches:read', 'branches:update', 'branches:delete',
    'clients:create', 'clients:read', 'clients:update', 'clients:delete',
    'products:create', 'products:read', 'products:update', 'products:delete',
    'sales:create', 'sales:read', 'sales:update', 'sales:delete',
    'cash:open', 'cash:close', 'cash:read', 'cash:movements',
    'suppliers:create', 'suppliers:read', 'suppliers:update', 'suppliers:delete',
    'purchases:create', 'purchases:read', 'purchases:update', 'purchases:delete',
    'reports:read', 'system:config'
  ],
  MANAGER: [
    'clients:create', 'clients:read', 'clients:update',
    'products:create', 'products:read', 'products:update',
    'sales:create', 'sales:read', 'sales:update',
    'cash:open', 'cash:close', 'cash:read', 'cash:movements',
    'suppliers:create', 'suppliers:read', 'suppliers:update',
    'purchases:create', 'purchases:read', 'purchases:update',
    'reports:read'
  ],
  CASHIER: [
    'clients:read', 'clients:create',
    'products:read',
    'sales:create', 'sales:read',
    'cash:read', 'cash:movements',
    'reports:read_basic'
  ],
  SALES: [
    'clients:read', 'clients:create',
    'products:read',
    'sales:create', 'sales:read',
    'reports:read_basic'
  ],
  VIEWER: [
    'clients:read',
    'products:read',
    'sales:read',
    'cash:read',
    'reports:read_basic'
  ]
};
```

---

## 🔄 **FLUJOS DE NEGOCIO DETALLADOS**

### **1. Flujo de Venta Completo**
```typescript
// Paso 1: Verificar caja abierta
const currentCash = await cashService.getCurrentCash(user.branchId);
if (!currentCash) {
  throw new Error('Debe abrir caja antes de vender');
}

// Paso 2: Validar stock
for (const item of saleItems) {
  const stock = await inventoryService.getStock(item.productId, user.branchId);
  if (stock.quantity < item.quantity) {
    throw new Error(`Stock insuficiente para ${item.productName}`);
  }
}

// Paso 3: Calcular totales
const calculation = {
  subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  tax: subtotal * TAX_RATE,
  discount: applyDiscountRules(subtotal, client),
  total: subtotal + tax - discount
};

// Paso 4: Crear factura
const invoice = await invoiceService.create({
  clientId: client.id,
  branchId: user.branchId,
  userId: user.id,
  items: saleItems,
  ...calculation,
  status: InvoiceStatus.PENDING
});

// Paso 5: Registrar pago en caja
await cashService.createMovement({
  cashRegisterId: currentCash.id,
  type: MovementType.SALE,
  amount: calculation.total,
  method: paymentMethod,
  invoiceId: invoice.id
});

// Paso 6: Actualizar inventario
for (const item of saleItems) {
  await inventoryService.decreaseStock(item.productId, user.branchId, item.quantity);
}

// Paso 7: Enviar confirmación (async)
await emailService.sendInvoiceConfirmation(client.email, invoice);
```

### **2. Flujo de Caja Diario**
```typescript
// Apertura de Caja
const openingData = {
  branchId: user.branchId,
  initialAmount: 1000.00,  // Monto inicial físico
  openedBy: user.id,
  observations: "Caja mañana"
};

const cashRegister = await cashService.openCash(openingData);

// Durante el día - Movimientos automáticos
await cashService.createMovement({
  cashRegisterId: cashRegister.id,
  type: MovementType.SALE,
  amount: 250.00,
  method: PaymentMethod.CASH,
  invoiceId: "inv_123"
});

// Cierre de Caja
const closingData = {
  cashRegisterId: cashRegister.id,
  countedAmount: 3450.00,  // Monto contado físicamente
  closedBy: user.id
};

const closingResult = await cashService.closeCash(closingData);
// Resultado: { expected: 3500, counted: 3450, difference: -50 }
```

### **3. Flujo de Compras y Proveedores**
```typescript
// 1. Crear Orden de Compra
const purchase = await purchaseService.create({
  supplierId: "supplier_123",
  branchId: user.branchId,
  items: [
    { productId: "prod_1", quantity: 10, unitPrice: 50.00 },
    { productId: "prod_2", quantity: 5, unitPrice: 25.00 }
  ],
  expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// 2. Recibir mercancía
const receipt = await purchaseService.receive(purchase.id, {
  receivedItems: [
    { productId: "prod_1", quantity: 10, quality: 'OK' },
    { productId: "prod_2", quantity: 4, quality: 'DAMAGED' } // 1 dañado
  ],
  observations: "1 unidad dañada, se hará nota de crédito"
});

// 3. Generar factura de proveedor
const supplierInvoice = await supplierInvoiceService.create({
  purchaseId: purchase.id,
  invoiceDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  total: 625.00
});

// 4. Pagar factura (parcial o total)
await supplierPaymentService.create({
  supplierInvoiceId: supplierInvoice.id,
  amount: 300.00, // Pago parcial
  paymentMethod: PaymentMethod.TRANSFER,
  observations: "Pago parcial, resto en 15 días"
});
```

---

## 🎨 **FRONTEND - ARQUITECTURA DE COMPONENTES**

### **Estructura de Estado Global**
```typescript
// 1. Auth Context - Gestión de autenticación
const AuthContext = createContext<{
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshToken: () => Promise<void>;
}>({});

// 2. App Context - Estado global de la aplicación
const AppContext = createContext<{
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>({});

// 3. Data Fetching con React Query
const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// 4. Mutations con React Query
const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientData: CreateClientDto) => 
      api.post('/clients', clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccessToast('Cliente creado exitosamente');
    }
  });
};
```

### **Patrones de Componentes**
```typescript
// 1. Componentes de Formularios Reutilizables
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
  error?: string;
  register: UseFormRegisterReturn;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error,
  register
}) => (
  <div className="form-group">
    <label htmlFor={name} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      placeholder={placeholder}
      className={`form-input ${error ? 'border-red-500' : ''}`}
      {...register}
    />
    {error && <span className="form-error">{error}</span>}
  </div>
);

// 2. Componentes de Datos (Tables)
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

const DataTable = <T,>({ data, columns, loading, onRowClick, actions }: DataTableProps<T>) => {
  if (loading) return <DataTableSkeleton />;
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {column.title}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr 
              key={index} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 3. Layout Components
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentBranch, notifications } = useApp();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} notifications={notifications} />
      <div className="flex">
        <Sidebar userRole={user?.role} />
        <main className="flex-1 p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
};
```

---

## 🚨 **SISTEMA DE ERRORES Y LOGGING**

### **Jerarquía de Errores**
```typescript
// 1. Error Base Personalizado
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public readonly context?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// 2. Errores Específicos
class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
}

class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;
}

class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly isOperational = true;
}

class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';
  readonly isOperational = false;
}

// 3. Error Handler Global
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    userId: (req as AuthRequest).user?.id,
    path: req.path,
    method: req.method,
    body: req.body,
    context: (error as AppError).context
  };
  
  logger.error('Request error', logEntry);
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          context: error.context 
        })
      }
    });
  }
  
  // Errores inesperados
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
};
```

### **Sistema de Logging Completo**
```typescript
// Estructura de Log Entry
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  module: string;
  userId?: string;
  branchId?: string;
  action?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  duration?: number; // Para performance logging
}

// Logger Service
class LoggerService {
  private context: Partial<LogEntry> = {};
  
  setContext(context: Partial<LogEntry>) {
    this.context = { ...this.context, ...context };
  }
  
  private createLogEntry(level: LogEntry['level'], message: string, metadata?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      module: this.getCallingModule(),
      ...this.context,
      metadata,
      ...(metadata?.duration && { duration: metadata.duration })
    };
  }
  
  error(message: string, metadata?: any) {
    const entry = this.createLogEntry('error', message, metadata);
    console.error(JSON.stringify(entry));
    // Enviar a servicio externo (Sentry, LogRocket, etc.)
  }
  
  info(message: string, metadata?: any) {
    const entry = this.createLogEntry('info', message, metadata);
    console.log(JSON.stringify(entry));
  }
  
  // Performance logging
  time(label: string) {
    return {
      end: (metadata?: any) => {
        const duration = performance.now();
        this.info(`${label} completed`, { ...metadata, duration });
      }
    };
  }
}

// Middleware de Request Logging
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  logger.setContext({
    requestId,
    userId: (req as AuthRequest).user?.id,
    branchId: (req as AuthRequest).user?.branchId,
    path: req.path,
    method: req.method
  });
  
  logger.info('Request started', {
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
};
```

---

## 🔧 **CONFIGURACIÓN Y DEPLOY**

### **Variables de Entorno Críticas**
```bash
# === BASES DE DATOS ===
DATABASE_URL="postgresql://user:password@localhost:5432/crm"
DATABASE_POOL_SIZE="10"
DATABASE_TIMEOUT="30s"

# === AUTENTICACIÓN ===
JWT_SECRET="super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
BCRYPT_ROUNDS="12"

# === APLICACIÓN ===
NODE_ENV="production"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="https://tuempresa.com"

# === EMAIL ===
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="tu-email@empresa.com"
EMAIL_PASS="app-password-generado"
EMAIL_FROM="CRM Sistema <noreply@tuempresa.com>"

# === ARCHIVOS ===
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10MB"
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf,doc,docx,xls,xlsx"

# === LOGGING ===
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
LOG_MAX_SIZE="10MB"
LOG_MAX_FILES="5"

# === MONITOREO ===
SENTRY_DSN="https://tu-sentry-dsn"
HEALTH_CHECK_INTERVAL="30s"

# === MULTI-TENANT ===
DEFAULT_TENANT_DB="postgresql://user:pass@localhost:5432/crm"
TENANT_DB_PREFIX="crm_tenant_"
```

### **Docker - Configuración Producción**
```dockerfile
# Backend Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar y compilar
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copiar desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/backups /app/logs
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### **Deploy en VPS - Script Completo**
```bash
#!/bin/bash
# deploy.sh - Script de despliegue automático

set -e

echo "🚀 Iniciando deploy del CRM..."

# Variables
REPO_URL="https://github.com/tuuser/proyecto-crm.git"
DEPLOY_DIR="/var/www/crm"
BACKUP_DIR="/var/backups/crm"
SERVICE_NAME="crm"

# 1. Backup actual
echo "📦 Creando backup..."
sudo mkdir -p $BACKUP_DIR
sudo tar -czf "$BACKUP_DIR/crm-$(date +%Y%m%d-%H%M%S).tar.gz" $DEPLOY_DIR

# 2. Pull latest code
echo "📥 Descargando código..."
cd $DEPLOY_DIR
sudo git pull origin main

# 3. Build y deploy
echo "🔨 Construyendo imágenes..."
sudo docker-compose -f docker-compose.prod.yml down
sudo docker-compose -f docker-compose.prod.yml build --no-cache
sudo docker-compose -f docker-compose.prod.yml up -d

# 4. Esperar servicios
echo "⏳ Esperando servicios..."
sleep 30

# 5. Health checks
echo "🏥 Verificando salud..."
if curl -f http://localhost:3001/health; then
    echo "✅ Backend saludable"
else
    echo "❌ Backend no responde"
    exit 1
fi

if curl -f http://localhost:80; then
    echo "✅ Frontend saludable"
else
    echo "❌ Frontend no responde"
    exit 1
fi

# 6. Cleanup
echo "🧹 Limpieza..."
sudo docker system prune -f

echo "🎉 Deploy completado exitosamente!"
```

---

## 📊 **MÉTRICAS Y MONITOREO**

### **KPIs del Sistema**
```typescript
// Métricas de Negocio
interface BusinessMetrics {
  sales: {
    daily: number;
    weekly: number;
    monthly: number;
    growth: number; // % crecimiento
  };
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
    retention: number; // % retención
  };
  inventory: {
    totalValue: number;
    lowStockItems: number;
    turnoverRate: number;
    deadStock: number; // % stock muerto
  };
  cash: {
    dailyRevenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
}

// Métricas Técnicas
interface TechnicalMetrics {
  performance: {
    responseTime: number; // ms avg
    throughput: number;  // req/s
    errorRate: number;  // %
    uptime: number;     // %
  };
  database: {
    connectionPool: number;
    queryTime: number;  // ms avg
    slowQueries: number;
    indexUsage: number; // %
  };
  users: {
    activeUsers: number;
    concurrentUsers: number;
    sessionDuration: number; // min avg
    bounceRate: number;     // %
  };
}
```

### **Alertas y Notificaciones**
```typescript
// Sistema de Alertas
class AlertService {
  // 1. Umbral de ventas bajo
  async checkSalesThreshold() {
    const todaySales = await this.getTodaySales();
    const threshold = await this.getDailyTarget();
    
    if (todaySales < threshold * 0.5) {
      await this.sendAlert({
        type: 'SALES_LOW',
        severity: 'WARNING',
        message: `Ventas de hoy (${todaySales}) por debajo del 50% del objetivo (${threshold})`,
        recipients: ['manager@empresa.com']
      });
    }
  }
  
  // 2. Stock crítico
  async checkCriticalStock() {
    const criticalItems = await this.getCriticalStockItems();
    
    if (criticalItems.length > 0) {
      await this.sendAlert({
        type: 'CRITICAL_STOCK',
        severity: 'ERROR',
        message: `${criticalItems.length} productos con stock crítico`,
        recipients: ['inventory@empresa.com'],
        metadata: { items: criticalItems }
      });
    }
  }
  
  // 3. Caja sin cerrar
  async checkUnclosedCashRegisters() {
    const openRegisters = await this.getOpenCashRegisters();
    
    if (openRegisters.length > 0) {
      await this.sendAlert({
        type: 'CASH_UNCLOSED',
        severity: 'WARNING',
        message: `${openRegisters.length} cajas sin cerrar`,
        recipients: ['admin@empresa.com']
      });
    }
  }
}
```

---

## 🧪 **TESTING Y QA**

### **Estrategia de Testing**
```typescript
// 1. Unit Tests (Jest)
describe('ClientService', () => {
  let service: ClientService;
  let mockRepository: jest.Mocked<ClientRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new ClientService(mockRepository);
  });
  
  it('should create client with valid data', async () => {
    const clientData = {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '8091234567'
    };
    
    mockRepository.create.mockResolvedValue({ id: '1', ...clientData });
    
    const result = await service.createClient(clientData);
    
    expect(result).toEqual({ id: '1', ...clientData });
    expect(mockRepository.create).toHaveBeenCalledWith(clientData);
  });
});

// 2. Integration Tests (Supertest)
describe('Client API', () => {
  it('POST /clients should create client', async () => {
    const response = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .expect(201);
      
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Client');
  });
});

// 3. E2E Tests (Playwright)
test('complete sales flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@test.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // Open cash register
  await page.click('[data-testid="cash-register-menu"]');
  await page.fill('[data-testid="initial-amount"]', '1000');
  await page.click('[data-testid="open-cash-button"]');
  
  // Create sale
  await page.click('[data-testid="new-sale-button"]');
  await page.fill('[data-testid="client-search"]', 'Test Client');
  await page.click('[data-testid="add-product-button"]');
  await page.fill('[data-testid="quantity"]', '2');
  await page.click('[data-testid="complete-sale-button"]');
  
  // Verify sale created
  await expect(page.locator('[data-testid="sale-success"]')).toBeVisible();
});
```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run frontend tests
        run: cd frontend && npm run test
      
      - name: Build applications
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build
  
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: |
          cd backend && npm audit --audit-level high
          cd ../frontend && npm audit --audit-level high
  
  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/crm
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 📱 **ARQUITECTURA MICROSERVICIOS (FUTURO)**

### **Descomposición Propuesta**
```typescript
// 1. Auth Service
interface AuthService {
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;
  validateToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
}

// 2. Client Service  
interface ClientService {
  createClient(data: CreateClientDto): Promise<Client>;
  getClient(id: string): Promise<Client>;
  updateClient(id: string, data: UpdateClientDto): Promise<Client>;
  searchClients(query: SearchQuery): Promise<Client[]>;
}

// 3. Product Service
interface ProductService {
  createProduct(data: CreateProductDto): Promise<Product>;
  updateStock(productId: string, delta: number): Promise<Product>;
  checkAvailability(productId: string, quantity: number): Promise<boolean>;
}

// 4. Sales Service
interface SalesService {
  createSale(data: CreateSaleDto): Promise<Sale>;
  processPayment(saleId: string, payment: PaymentData): Promise<Payment>;
  getSalesHistory(filters: SalesFilters): Promise<Sale[]>;
}

// 5. Inventory Service
interface InventoryService {
  trackMovement(movement: StockMovement): Promise<void>;
  getLowStockAlerts(): Promise<StockAlert[]>;
  calculateInventoryValue(): Promise<InventoryValuation>;
}

// 6. Notification Service
interface NotificationService {
  sendEmail(to: string, template: string, data: any): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
  sendPush(userId: string, notification: PushNotification): Promise<void>;
}
```

---

## 🎯 **REGLAS DE NEGOCIO CRÍTICAS**

### **Validaciones Esenciales**
```typescript
// 1. Reglas de Stock
class StockValidationRules {
  static canSell(productId: string, quantity: number, branchId: string): Promise<boolean> {
    // No vender si no hay stock
    // No vender productos inactivos
    // Validar stock mínimo reservado
  }
  
  static canPurchase(productId: string, quantity: number): Promise<boolean> {
    // Validar proveedor activo
    // Validar capacidad de almacenamiento
    // Validar presupuesto disponible
  }
}

// 2. Reglas de Precios
class PricingRules {
  static calculatePrice(productId: string, quantity: number, clientId: string): Promise<PriceCalculation> {
    // Aplicar descuentos por volumen
    // Aplicar descuentos por cliente
    // Validar precios mínimos
    // Calcular impuestos según ubicación
  }
}

// 3. Reglas de Crédito
class CreditRules {
  static canExtendCredit(clientId: string, amount: number): Promise<boolean> {
    // Validar límite de crédito
    // Validar historial de pagos
    // Validar saldo vencido
    // Validar antigüedad del cliente
  }
}

// 4. Reglas de Caja
class CashRules {
  static canOpenCash(branchId: string): Promise<boolean> {
    // Solo una caja abierta por sucursal
    // Validar usuario autorizado
    // Validar caja anterior cerrada
  }
  
  static canCloseCash(cashRegisterId: string, countedAmount: number): Promise<boolean> {
    // Validar diferencia máxima permitida
    // Validar autorización para diferencias grandes
    // Validar todos los movimientos registrados
  }
}
```

---

## 🚀 **PERFORMANCE Y OPTIMIZACIÓN**

### **Estrategias de Optimización**
```typescript
// 1. Database Optimization
class DatabaseOptimizer {
  // Índices estratégicos
  static indexes = [
    'CREATE INDEX idx_clients_branch_active ON clients(branchId, isActive)',
    'CREATE INDEX idx_invoices_status_date ON invoices(status, issueDate)',
    'CREATE INDEX idx_cash_movements_register_date ON cashMovements(cashRegisterId, movementDate)',
    'CREATE INDEX idx_products_active_category ON products(isActive, category)'
  ];
  
  // Query optimization
  static optimizedQueries = {
    // Usar selectores específicos en lugar de *
    getActiveClients: 'SELECT id, name, email FROM clients WHERE isActive = true',
    
    // Paginación eficiente
    getInvoices: 'SELECT * FROM invoices WHERE status = $1 ORDER BY issueDate DESC LIMIT $2 OFFSET $3',
    
    // Agregaciones pre-calculadas
    getDailySales: 'SELECT DATE(issueDate) as date, COUNT(*) as count, SUM(total) as total FROM invoices WHERE DATE(issueDate) = CURRENT_DATE GROUP BY DATE(issueDate)'
  };
}

// 2. Caching Strategy
class CacheService {
  // Redis cache keys
  static keys = {
    userSession: (userId: string) => `session:${userId}`,
    activeClients: (branchId: string) => `clients:active:${branchId}`,
    productPrices: (productId: string) => `product:price:${productId}`,
    dailyMetrics: (date: string, branchId: string) => `metrics:${date}:${branchId}`
  };
  
  // TTL configurations
  static ttl = {
    userSession: 7 * 24 * 60 * 60, // 7 días
    activeClients: 5 * 60,          // 5 minutos
    productPrices: 60 * 60,         // 1 hora
    dailyMetrics: 24 * 60 * 60      // 24 horas
  };
}

// 3. API Performance
class APIOptimizer {
  // Response compression
  static compressionMiddleware = compression({
    level: 6,
    threshold: 1024
  });
  
  // Rate limiting
  static rateLimiters = {
    auth: rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),     // 5 intentos en 15 min
    api: rateLimit({ windowMs: 60 * 1000, max: 100 }),          // 100 req/min
    upload: rateLimit({ windowMs: 60 * 1000, max: 10 })         // 10 uploads/min
  };
  
  // Pagination optimization
  static optimizedPagination = {
    defaultLimit: 20,
    maxLimit: 100,
    cursorBased: true // Para datasets grandes
  };
}
```

---

## 📚 **CONTEXTO PARA AGENTES IA - RESUMEN EJECUTIVO**

### **🎯 Misión del Proyecto**
Crear un **sistema CRM integral** para PyMEs que centralice:
- **Gestión de clientes** y relaciones comerciales
- **Procesos de venta** desde cotización hasta cobro
- **Control de inventario** en tiempo real
- **Gestión financiera** (caja, cuentas por cobrar/pagar)
- **Reportes y analíticas** para toma de decisiones

### **🏗️ Arquitectura Clave**
- **Backend**: Node.js + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + TailwindCSS
- **Despliegue**: Docker + VPS + Nginx
- **Autenticación**: JWT + Multi-tenant por sucursal
- **Base de Datos**: Relacional con relaciones complejas

### **🔄 Flujo Principal**
1. **Usuario inicia sesión** → JWT token + tenant setup
2. **Opera en su sucursal** → Datos aislados por branchId
3. **Realiza operaciones** → Ventas, compras, gestión de caja
4. **Sistema valida** → Reglas de negocio, stock, crédito
5. **Registra transacciones** → Auditoría completa
6. **Genera reportes** → KPIs y analíticas en tiempo real

### **🚨 Problemas Actuales**
- **Errores TypeScript** en controllers (types implícitos)
- **Build Docker** fallando por errores de compilación
- **Testing** incompleto
- **Documentación API** pendiente

### **🎯 Próximos Pasos Críticos**
1. **Corregir errores TypeScript** para compilar exitosamente
2. **Completar build Docker** y desplegar en VPS
3. **Implementar testing** unitario e integración
4. **Configurar monitoreo** y alertas
5. **Documentar API** para frontend y terceros

### **🔑 Conceptos Fundamentales**
- **Multi-tenant**: Cada sucursal es un "tenant" aislado
- **Role-based access**: Permisos granulares por rol
- **Event-driven**: Movimientos generan eventos y notificaciones
- **Audit trail**: Todas las operaciones son registradas
- **Real-time**: Stock, caja y ventas en tiempo real
- **Business rules**: Validaciones complejas (stock, crédito, precios)

---

**ESTADO ACTUAL**: En desarrollo - Pre-producción  
**PRIORIDAD**: Corregir errores de compilación TypeScript  
**OBJETIVO**: Deploy funcional en VPS dentro de 48 horas

---

## 🐳 **CONFIGURACIÓN DOCKER**

### **docker-compose.prod.yml**
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/crm
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=crm
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 🗄️ **BASE DE DATOS (PRISMA)**

### **Modelos Principales**
```prisma
// Usuarios y Autenticación
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(USER)
  branchId  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Sucursales (Multi-tenant)
model Branch {
  id          String   @id @default(cuid())
  name        String
  address     String?
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Clientes
model Client {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  email       String?
  phone       String?
  address     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Productos
model Product {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  price       Decimal
  cost        Decimal?
  category    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Facturas de Ventas
model Invoice {
  id          String       @id @default(cuid())
  code        String       @unique
  clientId    String
  branchId    String
  userId      String
  issueDate   DateTime     @default(now())
  dueDate     DateTime?
  status      InvoiceStatus @default(PENDING)
  subtotal    Decimal
  tax         Decimal      @default(0)
  discount    Decimal      @default(0)
  total       Decimal
  paid        Decimal      @default(0)
  balance     Decimal
  notes       String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

// Caja Registradora
model CashRegister {
  id            String     @id @default(cuid())
  branchId      String
  status        CashStatus @default(CLOSED)
  initialAmount Decimal
  finalAmount   Decimal?
  difference    Decimal?
  openedBy      String?
  closedBy      String?
  openedAt      DateTime?
  closedAt      DateTime?
  observations  String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

// Movimientos de Caja
model CashMovement {
  id             String        @id @default(cuid())
  cashRegisterId String
  type           MovementType
  concept        String
  amount         Decimal
  method         PaymentMethod
  userId         String?
  observations   String?
  movementDate   DateTime      @default(now())
  createdAt      DateTime      @default(now())
}
```

---

## 🔐 **AUTENTICACIÓN Y SEGURIDAD**

### **Middleware de Autenticación**
```typescript
// auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    branchId?: string;
  };
  tenantPrisma?: PrismaClient;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user as any;
    next();
  });
};
```

### **Middleware Multi-tenant**
```typescript
// tenant.middleware.ts
export const getTenantPrisma = (databaseUrl: string): PrismaClient => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

export const tenantMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user) {
    const tenantDbUrl = process.env.DATABASE_URL; // En producción, sería por sucursal
    req.tenantPrisma = getTenantPrisma(tenantDbUrl);
  }
  next();
};
```

---

## 🚀 **API REST ENDPOINTS**

### **Autenticación**
```
POST   /api/v1/auth/login          # Iniciar sesión
POST   /api/v1/auth/logout         # Cerrar sesión
GET    /api/v1/auth/me             # Obtener usuario actual
```

### **Clientes**
```
GET    /api/v1/clients             # Listar clientes
GET    /api/v1/clients/:id         # Obtener cliente
POST   /api/v1/clients             # Crear cliente
PUT    /api/v1/clients/:id         # Actualizar cliente
DELETE /api/v1/clients/:id         # Eliminar cliente
```

### **Ventas**
```
GET    /api/v1/sales               # Listar ventas
GET    /api/v1/sales/:id           # Obtener venta
POST   /api/v1/sales               # Crear venta
PUT    /api/v1/sales/:id           # Actualizar venta
DELETE /api/v1/sales/:id           # Eliminar venta
```

### **Caja**
```
GET    /api/v1/cash/current        # Caja actual
POST   /api/v1/cash/open           # Abrir caja
POST   /api/v1/cash/close          # Cerrar caja
GET    /api/v1/cash/movements      # Movimientos
POST   /api/v1/cash/movements      # Crear movimiento
```

### **Proveedores**
```
GET    /api/v1/suppliers           # Listar proveedores
POST   /api/v1/suppliers           # Crear proveedor
PUT    /api/v1/suppliers/:id       # Actualizar proveedor
DELETE /api/v1/suppliers/:id       # Eliminar proveedor
```

### **Compras**
```
GET    /api/v1/purchases           # Listar compras
POST   /api/v1/purchases           # Crear compra
PUT    /api/v1/purchases/:id       # Actualizar compra
DELETE /api/v1/purchases/:id       # Eliminar compra
```

---

## 🎨 **FRONTEND (REACT)**

### **Estructura de Componentes**
```
src/
├── components/
│   ├── common/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── forms/           # Formularios
│   │   ├── ClientForm.tsx
│   │   ├── SaleForm.tsx
│   │   └── ProductForm.tsx
│   └── layout/          # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/               # Páginas principales
│   ├── Dashboard.tsx
│   ├── Clients.tsx
│   ├── Sales.tsx
│   └── CashRegister.tsx
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useClients.ts
│   └── useSales.ts
└── utils/               # Utilidades
    ├── api.ts           # Cliente API
    ├── auth.ts          # Utilidades auth
    └── format.ts        # Formato de datos
```

### **Estados Globales (Context API)**
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// AppContext.tsx
interface AppContextType {
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
}
```

---

## 🔧 **CONFIGURACIÓN DE ENTORNO**

### **Variables de Entorno (.env)**
```bash
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/crm"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# API
API_URL="http://localhost:3001/api/v1"
FRONTEND_URL="http://localhost:3000"

# Archivos
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10MB"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
```

---

## 📦 **DEPENDENCIAS PRINCIPALES**

### **Backend**
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "nodemailer": "^6.9.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0"
  }
}
```

### **Frontend**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "tailwindcss": "^3.2.0",
    "lucide-react": "^0.263.0",
    "react-hook-form": "^7.43.0",
    "react-query": "^3.39.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.1.0",
    "@vitejs/plugin-react": "^3.1.0"
  }
}
```

---

## 🔄 **FLUJOS DE TRABAJO**

### **1. Flujo de Venta**
```
1. Usuario abre caja registradora
2. Cliente selecciona productos
3. Sistema calcula totales (subtotal + tax - discount)
4. Se genera factura con código único
5. Se registra pago en caja
6. Se actualiza inventario
7. Se envía confirmación por email
```

### **2. Flujo de Compra**
```
1. Se selecciona proveedor
2. Se registran productos a comprar
3. Se genera orden de compra
4. Se crea factura de proveedor
5. Se registra pago (parcial o total)
6. Se actualiza inventario al recibir
```

### **3. Flujo de Caja**
```
1. Apertura: Monto inicial + movimiento de apertura
2. Durante día: Ventas, pagos, entradas/salidas manuales
3. Cierre: Conteo físico vs. esperado
4. Registro de diferencias
5. Generación de reporte de cierre
```

---

## 📊 **REPORTES Y ANÁLITICAS**

### **Dashboard Principal**
- **Ventas del día**: Total y cantidad
- **Caja actual**: Balance y movimientos
- **Inventario bajo**: Productos con stock mínimo
- **Cuentas por cobrar**: Facturas pendientes
- **Proveedores**: Compras del mes

### **Reportes Disponibles**
```
• Reporte de Ventas (por período, cliente, producto)
• Reporte de Caja (aperturas, cierres, diferencias)
• Reporte de Inventario (movimientos, valorización)
• Reporte de Clientes (saldo, historial)
• Reporte de Proveedores (deuda, pagos)
• Reporte de Utilidades (margen por producto)
```

---

## 🚨 **MANEJO DE ERRORES**

### **Códigos de Error API**
```typescript
export enum ApiErrorCode {
  // Autenticación
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Negocio
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  CASH_ALREADY_OPEN = 'CASH_ALREADY_OPEN',
  CASH_NOT_OPEN = 'CASH_NOT_OPEN',
  CLIENT_HAS_DEBT = 'CLIENT_HAS_DEBT',
  
  // Sistema
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND'
}
```

### **Logging y Monitoreo**
```typescript
// Estructura de logs
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  userId?: string;
  branchId?: string;
  action?: string;
  metadata?: any;
  stack?: string;
}
```

---

## 🔒 **SEGURIDAD**

### **Prácticas de Seguridad**
1. **JWT con expiración** y refresh tokens
2. **Hashing de passwords** con bcrypt
3. **Validación de inputs** con Zod schemas
4. **CORS configurado** para dominios específicos
5. **Helmet** para headers de seguridad
6. **Rate limiting** en endpoints críticos
7. **Sanitización** de datos de usuario
8. **Auditoría** de acciones importantes

### **Roles y Permisos**
```typescript
enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',  // Acceso total
  MANAGER = 'MANAGER',              // Gestión completa
  CASHIER = 'CASHIER',              // Solo ventas y caja
  SALES = 'SALES',                  // Solo ventas
  VIEWER = 'VIEWER'                 // Solo lectura
}
```

---

## 📱 **FEATURES FUTURAS**

### **Corto Plazo**
- [ ] Módulo de Citas y Agendamiento
- [ ] Integración con WhatsApp Business
- [ ] Reportes PDF exportables
- [ ] Backup automático de datos
- [ ] Notificaciones push en tiempo real

### **Mediano Plazo**
- [ ] App móvil nativa (React Native)
- [ ] Integración con pasarelas de pago
- [ ] Sistema de inventario avanzado
- [ ] CRM con marketing automation
- [ ] API pública para terceros

### **Largo Plazo**
- [ ] Machine Learning para predicciones
- [ ] Multi-empresa real
- [ ] Blockchain para trazabilidad
- [ ] IA para análisis de datos
- [ ] Marketplace integrado

---

## 🛠️ **COMANDOS ÚTILES**

### **Desarrollo**
```bash
# Backend
cd backend
npm install
npm run dev        # Servidor en modo desarrollo
npm run build      # Compilar TypeScript
npm run start      # Producción

# Frontend  
cd frontend
npm install
npm run dev        # Servidor Vite
npm run build      # Build para producción
npm run preview    # Preview del build

# Base de Datos
npx prisma migrate dev    # Crear migración
npx prisma generate       # Generar client
npx prisma studio         # GUI de BD
```

### **Docker**
```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up --build -d

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Limpiar
docker-compose down -v
docker system prune -f
```

---

## 📞 **SOPORTE Y CONTACTO**

### **Documentación Adicional**
- [GUIA_DE_USO.md](./GUIA_DE_USO.md) - Guía para usuarios finales
- [API_DOCS.md](./API_DOCS.md) - Documentación API (pendiente)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de despliegue (pendiente)

### **Issues y Soporte**
- **GitHub Issues**: Reportar bugs y feature requests
- **Email**: soporte@tuempresa.com
- **Discord**: Comunidad de usuarios (pendiente)

---

## 📝 **NOTAS IMPORTANTES**

### **Estado Actual del Proyecto**
- ✅ **Backend**: API funcional con autenticación y CRUD básico
- ✅ **Frontend**: Interfaz React con componentes principales
- ✅ **Base de Datos**: Schema Prisma completo
- ✅ **Docker**: Configuración para producción
- 🔄 **Testing**: Unit tests pendientes
- 🔄 **Documentación**: API docs pendientes
- 🔄 **Deploy**: VPS setup pendiente

### **Próximos Pasos**
1. **Corregir errores TypeScript** actuales
2. **Completar build Docker** exitoso
3. **Desplegar en VPS** 
4. **Configurar dominio y SSL**
5. **Testing y QA**
6. **Lanzamiento producción**

---

**Última Actualización**: 26 de Febrero, 2026  
**Versión**: 1.0.0-beta  
**Estado**: En desarrollo - Pre-producción
