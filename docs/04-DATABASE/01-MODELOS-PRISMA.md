# Modelos de Base de Datos (Prisma Schema)

Este documento define la estructura de la base de datos usando Prisma ORM. El sistema utiliza estrategia multi-tenant con schema por tenant.

---

## 📋 Notas Importantes

- **Multi-tenant:** Cada tenant tiene su propio schema (`tenant_{uuid}`)
- **Base maestra:** Schema `master` para gestión de tenants y suscripciones
- **Relaciones:** Las relaciones se mantienen dentro del mismo tenant
- **Índices:** Se especifican índices importantes para performance

---

## 🏗️ Schema Maestro (Master)

### Tenant (Empresa)

```prisma
model Tenant {
  id            String   @id @default(uuid())
  name          String   // Nombre de la empresa
  slug          String   @unique // Slug único para subdominio
  email         String
  phone         String?
  address       String?
  country       String   @default("DO")
  status        TenantStatus @default(ACTIVE)
  plan          PlanType @default(BASIC)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relaciones
  users         MasterUser[]
  subscriptions Subscription[]
  
  @@index([slug])
  @@index([status])
}
```

### Master User (Super Admin)

```prisma
model MasterUser {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hasheado
  name      String
  role      MasterRole @default(SUPPORT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
  
  @@index([email])
}
```

### Subscription (Suscripciones)

```prisma
model Subscription {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  plan            PlanType
  status          SubscriptionStatus @default(ACTIVE)
  startDate       DateTime
  endDate         DateTime?
  billingCycle    BillingCycle @default(MONTHLY)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([tenantId])
  @@index([status])
}
```

### Enums - Master

```prisma
enum TenantStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum PlanType {
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

enum MasterRole {
  SUPER_ADMIN
  SUPPORT
}

enum SubscriptionStatus {
  ACTIVE
  SUSPENDED
  EXPIRED
  CANCELLED
}

enum BillingCycle {
  MONTHLY
  YEARLY
}
```

---

## 🏢 Schema por Tenant

### User (Usuario del Tenant)

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String   // Hasheado
  name        String
  phone       String?
  role        Role     @default(OPERATOR)
  isActive    Boolean  @default(true)
  lastLogin   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  invoices    Invoice[]
  payments    Payment[]
  cashMovements CashMovement[]
  inventoryAdjustments InventoryAdjustment[]
  tasks       Task[]
  
  @@index([email])
  @@index([role])
  @@index([isActive])
}
```

### Client (Cliente)

```prisma
model Client {
  id              String   @id @default(uuid())
  name            String
  identification  String   // RNC, Cédula, etc.
  email           String?
  phone           String?
  address         String?
  creditLimit     Decimal? @default(0)
  creditDays      Int      @default(30)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  invoices        Invoice[]
  quotes          Quote[]
  payments        Payment[]
  tasks           Task[]
  
  @@index([name])
  @@index([identification])
  @@index([isActive])
}
```

---

## 📄 Módulo Ventas

### Invoice (Factura)

```prisma
model Invoice {
  id              String      @id @default(uuid())
  number          String      @unique // #FA-XXXX
  ncf             String?     @unique // NCF fiscal
  clientId        String
  client          Client      @relation(fields: [clientId], references: [id])
  type            InvoiceType @default(FISCAL)
  status          InvoiceStatus @default(ISSUED)
  paymentMethod   PaymentMethod
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @default(0) @db.Decimal(10, 2)
  discount        Decimal     @default(0) @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  balance         Decimal     @default(0) @db.Decimal(10, 2) // Balance pendiente
  issueDate       DateTime    @default(now())
  dueDate         DateTime?   // Si es crédito
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  branchId        String?
  branch          Branch?     @relation(fields: [branchId], references: [id])
  observations    String?
  cancelledAt     DateTime?
  cancellationReason String?
  cancelledBy     String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relaciones
  items           InvoiceItem[]
  payments        Payment[]
  creditNotes     CreditNote[]
  
  @@index([number])
  @@index([ncf])
  @@index([clientId])
  @@index([status])
  @@index([issueDate])
  @@index([dueDate])
}
```

### InvoiceItem (Ítem de Factura)

```prisma
model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  price       Decimal  @db.Decimal(10, 2)
  discount    Decimal  @default(0) @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  
  @@index([invoiceId])
  @@index([productId])
}
```

### Quote (Cotización)

```prisma
model Quote {
  id              String      @id @default(uuid())
  number          String      @unique // #CT-XXXX
  clientId        String
  client          Client      @relation(fields: [clientId], references: [id])
  status          QuoteStatus @default(OPEN)
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @default(0) @db.Decimal(10, 2)
  discount        Decimal     @default(0) @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  validUntil      DateTime?
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  convertedToInvoiceId String? @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relaciones
  items           QuoteItem[]
  
  @@index([number])
  @@index([clientId])
  @@index([status])
}
```

### QuoteItem (Ítem de Cotización)

```prisma
model QuoteItem {
  id          String   @id @default(uuid())
  quoteId     String
  quote       Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  price       Decimal  @db.Decimal(10, 2)
  discount    Decimal  @default(0) @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  
  @@index([quoteId])
}
```

### CreditNote (Nota de Crédito)

```prisma
model CreditNote {
  id              String   @id @default(uuid())
  number          String   @unique // #NC-XXXX
  ncf             String?  @unique
  invoiceId       String
  invoice         Invoice  @relation(fields: [invoiceId], references: [id])
  reason          String   // Motivo obligatorio
  subtotal        Decimal  @db.Decimal(10, 2)
  tax             Decimal  @default(0) @db.Decimal(10, 2)
  total           Decimal  @db.Decimal(10, 2)
  issueDate       DateTime @default(now())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())
  
  // Relaciones
  items           CreditNoteItem[]
  
  @@index([number])
  @@index([invoiceId])
  @@index([issueDate])
}
```

### CreditNoteItem (Ítem de Nota de Crédito)

```prisma
model CreditNoteItem {
  id            String      @id @default(uuid())
  creditNoteId  String
  creditNote    CreditNote  @relation(fields: [creditNoteId], references: [id], onDelete: Cascade)
  productId     String?
  product       Product?    @relation(fields: [productId], references: [id])
  description   String
  quantity      Decimal     @db.Decimal(10, 2)
  price         Decimal     @db.Decimal(10, 2)
  subtotal      Decimal     @db.Decimal(10, 2)
  createdAt     DateTime    @default(now())
  
  @@index([creditNoteId])
}
```

### Enums - Ventas

```prisma
enum InvoiceType {
  FISCAL    // Con NCF
  NON_FISCAL
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
  CARD
  CREDIT
  MIXED
}

