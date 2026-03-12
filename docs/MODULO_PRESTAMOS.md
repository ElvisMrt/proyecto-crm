# Módulo de Préstamos - Especificación Completa

## 📋 **Resumen Ejecutivo**

El módulo de préstamos permite gestionar préstamos de dinero a clientes con control de pagos, intereses, moras y reportes. Está diseñado para cumplir con las regulaciones financieras y ofrecer una gestión completa del ciclo de vida de los préstamos.

---

## 🎯 **Objetivos del Módulo**

1. **Gestión Centralizada**: Control completo del ciclo de vida de préstamos
2. **Flexibilidad**: Soporte para múltiples tipos de préstamos y planes de pago
3. **Cumplimiento**: Registros auditables y cumplimiento normativo
4. **Análisis**: Reportes detallados para toma de decisiones
5. **Automatización**: Cálculos automáticos de intereses, moras y pagos

---

## 🏗️ **Arquitectura del Sistema**

### **Base de Datos - Esquema**

```sql
-- Tabla principal de préstamos
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(20) UNIQUE NOT NULL,  -- PRÉSTAMO-000001
  client_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,  -- Tasa anual (%)
  term_months INTEGER NOT NULL,
  payment_frequency VARCHAR(20) NOT NULL, -- MONTHLY, BIWEEKLY, WEEKLY
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  purpose TEXT,
  collateral TEXT,  -- Garantía (opcional)
  guarantee VARCHAR(255),  -- Aval (opcional)
  approved_by UUID,  -- Usuario que aprobó
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Tabla de pagos
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_at TIMESTAMP,
  payment_method VARCHAR(20),  -- CASH, BANK_TRANSFER, CHECK
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  late_fee DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Tabla de transacciones de pagos
CREATE TABLE loan_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  reference_number VARCHAR(100),
  cash_register_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES loan_payments(id),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Configuración de tipos de préstamo
CREATE TABLE loan_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_interest_rate DECIMAL(5,2) NOT NULL,
  default_term_months INTEGER NOT NULL,
  min_amount DECIMAL(15,2) NOT NULL,
  max_amount DECIMAL(15,2) NOT NULL,
  requires_guarantee BOOLEAN DEFAULT false,
  requires_collateral BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de cambios en préstamos
CREATE TABLE loan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,  -- CREATED, APPROVED, REJECTED, MODIFIED, PAID_OFF
  old_values JSONB,
  new_values JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 🔧 **Componentes del Sistema**

### **1. Backend - Controllers**

#### **LoanController**
```typescript
// Endpoints principales
GET    /api/v1/loans              // Listar préstamos
POST   /api/v1/loans              // Crear préstamo
GET    /api/v1/loans/:id          // Detalle de préstamo
PUT    /api/v1/loans/:id          // Actualizar préstamo
DELETE /api/v1/loans/:id          // Eliminar préstamo
POST   /api/v1/loans/:id/approve  // Aprobar préstamo
POST   /api/v1/loans/:id/reject   // Rechazar préstamo
POST   /api/v1/loans/:id/cancel   // Cancelar préstamo
```

#### **LoanPaymentController**
```typescript
// Endpoints de pagos
GET    /api/v1/loans/:id/payments           // Listar pagos
POST   /api/v1/loans/:id/payments           // Crear plan de pagos
PUT    /api/v1/loans/:id/payments/:pid      // Actualizar pago
POST   /api/v1/loans/:id/payments/:pid/pay  // Realizar pago
GET    /api/v1/loans/:id/payment-schedule   // Calcular plan de pagos
```

#### **LoanReportsController**
```typescript
// Endpoints de reportes
GET    /api/v1/loans/reports/portfolio       // Portafolio de préstamos
GET    /api/v1/loans/reports/aging          // Reporte de antigüedad
GET    /api/v1/loans/reports/delinquency    // Reporte de morosidad
GET    /api/v1/loans/reports/performance    // Desempeño de préstamos
```

### **2. Frontend - Components**

#### **LoansTab.tsx** - Listado principal
- Filtros avanzados (estado, cliente, rango fechas, monto)
- Tabla con paginación y ordenamiento
- Acciones rápidas (aprobar, ver detalles, generar reportes)
- Indicadores visuales de estado

#### **LoanForm.tsx** - Formulario de préstamo
- Selección de cliente (con validación crediticia)
- Configuración de préstamo (monto, plazo, tasa)
- Cálculo automático de cuotas
- Documentación adjunta

#### **LoanDetail.tsx** - Vista detallada
- Información completa del préstamo
- Historial de pagos
- Calendario de pagos
- Opciones de gestión

#### **LoanPaymentSchedule.tsx** - Plan de pagos
- Tabla de amortización
- Fechas de vencimiento
- Estado de cada pago
- Opciones de pago

#### **LoanCalculator.tsx** - Calculadora
- Simulador de préstamos
- Comparación de escenarios
- Exportación de resultados

---

## 📊 **Funcionalidades Detalladas**

### **1. Gestión de Préstamos**

#### **Creación de Préstamo**
```typescript
interface LoanRequest {
  clientId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
  startDate: string;
  purpose: string;
  collateral?: string;
  guarantee?: string;
  loanTypeId: string;
}
```

**Validaciones:**
- Límite de crédito del cliente
- Políticas de riesgo
- Montos mínimos/máximos por tipo
- Documentación requerida

#### **Aprobación de Préstamo**
- Flujo de aprobación multi-nivel
- Verificación de documentos
- Evaluación crediticia automatizada
- Registro de aprobador y fecha

#### **Estados del Préstamo**
```typescript
enum LoanStatus {
  PENDING = 'PENDING',      // Esperando aprobación
  APPROVED = 'APPROVED',    // Aprobado
  ACTIVE = 'ACTIVE',        // Activo (con pagos)
  DELINQUENT = 'DELINQUENT', // En mora
  PAID_OFF = 'PAID_OFF',    // Pagado completamente
  CANCELLED = 'CANCELLED',  // Cancelado
  DEFAULTED = 'DEFAULTED'   // Incumplido
}
```

### **2. Sistema de Pagos**

#### **Cálculo de Cuotas**
```typescript
interface PaymentCalculation {
  principal: number;      // Capital
  interest: number;       // Interés
  total: number;         // Cuota total
  balance: number;       // Saldo restante
}

