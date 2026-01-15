# Análisis Completo: Módulo de Cuentas por Cobrar

## 📋 Resumen Ejecutivo

Este documento analiza el estado actual del módulo de Cuentas por Cobrar (CxC), identificando lo implementado, los errores encontrados y las funcionalidades faltantes, organizadas por etapas de trabajo.

---

## ✅ Lo que tenemos implementado

### Backend (Completo)

#### 1. Controladores (`backend/src/controllers/receivables.controller.ts`)
- ✅ `getStatus(clientId)` - Estado de cuenta de un cliente
- ✅ `getOverdue()` - Lista de facturas vencidas con filtros
- ✅ `createPayment()` - Registro de pagos (parciales/totales, automático/manual)
- ✅ `getPayments()` - Historial de pagos con filtros
- ✅ `getSummary()` - Resumen ejecutivo de CxC

#### 2. Rutas (`backend/src/routes/receivables.routes.ts`)
- ✅ `GET /receivables/status/:clientId` - Estado de cuenta
- ✅ `GET /receivables/overdue` - Facturas vencidas
- ✅ `POST /receivables/payments` - Crear pago
- ✅ `GET /receivables/payments` - Historial de pagos
- ✅ `GET /receivables/summary` - Resumen

#### 3. Validaciones y Reglas de Negocio
- ✅ Validación de montos (no exceder balance)
- ✅ Distribución automática de pagos (por antigüedad)
- ✅ Distribución manual de pagos (por factura)
- ✅ Actualización automática de balance y estado de facturas
- ✅ Registro de movimientos en caja (si es efectivo)
- ✅ Cálculo de días vencidos
- ✅ Agrupación por antigüedad (0-30, 31-60, 61-90, 90+)

### Frontend (Parcialmente Completo)

#### 1. Página Principal (`frontend/src/pages/Receivables.tsx`)
- ✅ Navegación por tabs
- ✅ Resumen general en la parte superior
- ✅ Integración con todos los submódulos

#### 2. Componentes Implementados

**AccountStatusTab.tsx** - Estado de Cuenta
- ✅ Selector de cliente con búsqueda
- ✅ Resumen del cliente (total por cobrar, vencido, días promedio)
- ✅ Tabla de facturas con detalles
- ✅ Badges de estado (Pagada, Vencida, Pendiente)
- ⚠️ Botones "Ver" y "Cobrar" sin funcionalidad completa

**PaymentRegisterTab.tsx** - Registro de Pagos
- ✅ Selector de cliente
- ✅ Lista de facturas pendientes con checkboxes
- ✅ Modo de distribución (automático/manual)
- ✅ Formulario completo (monto, método, referencia, fecha, observaciones)
- ✅ Resumen del pago
- ✅ Validaciones básicas

**OverdueInvoicesTab.tsx** - Facturas Vencidas
- ✅ Filtros (rango de días, búsqueda)
- ✅ Tabla de facturas vencidas
- ✅ Badges de color según antigüedad
- ✅ Paginación
- ⚠️ Botones de acción sin funcionalidad completa (Cobrar, Tarea, WhatsApp)

**PaymentHistoryTab.tsx** - Historial de Pagos
- ✅ Filtros (cliente, factura, fechas)
- ✅ Tabla de pagos con detalles
- ✅ Paginación
- ⚠️ Filtro de cliente por ID (debería ser búsqueda)

**SummaryTab.tsx** - Resumen de CxC
- ✅ KPIs principales (Total por cobrar, Vencido, Clientes morosos)
- ✅ Antigüedad de saldos (0-30, 31-60, 61-90, 90+)
- ✅ Gráfico de barras simple
- ⚠️ Falta gráfico circular y top clientes

---

## ❌ Errores Encontrados

### 1. Backend

#### Error 1: Filtro por Sucursal Incompleto
**Ubicación**: `backend/src/controllers/receivables.controller.ts`
- ❌ `getStatus()` - No filtra por sucursal
- ❌ `getOverdue()` - No filtra por sucursal
- ❌ `createPayment()` - No valida sucursal del cliente
- ❌ `getPayments()` - No filtra por sucursal
- ✅ `getSummary()` - SÍ filtra por sucursal (implementado)