enum QuoteStatus {
  OPEN
  ACCEPTED
  REJECTED
  CONVERTED
}
```

---

## 💰 Módulo Cuentas por Cobrar

### Payment (Pago)

```prisma
model Payment {
  id              String      @id @default(uuid())
  clientId        String
  client          Client      @relation(fields: [clientId], references: [id])
  invoiceId       String?
  invoice         Invoice?    @relation(fields: [invoiceId], references: [id])
  amount          Decimal     @db.Decimal(10, 2)
  method          PaymentMethod
  reference       String?     // Número de transacción, cheque, etc.
  paymentDate     DateTime    @default(now())
  observations    String?
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([clientId])
  @@index([invoiceId])
  @@index([paymentDate])
}
```

---

## 💵 Módulo Caja

### CashRegister (Caja)

```prisma
model CashRegister {
  id              String          @id @default(uuid())
  branchId        String
  branch          Branch          @relation(fields: [branchId], references: [id])
  status          CashStatus      @default(CLOSED)
  initialAmount   Decimal         @db.Decimal(10, 2)
  finalAmount     Decimal?        @db.Decimal(10, 2)
  difference      Decimal?        @default(0) @db.Decimal(10, 2)
  openedAt        DateTime
  closedAt        DateTime?
  openedBy        String
  openedByUser    User            @relation("OpenedCashRegister", fields: [openedBy], references: [id])
  closedBy        String?
  closedByUser    User?           @relation("ClosedCashRegister", fields: [closedBy], references: [id])
  observations    String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relaciones
  movements       CashMovement[]
  
  @@index([branchId])
  @@index([status])
  @@index([openedAt])
}
```

### CashMovement (Movimiento de Caja)

```prisma
model CashMovement {
  id              String          @id @default(uuid())
  cashRegisterId  String
  cashRegister    CashRegister    @relation(fields: [cashRegisterId], references: [id], onDelete: Cascade)
  type            MovementType
  concept         String          // Descripción
  amount          Decimal         @db.Decimal(10, 2) // Positivo entrada, negativo salida
  method          PaymentMethod
  invoiceId       String?         // Si viene de una factura
  paymentId       String?         // Si viene de un pago
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  movementDate    DateTime        @default(now())
  observations    String?
  createdAt       DateTime        @default(now())
  
  @@index([cashRegisterId])
  @@index([type])
  @@index([movementDate])
}
```

### Enums - Caja

```prisma
enum CashStatus {
  OPEN
  CLOSED
}

