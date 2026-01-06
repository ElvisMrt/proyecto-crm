# Flujos Principales del Sistema

Este documento describe los flujos de negocio más importantes del sistema.

---

## 🔄 Flujo 1: Venta Completa (Contado)

### Descripción
Proceso completo desde la creación de una venta hasta su impacto en inventario y caja.

### Actores
- Usuario: Operador, Cajero o Supervisor

### Pasos

1. **Apertura de Caja (si no está abierta)**
   - Usuario verifica si hay caja abierta
   - Si no hay, abre caja con monto inicial
   - Sistema registra apertura

2. **Crear Venta (Módulo Ventas)**
   - Usuario crea nueva venta (POS o Factura)
   - Selecciona cliente (opcional si es POS)
   - Busca y agrega productos
   - Sistema valida:
     - Stock disponible (si aplica)
     - Precios
   - Usuario ingresa cantidades y descuentos

3. **Definir Método de Pago**
   - Usuario selecciona: Contado
   - Método: Efectivo, Transferencia o Tarjeta

4. **Emitir Factura**
   - Usuario confirma y emite
   - Sistema ejecuta:
     - Genera NCF (si es fiscal)
     - Reduce stock (si aplica)
     - Crea registro de factura
     - Registra movimiento en Caja (ingreso)
     - Actualiza dashboard

5. **Cierre**
   - Opcional: Imprimir ticket/factura
   - Opcional: Enviar por WhatsApp
   - Venta completa

### Integraciones
- ✅ Ventas → Inventario (reduce stock)
- ✅ Ventas → Caja (registra ingreso)
- ✅ Ventas → Dashboard (actualiza KPIs)

---

## 🔄 Flujo 2: Venta a Crédito

### Descripción
Proceso de venta con pago diferido, creando cuenta por cobrar.

### Actores
- Usuario: Operador, Supervisor o Administrador

### Pasos

1. **Crear Factura a Crédito**
   - Usuario crea factura
   - Selecciona cliente (obligatorio)
   - Agrega productos
   - Define fecha de vencimiento
   - Método de pago: Crédito

2. **Emitir Factura**
   - Usuario emite
   - Sistema ejecuta:
     - Genera NCF (si es fiscal)
     - Reduce stock (si aplica)
     - Crea registro de factura
     - Crea Cuenta por Cobrar
     - NO afecta Caja (no hay ingreso inmediato)
     - Actualiza dashboard

3. **Posterior: Registro de Pago (Módulo CxC)**
   - Cuando el cliente paga:
   - Usuario registra pago
   - Sistema ejecuta:
     - Actualiza balance de factura
     - Registra ingreso en Caja
     - Si pago completo: marca factura como "Pagada"
     - Actualiza dashboard

### Integraciones
- ✅ Ventas → Inventario (reduce stock)
- ✅ Ventas → CxC (crea cuenta por cobrar)
- ✅ CxC → Caja (registra ingreso al pagar)
- ✅ Ventas → Dashboard (actualiza KPIs)

---

## 🔄 Flujo 3: Anulación de Factura

### Descripción
Proceso de anulación de una factura emitida, restaurando stock y eliminando cuenta por cobrar.

### Actores
- Usuario: Supervisor o Administrador (con permisos)

### Pasos

1. **Seleccionar Factura**
   - Usuario busca y selecciona factura a anular
   - Verifica que no esté pagada parcialmente (si lo está, usar Nota de Crédito)

2. **Anular Factura**
   - Usuario selecciona acción "Anular"
   - Ingresa motivo (obligatorio)
   - Confirma anulación

3. **Impacto del Sistema**
   - Sistema ejecuta:
     - Restaura stock (si aplica)
     - Elimina cuenta por cobrar (si era crédito)
     - Revierte movimiento en Caja (si era contado)
     - Marca factura como "Anulada"
     - Genera registro de anulación (auditable)
     - Actualiza dashboard