**Impacto**: No se puede filtrar CxC por sucursal, lo cual es crítico para multi-sucursal.

#### Error 2: Relación con Caja
**Ubicación**: `backend/src/controllers/receivables.controller.ts` - `createPayment()`
- ⚠️ Solo registra movimiento en caja si método es `CASH`
- ⚠️ No valida que haya caja abierta antes de registrar pago en efectivo
- ⚠️ No registra movimiento para `TRANSFER` o `CARD` (debería según reglas de negocio)

**Impacto**: Inconsistencia en el registro de ingresos en caja.

#### Error 3: Validación de Cliente Opcional
**Ubicación**: `backend/src/controllers/receivables.controller.ts`
- ⚠️ No valida si el cliente tiene facturas a crédito antes de mostrar estado de cuenta
- ⚠️ No valida límite de crédito del cliente

**Impacto**: Puede mostrar estados de cuenta vacíos o permitir pagos sin validar límites.

### 2. Frontend

#### Error 1: Navegación entre Tabs
**Ubicación**: `OverdueInvoicesTab.tsx`, `AccountStatusTab.tsx`
- ❌ Botón "Cobrar" no navega a tab de pagos
- ❌ Botón "Ver" no muestra detalle de factura
- ❌ No hay comunicación entre componentes

**Impacto**: Flujo de usuario interrumpido.

#### Error 2: Filtro de Cliente por ID
**Ubicación**: `PaymentHistoryTab.tsx`
- ❌ Filtro de cliente requiere ID (debería ser búsqueda por nombre)

**Impacto**: Usabilidad muy limitada.

#### Error 3: Falta Integración con Otros Módulos
**Ubicación**: Varios componentes
- ❌ "Ver Factura" no abre `InvoiceDetail`
- ❌ "Crear Tarea" no integra con módulo CRM
- ❌ "Enviar WhatsApp" no tiene funcionalidad

**Impacto**: Funcionalidades incompletas.

#### Error 4: Falta Filtro por Sucursal
**Ubicación**: Todos los componentes
- ❌ No hay selector de sucursal en ningún componente
- ❌ No se pasa `branchId` a las APIs

**Impacto**: No se puede filtrar por sucursal en el frontend.

---

## 🚧 Lo que falta implementar

### Prioridad Alta

#### 1. Filtro por Sucursal
**Ubicación**: Backend y Frontend
- [ ] Agregar `branchId` a todos los endpoints de receivables
- [ ] Agregar selector de sucursal en todos los componentes
- [ ] Validar que el usuario solo vea sucursales permitidas
- [ ] Filtrar facturas por sucursal en `getStatus()`
- [ ] Filtrar facturas vencidas por sucursal en `getOverdue()`
- [ ] Filtrar pagos por sucursal en `getPayments()`

**Estimado**: 4-6 horas

#### 2. Navegación entre Tabs
**Ubicación**: Frontend
- [ ] Implementar comunicación entre tabs (contexto o props)
- [ ] Botón "Cobrar" desde `OverdueInvoicesTab` → `PaymentRegisterTab` con cliente/factura pre-seleccionados
- [ ] Botón "Ver" desde `AccountStatusTab` → `InvoiceDetail`
- [ ] Botón "Ver Estado de Cuenta" desde `OverdueInvoicesTab` → `AccountStatusTab`

**Estimado**: 3-4 horas

#### 3. Integración con Módulo de Ventas
**Ubicación**: Frontend
- [ ] "Ver Factura" abre `InvoiceDetail` con la factura seleccionada
- [ ] Navegación desde `InvoiceDetail` a `AccountStatusTab` del cliente
- [ ] Botón "Registrar Pago" en `InvoiceDetail` para facturas a crédito

**Estimado**: 2-3 horas

#### 4. Validaciones de Caja
**Ubicación**: Backend
- [ ] Validar que haya caja abierta antes de registrar pago en efectivo
- [ ] Registrar movimiento en caja para todos los métodos de pago (no solo CASH)
- [ ] Validar sucursal de la caja vs sucursal de la factura