// Fórmula de amortización francesa
function calculateInstallment(
  principal: number,
  annualRate: number,
  months: number
): PaymentCalculation[] {
  const monthlyRate = annualRate / 12 / 100;
  const installment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                     (Math.pow(1 + monthlyRate, months) - 1);
  
  // Generar tabla de amortización
  return generateAmortizationTable(principal, monthlyRate, installment, months);
}
```

#### **Tipos de Frecuencia**
- **Mensual**: Pagos cada 30 días
- **Quincenal**: Pagos cada 15 días
- **Semanal**: Pagos cada 7 días

#### **Gestión de Moras**
```typescript
interface LateFeeConfig {
  gracePeriodDays: number;    // Días de gracia
  penaltyRate: number;        // Tasa de penalización (%)
  maxPenaltyAmount: number;   // Máximo penalización
  compoundInterest: boolean;  // Interés compuesto
}

// Cálculo automático de moras
function calculateLateFee(
  paymentAmount: number,
  daysLate: number,
  config: LateFeeConfig
): number {
  if (daysLate <= config.gracePeriodDays) return 0;
  
  const penaltyDays = daysLate - config.gracePeriodDays;
  const dailyRate = config.penaltyRate / 100 / 30; // Tasa diaria
  
  return Math.min(
    paymentAmount * dailyRate * penaltyDays,
    config.maxPenaltyAmount
  );
}
```

### **3. Reportes y Análisis**

#### **Reporte de Portafolio**
```typescript
interface PortfolioReport {
  totalLoans: number;
  totalAmount: number;
  activeLoans: number;
  activeAmount: number;
  delinquentLoans: number;
  delinquentAmount: number;
  paidOffLoans: number;
  paidOffAmount: number;
  averageLoanSize: number;
  weightedAverageRate: number;
  loanToValueRatio: number;
}
```

#### **Reporte de Antigüedad (Aging)**
```typescript
interface AgingReport {
  current: { count: number; amount: number };      // 0-30 días
  days30to60: { count: number; amount: number };   // 31-60 días
  days60to90: { count: number; amount: number };   // 61-90 días
  days90plus: { count: number; amount: number };   // >90 días
}
```

#### **Indicadores Clave (KPIs)**
- **Tasa de Morosidad**: % de préstamos en mora
- **Tasa de Incumplimiento**: % de préstamos default
- **ROI del Portafolio**: Retorno sobre inversión
- **Duración Promedio**: Tiempo promedio de pago
- **Tasa de Prepagos**: % de préstamos pagados anticipadamente

---

## 🔐 **Seguridad y Cumplimiento**

### **1. Control de Accesos**
```typescript
enum LoanPermissions {
  VIEW_LOANS = 'loans:view',
  CREATE_LOANS = 'loans:create',
  APPROVE_LOANS = 'loans:approve',
  MODIFY_LOANS = 'loans:modify',
  DELETE_LOANS = 'loans:delete',
  VIEW_REPORTS = 'loans:reports',
  PROCESS_PAYMENTS = 'loans:payments'
}