4. **NCF (si aplica)**
   - Si era factura fiscal:
     - NCF se marca como anulado
     - Se genera reporte de anulación (fiscal)

### Integraciones
- ✅ Ventas → Inventario (restaura stock)
- ✅ Ventas → CxC (elimina cuenta)
- ✅ Ventas → Caja (revierte ingreso)
- ✅ Ventas → Dashboard (actualiza KPIs)

---

## 🔄 Flujo 4: Cotización → Factura

### Descripción
Proceso de convertir una cotización en factura.

### Actores
- Usuario: Operador, Supervisor

### Pasos

1. **Crear Cotización**
   - Usuario crea cotización
   - Agrega cliente y productos
   - NO requiere: NCF, stock, caja abierta
   - Guarda y envía a cliente

2. **Cliente Acepta**
   - Cliente acepta cotización (proceso externo)

3. **Convertir a Factura**
   - Usuario selecciona cotización
   - Acción "Convertir a Factura"
   - Sistema pre-llena formulario de factura

4. **Ajustar y Emitir**
   - Usuario puede ajustar:
     - Cantidades
     - Precios
     - Descuentos
   - Usuario emite factura
   - Sistema ejecuta:
     - Genera factura (normal)
     - Marca cotización como "Convertida"
     - Impacta inventario, caja, CxC según corresponda

### Integraciones
- ✅ Ventas (Cotización) → Ventas (Factura)
- ✅ Ventas → Inventario (reduce stock)
- ✅ Ventas → Caja o CxC (según método de pago)

---

## 🔄 Flujo 5: Registro de Pago de Cuenta por Cobrar

### Descripción
Proceso de registrar un pago parcial o total de una factura a crédito.

### Actores
- Usuario: Operador, Cajero, Supervisor

### Pasos

1. **Seleccionar Cliente**
   - Usuario busca cliente
   - O viene desde Estado de Cuenta del cliente

2. **Seleccionar Factura(s)**
   - Usuario ve facturas pendientes del cliente
   - Selecciona factura(s) a pagar

3. **Registrar Pago**
   - Usuario ingresa:
     - Monto a pagar
     - Método de pago
     - Referencia (opcional)
     - Observaciones (opcional)
   - Si múltiples facturas, distribuye pago

4. **Confirmar Pago**
   - Usuario confirma
   - Sistema ejecuta:
     - Actualiza balance de factura(s)
     - Si pago completo: marca como "Pagada"
     - Registra ingreso en Caja
     - Genera registro de pago (auditable)
     - Actualiza dashboard

### Integraciones
- ✅ CxC → Caja (registra ingreso)
- ✅ CxC → Dashboard (actualiza KPIs)

---

## 🔄 Flujo 6: Ajuste de Inventario

### Descripción
Proceso de corregir diferencias físicas en el inventario.

### Actores
- Usuario: Supervisor o Administrador (con permisos)

### Pasos

1. **Detectar Diferencia**
   - Usuario realiza conteo físico
   - Compara con stock del sistema
   - Identifica diferencias

2. **Crear Ajuste**
   - Usuario crea ajuste de inventario
   - Selecciona tipo: Entrada (sobrante) o Salida (faltante)
   - Selecciona motivo (obligatorio)

3. **Agregar Productos**
   - Usuario agrega productos a ajustar
   - Ingresa cantidades
   - Sistema muestra nuevo stock calculado

4. **Aplicar Ajuste**
   - Usuario confirma
   - Sistema ejecuta:
     - Actualiza stock inmediatamente
     - Genera movimiento en kardex
     - Registra ajuste (auditable)
     - Actualiza alertas de stock (si aplica)

### Integraciones
- ✅ Inventario → Kardex (genera movimiento)
- ✅ Inventario → Dashboard (actualiza alertas)

---

## 🔄 Flujo 7: Apertura y Cierre de Caja

### Descripción
Proceso completo de apertura y cierre de caja diario.

### Actores
- Usuario: Cajero (abrir), Supervisor o Administrador (cerrar)