**Estimado**: 2-3 horas

### Prioridad Media

#### 5. Búsqueda de Cliente Mejorada
**Ubicación**: Frontend
- [ ] Reemplazar input de ID por búsqueda por nombre/identificación en `PaymentHistoryTab`
- [ ] Agregar autocompletado en todos los selectores de cliente
- [ ] Mostrar información adicional del cliente (teléfono, email) en resultados

**Estimado**: 3-4 horas

#### 6. Funcionalidad de Impresión
**Ubicación**: Frontend
- [ ] Botón "Imprimir Estado de Cuenta" en `AccountStatusTab`
- [ ] Generar PDF con estado de cuenta completo
- [ ] Incluir todas las facturas pendientes y pagadas
- [ ] Formato profesional con logo de empresa

**Estimado**: 4-5 horas

#### 7. Integración con CRM
**Ubicación**: Frontend y Backend
- [ ] Botón "Crear Tarea de Cobro" en `OverdueInvoicesTab`
- [ ] Modal/formulario para crear tarea asociada a cliente y factura
- [ ] Integración con API de CRM para crear tarea
- [ ] Tipo de tarea: "Seguimiento de cobro"

**Estimado**: 3-4 horas

#### 8. Envío por WhatsApp
**Ubicación**: Frontend
- [ ] Botón "Enviar Estado de Cuenta" en `AccountStatusTab`
- [ ] Generar mensaje pre-formateado con resumen
- [ ] Opción de enviar PDF adjunto
- [ ] Integración con API de WhatsApp (si existe)

**Estimado**: 3-4 horas

#### 9. Mejoras en Resumen
**Ubicación**: Frontend
- [ ] Agregar gráfico circular (pie chart) para distribución por antigüedad
- [ ] Tabla de "Top 10 Clientes por Saldo"
- [ ] Filtro por rango de fechas en resumen
- [ ] Exportar resumen a PDF/Excel

**Estimado**: 4-5 horas

### Prioridad Baja

#### 10. Validaciones Avanzadas
**Ubicación**: Backend
- [ ] Validar límite de crédito del cliente antes de permitir pagos
- [ ] Alertas cuando se excede límite de crédito
- [ ] Validar días de crédito del cliente

**Estimado**: 2-3 horas

#### 11. Notificaciones
**Ubicación**: Backend y Frontend
- [ ] Alertas cuando una factura está por vencer (X días antes)
- [ ] Notificaciones de facturas muy vencidas (+90 días)
- [ ] Recordatorios automáticos (futuro)

**Estimado**: 4-6 horas

#### 12. Reversión de Pagos
**Ubicación**: Backend y Frontend
- [ ] Endpoint para revertir un pago (solo con permiso especial)
- [ ] Modal de confirmación con motivo de reversión
- [ ] Registro de auditoría de reversión
- [ ] Actualización de balance y estado de facturas

**Estimado**: 4-5 horas

---

## 📊 Plan de Trabajo por Etapas

### Etapa 1: Corrección de Errores Críticos (Prioridad Alta)
**Tiempo estimado**: 8-10 horas

1. **Filtro por Sucursal** (4-6 horas)
   - Backend: Agregar `branchId` a todos los endpoints
   - Frontend: Agregar selector de sucursal en todos los componentes
   - Validaciones de acceso por sucursal

2. **Validaciones de Caja** (2-3 horas)
   - Validar caja abierta antes de pagos en efectivo
   - Registrar movimientos para todos los métodos
   - Validar sucursal de caja vs factura

3. **Navegación entre Tabs** (3-4 horas)
   - Implementar comunicación entre componentes
   - Botones "Cobrar", "Ver", "Ver Estado de Cuenta" funcionales

### Etapa 2: Integraciones Básicas (Prioridad Alta)
**Tiempo estimado**: 5-6 horas

1. **Integración con Ventas** (2-3 horas)
   - "Ver Factura" abre `InvoiceDetail`
   - Navegación bidireccional entre módulos

2. **Búsqueda de Cliente Mejorada** (3-4 horas)
   - Autocompletado en todos los selectores
   - Búsqueda por nombre/identificación en `PaymentHistoryTab`