// Roles y permisos
const ROLE_PERMISSIONS = {
  ADMINISTRATOR: [
    LoanPermissions.VIEW_LOANS,
    LoanPermissions.CREATE_LOANS,
    LoanPermissions.APPROVE_LOANS,
    LoanPermissions.MODIFY_LOANS,
    LoanPermissions.DELETE_LOANS,
    LoanPermissions.VIEW_REPORTS,
    LoanPermissions.PROCESS_PAYMENTS
  ],
  SUPERVISOR: [
    LoanPermissions.VIEW_LOANS,
    LoanPermissions.CREATE_LOANS,
    LoanPermissions.APPROVE_LOANS,
    LoanPermissions.MODIFY_LOANS,
    LoanPermissions.VIEW_REPORTS,
    LoanPermissions.PROCESS_PAYMENTS
  ],
  CASHIER: [
    LoanPermissions.VIEW_LOANS,
    LoanPermissions.PROCESS_PAYMENTS
  ]
};
```

### **2. Validaciones de Negocio**
- **Límites de exposición**: Máximo por cliente y por portafolio
- **Políticas de riesgo**: Score crediticio mínimo
- **Documentación requerida**: ID, comprobantes, garantías
- **Regulaciones locales**: Cumplimiento de leyes financieras

### **3. Auditoría**
```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## 🎨 **UI/UX Design**

### **1. Dashboard de Préstamos**
- **KPI Cards**: Monto total, préstamos activos, morosidad
- **Gráficos**: Tendencias, distribución por tipo, flujo de pagos
- **Alertas**: Préstamos por vencer, pagos atrasados
- **Acciones Rápidas**: Nuevo préstamo, ver reportes

### **2. Lista de Préstamos**
- **Filtros Avanzados**: Estado, cliente, rango fechas, monto
- **Búsqueda**: Por número, cliente, referencia
- **Ordenamiento**: Por fecha, monto, estado
- **Exportación**: Excel, PDF

### **3. Formulario de Préstamo**
- **Validación en tiempo real**
- **Calculadora integrada**
- **Verificación de cliente**
- **Documentos adjuntos**
- **Vista previa de pagos**

### **4. Detalles del Préstamo**
- **Información general**: Datos básicos, estado
- **Historial de pagos**: Tabla detallada
- **Calendario**: Visualización mensual
- **Documentos**: Contratos, garantías
- **Acciones**: Editar, aprobar, cancelar

---

## 📱 **Responsive Design**

### **Mobile First**
- **Cards** en lugar de tablas complejas
- **Bottom sheets** para formularios
- **Swipe gestures** para navegación
- **Push notifications** para recordatorios

### **Tablet**
- **Split view** para lista y detalles
- **Touch-optimized** controls
- **Landscape support** para formularios

### **Desktop**
- **Multi-column layouts**
- **Keyboard shortcuts**
- **Drag & drop** para documentos
- **Advanced charts** y visualizaciones

---

## 🔧 **Integraciones**