### Pasos

#### Apertura

1. **Verificar Estado**
   - Usuario verifica que no haya caja abierta

2. **Abrir Caja**
   - Usuario abre caja
   - Ingresa monto inicial
   - Opcional: Observaciones
   - Confirma apertura
   - Sistema registra apertura

#### Durante el Día

3. **Operaciones Normales**
   - Ventas al contado → Registro automático
   - Pagos de CxC → Registro automático
   - Salidas manuales → Registro manual (si tiene permiso)

#### Cierre

4. **Cerrar Caja**
   - Usuario selecciona "Cerrar Caja"
   - Sistema muestra:
     - Resumen de movimientos
     - Balance esperado
   - Usuario realiza conteo físico
   - Ingresa efectivo contado
   - Sistema calcula diferencia
   - Usuario agrega observaciones (si hay diferencia)
   - Usuario confirma cierre

5. **Post-Cierre**
   - Sistema marca caja como "Cerrada"
   - Genera comprobante de cierre
   - No se pueden registrar más movimientos hasta nueva apertura

### Integraciones
- ✅ Caja → Ventas (valida caja abierta)
- ✅ Ventas → Caja (registra ingresos)
- ✅ CxC → Caja (registra pagos)
- ✅ Caja → Dashboard (muestra estado)

---

## 🔄 Flujo 8: Alerta de Stock Bajo → Reorden

### Descripción
Proceso de detectar y gestionar productos bajo stock mínimo.

### Actores
- Sistema (automático) y Usuario

### Pasos

1. **Detección Automática**
   - Sistema calcula stock vs stock mínimo
   - Detecta productos bajo mínimo
   - Genera alerta

2. **Visualización de Alerta**
   - Alerta aparece en Dashboard
   - Alerta aparece en módulo Inventario
   - Usuario ve listado de productos afectados

3. **Acción Correctiva**
   - Usuario puede:
     - Crear tarea de reorden (CRM)
     - Ver historial de movimientos
     - Verificar último pedido

4. **Seguimiento**
   - Cuando llega producto nuevo
   - Usuario ajusta stock (entrada)
   - Alerta desaparece automáticamente

### Integraciones
- ✅ Inventario → Dashboard (muestra alertas)
- ✅ Inventario → CRM (crea tarea de reorden)

---

## 📊 Diagrama de Flujo General: Venta Completa

```
┌─────────────┐
│ Abrir Caja  │ (si no está abierta)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Crear Venta │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│ Validar     │─────▶│ ¿Hay Stock?  │
│ Stock       │      └──────┬───────┘
└─────────────┘             │
                            │ Sí
                            ▼
                   ┌────────────────┐
                   │ Seleccionar    │
                   │ Método de Pago │
                   └────────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      ┌──────────────┐          ┌──────────────┐
      │   Contado    │          │   Crédito    │
      └──────┬───────┘          └──────┬───────┘
             │                         │
             ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │ Emitir       │          │ Emitir       │
      │ Factura      │          │ Factura      │
      └──────┬───────┘          └──────┬───────┘
             │                         │
             ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │ Reducir Stock│          │ Reducir Stock│
      │ + Registrar  │          │ + Crear CxC  │
      │ Ingreso Caja │          └──────────────┘
      └──────────────┘
```

---

## 📝 Notas de Implementación

1. **Transacciones:**
   - Todos los flujos que modifican múltiples módulos deben ejecutarse dentro de transacciones de base de datos
   - Si falla algún paso, se revierte todo (rollback)

2. **Validaciones:**
   - Validar permisos antes de ejecutar acciones
   - Validar estado de módulos relacionados (ej: caja abierta)

3. **Auditoría:**
   - Registrar todas las acciones críticas
   - Mantener trazabilidad completa

4. **Notificaciones (Fase futura):**
   - Notificar a supervisores de acciones críticas
   - Alertas automáticas por email o WhatsApp

---

**Última actualización:** [Fecha]