enum MovementType {
  OPENING        // Apertura
  SALE           // Venta
  PAYMENT        // Pago recibido
  MANUAL_ENTRY   // Entrada manual
  MANUAL_EXIT    // Salida manual
  CLOSING        // Cierre
}
```

---

## 📦 Módulo Inventario

### Product (Producto)

```prisma
model Product {
  id              String   @id @default(uuid())
  code            String   @unique
  barcode         String?  @unique
  name            String
  description     String?
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  brand           String?
  unit            String   @default("UNIT") // UNIT, KG, L, etc.
  salePrice       Decimal  @db.Decimal(10, 2)
  cost            Decimal? @db.Decimal(10, 2)
  hasTax          Boolean  @default(true)
  taxPercent      Decimal  @default(18) @db.Decimal(5, 2)
  controlsStock   Boolean  @default(true)
  minStock        Decimal  @default(0) @db.Decimal(10, 2)
  isActive        Boolean  @default(true)
  imageUrl        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  stocks          Stock[]
  invoiceItems    InvoiceItem[]
  quoteItems      QuoteItem[]
  creditNoteItems CreditNoteItem[]
  movements       InventoryMovement[]
  
  @@index([code])
  @@index([barcode])
  @@index([categoryId])
  @@index([isActive])
}
```

### Category (Categoría)

```prisma
model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relaciones
  products    Product[]
  
  @@index([name])
  @@index([isActive])
}
```

### Stock (Existencias)

```prisma
model Stock {
  id          String   @id @default(uuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  quantity    Decimal  @default(0) @db.Decimal(10, 2)
  minStock    Decimal  @default(0) @db.Decimal(10, 2)
  updatedAt   DateTime @updatedAt
  
  @@unique([productId, branchId])
  @@index([productId])
  @@index([branchId])
}
```

### InventoryMovement (Movimiento de Inventario - Kardex)

```prisma
model InventoryMovement {
  id              String            @id @default(uuid())
  productId       String
  product         Product           @relation(fields: [productId], references: [id])
  branchId        String
  branch          Branch            @relation(fields: [branchId], references: [id])
  type            InventoryMovementType
  quantity        Decimal           @db.Decimal(10, 2) // Positivo entrada, negativo salida
  balance         Decimal           @db.Decimal(10, 2) // Stock después del movimiento
  documentType    String?           // Invoice, CreditNote, Adjustment
  documentId      String?           // ID del documento origen
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  movementDate    DateTime          @default(now())
  observations    String?
  createdAt       DateTime          @default(now())
  
  @@index([productId])
  @@index([branchId])
  @@index([type])
  @@index([movementDate])
}
```

### InventoryAdjustment (Ajuste de Inventario)

```prisma
model InventoryAdjustment {
  id          String   @id @default(uuid())
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  type        AdjustmentType
  reason      String   // Motivo obligatorio
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  adjustmentDate DateTime @default(now())
  observations String?
  createdAt   DateTime @default(now())
  
  // Relaciones
  items       InventoryAdjustmentItem[]
  
  @@index([branchId])
  @@index([adjustmentDate])
}
```

### InventoryAdjustmentItem (Ítem de Ajuste)

```prisma
model InventoryAdjustmentItem {
  id                  String              @id @default(uuid())
  adjustmentId        String
  adjustment          InventoryAdjustment @relation(fields: [adjustmentId], references: [id], onDelete: Cascade)
  productId           String
  product             Product             @relation(fields: [productId], references: [id])
  previousQuantity    Decimal             @db.Decimal(10, 2)
  adjustmentQuantity  Decimal             @db.Decimal(10, 2) // Positivo entrada, negativo salida
  newQuantity         Decimal             @db.Decimal(10, 2)
  createdAt           DateTime            @default(now())
  
  @@index([adjustmentId])
  @@index([productId])
}
```

### Enums - Inventario

```prisma
enum InventoryMovementType {
  SALE               // Venta (salida)
  CREDIT_NOTE        // Nota de crédito (entrada)
  ADJUSTMENT_ENTRY   // Ajuste entrada
  ADJUSTMENT_EXIT    // Ajuste salida
  TRANSFER           // Transferencia entre sucursales (fase futura)
}

enum AdjustmentType {
  ENTRY    // Entrada (sobrante)
  EXIT     // Salida (faltante)
}
```

---

## 🏢 Configuración

### Branch (Sucursal)

```prisma
model Branch {
  id          String   @id @default(uuid())
  name        String
  address     String?
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  invoices    Invoice[]
  cashRegisters CashRegister[]
  stocks      Stock[]
  inventoryMovements InventoryMovement[]
  adjustments InventoryAdjustment[]
  
  @@index([name])
  @@index([isActive])
}
```

### Role (Rol)

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  permissions Json     // Array de permisos en formato JSON
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name])
}
```

### Enums - Configuración

```prisma
enum Role {
  ADMINISTRATOR
  SUPERVISOR
  OPERATOR
  CASHIER
}
```

---

## 🔐 Auditoría

### AuditLog (Log de Auditoría)

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  action      String   // Acción realizada
  entity      String   // Entidad afectada
  entityId    String   // ID de la entidad
  changes     Json?    // Cambios realizados (antes/después)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([createdAt])
}
```

---

## 📝 Notas de Implementación

1. **Decimales:** Todos los campos monetarios usan `@db.Decimal(10, 2)` para precisión.

2. **Índices:** Se especifican índices en campos frecuentemente consultados.

3. **Cascade:** Se usa `onDelete: Cascade` en relaciones uno-a-muchos donde tiene sentido.

4. **Soft Deletes:** Para entidades críticas, considerar agregar `deletedAt` en lugar de eliminar físicamente.

5. **Multi-tenant:** Este schema se aplica a cada tenant. La separación física se hace a nivel de schema de base de datos.

---

**Última actualización:** [Fecha]