### Etapa 3: Funcionalidades Adicionales (Prioridad Media)
**Tiempo estimado**: 14-18 horas

1. **Impresión de Estado de Cuenta** (4-5 horas)
   - Generar PDF con formato profesional
   - Incluir todas las facturas

2. **Integración con CRM** (3-4 horas)
   - Crear tarea de cobro desde facturas vencidas
   - Modal y formulario de tarea

3. **Envío por WhatsApp** (3-4 horas)
   - Generar mensaje pre-formateado
   - Opción de PDF adjunto

4. **Mejoras en Resumen** (4-5 horas)
   - Gráfico circular
   - Top 10 clientes
   - Exportación a PDF/Excel

### Etapa 4: Mejoras y Optimizaciones (Prioridad Baja)
**Tiempo estimado**: 10-14 horas

1. **Validaciones Avanzadas** (2-3 horas)
   - Límite de crédito
   - Días de crédito

2. **Notificaciones** (4-6 horas)
   - Alertas de facturas por vencer
   - Notificaciones de facturas muy vencidas

3. **Reversión de Pagos** (4-5 horas)
   - Endpoint y validaciones
   - UI de reversión con motivo

---

## 🔍 Verificación de Base de Datos

### Tablas Relacionadas
- ✅ `Invoice` - Facturas a crédito
- ✅ `Payment` - Pagos registrados
- ✅ `Client` - Clientes con crédito
- ✅ `CashMovement` - Movimientos de caja (pagos)
- ✅ `CashRegister` - Cajas abiertas

### Relaciones Verificadas
- ✅ `Payment.invoiceId` → `Invoice.id`
- ✅ `Payment.clientId` → `Client.id`
- ✅ `Invoice.clientId` → `Client.id`
- ✅ `CashMovement.paymentId` → `Payment.id`

### Índices Recomendados
- ✅ `Invoice.dueDate` (para búsquedas de vencidas)
- ✅ `Invoice.balance` (para filtros de pendientes)
- ✅ `Payment.paymentDate` (para historial)
- ⚠️ `Invoice.branchId` (verificar si existe índice)

---

## 📝 Notas de Implementación

### Consideraciones Técnicas

1. **Performance**
   - Los cálculos de días vencidos se hacen en el backend (correcto)
   - Las consultas usan índices apropiados
   - Paginación implementada en todos los listados

2. **Seguridad**
   - Permisos implementados en todas las rutas
   - Validación de usuario autenticado
   - Validación de datos de entrada (Zod)

3. **Consistencia de Datos**
   - Transacciones en `createPayment()` (correcto)
   - Actualización automática de balance y estado
   - Registro de movimientos en caja

### Mejoras Futuras

1. **Caché**
   - Cachear resumen de CxC (actualizar cada X minutos)
   - Cachear lista de clientes con crédito

2. **Reportes Avanzados**
   - Reporte de morosidad por sucursal
   - Análisis de tendencias de cobro
   - Proyección de cobros

3. **Automatización**
   - Recordatorios automáticos por WhatsApp
   - Alertas por email
   - Tareas automáticas para facturas muy vencidas

---

## ✅ Checklist de Verificación

### Backend
- [x] Endpoints implementados
- [x] Validaciones básicas
- [x] Reglas de negocio
- [ ] Filtro por sucursal completo
- [ ] Validaciones de caja mejoradas
- [ ] Integración con CRM (endpoint de tareas)

### Frontend
- [x] Componentes principales creados
- [x] Navegación por tabs
- [x] Formularios básicos
- [ ] Filtro por sucursal
- [ ] Navegación entre tabs funcional
- [ ] Integración con módulo de ventas
- [ ] Búsqueda de cliente mejorada
- [ ] Impresión de estado de cuenta
- [ ] Integración con CRM
- [ ] Envío por WhatsApp

### Base de Datos
- [x] Tablas relacionadas
- [x] Relaciones correctas
- [ ] Índices verificados
- [ ] Datos de prueba

---

**Última actualización**: Enero 2025
**Estado**: Análisis completo - Listo para implementación por etapas