### **1. Sistema de Pagos**
- Integración con **Cash Register**
- Soporte para múltiples métodos de pago
- Conciliación automática

### **2. Gestión de Clientes**
- Validación crediticia
- Historial de préstamos
- Score de riesgo

### **3. Contabilidad**
- Asientos automáticos
- Cuentas por cobrar
- Reportes financieros

### **4. Notificaciones**
- **Email**: Recordatorios de pago
- **SMS**: Alertas de mora
- **Push**: Notificaciones en app

---

## 📊 **Métricas y KPIs**

### **1. Métricas de Operación**
- **Tiempo promedio de aprobación**: 24-48 horas
- **Tasa de conversión**: % de solicitudes aprobadas
- **Tiempo de procesamiento**: < 5 minutos por pago

### **2. Métricas Financieras**
- **ROI del portafolio**: > 15% anual
- **Tasa de morosidad**: < 5%
- **Tasa de incumplimiento**: < 2%
- **Duración promedio**: 12-18 meses

### **3. Métricas de Cliente**
- **Satisfacción**: > 4.5/5
- **Retención**: > 80%
- **Prepago rate**: 15-20%

---

## 🚀 **Implementación - Roadmap**

### **Fase 1: Core (4 semanas)**
- [x] Base de datos y modelos
- [x] CRUD básico de préstamos
- [x] Calculadora de cuotas
- [x] Formulario de solicitud

### **Fase 2: Pagos (3 semanas)**
- [ ] Sistema de pagos
- [ ] Gestión de moras
- [ ] Calendario de pagos
- [ ] Integración con caja

### **Fase 3: Reportes (2 semanas)**
- [ ] Reportes básicos
- [ ] Dashboard de KPIs
- [ ] Exportación Excel/PDF
- [ ] Análisis de portafolio

### **Fase 4: Avanzado (3 semanas)**
- [ ] Flujo de aprobación
- [ ] Sistema de riesgo
- [ ] Notificaciones
- [ ] API pública

### **Fase 5: Optimización (2 semanas)**
- [ ] Performance
- [ ] Testing automatizado
- [ ] Documentación
- [ ] Capacitación

---

## 📋 **Checklist de Validación**

### **Funcional**
- [ ] Creación de préstamos funciona
- [ ] Cálculo de cuotas es correcto
- [ ] Pagos se procesan correctamente
- [ ] Reportes generan datos precisos
- [ ] Notificaciones se envían

### **Técnico**
- [ ] API responde < 200ms
- [ ] Base de datos optimizada
- [ ] Sin memory leaks
- [ ] Backup automático
- [ ] Logs completos

### **Seguridad**
- [ ] Autenticación funciona
- [ ] Permisos correctos
- [ ] Datos encriptados
- [ ] Auditoría completa
- [ ] Cumplimiento GDPR

### **UX/UI**
- [ ] Design consistente
- [ ] Responsive funciona
- [ ] Accesibilidad WCAG
- [ ] Testing de usabilidad
- [ ] Documentación de ayuda

---

## 🎯 **Success Metrics**

### **Adopción**
- **Primer mes**: 50 préstamos creados
- **Primer trimestre**: 200 préstamos activos
- **Primer año**: 1,000 préstamos procesados

### **Eficiencia**
- **Reducción tiempo**: 70% menos tiempo en procesamiento
- **Reducción errores**: 90% menos errores manuales
- **Automatización**: 80% de procesos automatizados

### **Satisfacción**
- **Usuario**: > 4.5/5 satisfacción
- **Soporte**: < 2 tickets/semana
- **Formación**: < 1 hora para aprender

---

## 📚 **Documentación Adicional**

### **Manuales**
- Manual de Usuario Final
- Guía de Administrador
- Documentación Técnica API
- Manual de Implementación

### **Capacitación**
- Videos tutoriales
- Webinars mensuales
- Certificación interna
- Base de conocimiento

### **Soporte**
- Help desk integrado
- Chat en vivo
- FAQ dinámico
- Community forum

---

**Última actualización**: Marzo 2026
**Versión**: 1.0.0
**Estado**: Especificación completa lista para desarrollo
