# Módulo: Cuentas por Cobrar (CxC)

## 🎯 Objetivo del Módulo

Controlar todas las ventas a crédito, permitiendo:
- Saber **quién debe**
- Saber **cuánto debe**
- Saber **desde cuándo**
- Registrar **pagos parciales o totales**
- Reducir **morosidad**
- Tener **trazabilidad completa**

Este módulo responde a: *"¿Quién me debe dinero y cuánto?"*

---

## 🧩 Submódulos de Cuentas por Cobrar

El módulo CxC se divide internamente en:

1. **Estado de Cuenta**
2. **Registro de Pagos**
3. **Facturas Vencidas**
4. **Historial de Pagos**
5. **Resumen de CxC**

---

## 3.1 📄 ESTADO DE CUENTA

### Objetivo
Ver el detalle financiero completo de un cliente específico.

### Funcionalidades

#### Vista de Estado de Cuenta

**Información del Cliente:**
- Nombre completo
- Identificación (RNC/Cédula)
- Contacto (teléfono, email)
- Límite de crédito (si aplica)
- Días de crédito estándar

**Resumen General:**
- **Total por cobrar:** RD$ XX,XXX
- **Total vencido:** RD$ XX,XXX
- **Días promedio de mora:** X días

**Tabla de Facturas:**
Columnas:
- **Nro. Factura:** Número interno
- **NCF:** Número de comprobante fiscal
- **Fecha Emisión:** Fecha de creación
- **Fecha Vencimiento:** Fecha límite de pago
- **Total:** Monto total de la factura
- **Pagado:** Monto ya pagado
- **Balance Pendiente:** Saldo pendiente
- **Días Vencidos:** Días transcurridos desde vencimiento (si aplica)
- **Estado:** Badge (Pendiente, Vencida, Pagada)
- **Acciones:** Ver factura, Registrar pago

**Totales:**
- Total facturado
- Total pagado
- **Balance pendiente** (destacado)

#### Acciones Disponibles

1. **Ver Factura** 👁️
   - Ver detalle completo de la factura
   - Imprimir factura

2. **Registrar Pago** 💵
   - Modal o página para registrar pago
   - Ver flujo en sección 3.2

3. **Imprimir Estado de Cuenta** 🖨️
   - Genera PDF con estado de cuenta
   - Incluye todas las facturas pendientes

4. **Enviar por WhatsApp** 💬
   - Envía estado de cuenta por WhatsApp
   - Formato: PDF o imagen

### Reglas de Negocio

1. **No se edita la factura**
   - Solo se visualiza y se registran pagos

2. **Se mantiene histórico completo**
   - Todas las facturas aparecen, incluso las pagadas (con estado "Pagada")

3. **Cálculo automático:**
   - Días vencidos se calculan automáticamente
   - Estado se actualiza según balance

---

## 3.2 💵 REGISTRO DE PAGOS

### Objetivo
Registrar abonos o pagos completos de facturas pendientes.

### Funcionalidades

#### Formulario de Registro de Pago

**Selección de Cliente:**
- Buscador de cliente
- Si se viene desde Estado de Cuenta, cliente ya pre-seleccionado

**Facturas Pendientes:**
- Tabla con facturas del cliente que tienen balance pendiente
- Checkbox para seleccionar factura(s)
- Columnas:
  - Factura
  - Vencimiento
  - Balance pendiente
  - Seleccionar

**Información del Pago:**
- **Fecha de pago:** (default: hoy)
- **Monto a pagar:** (máximo: balance pendiente de facturas seleccionadas)
- **Método de pago:**
  - Efectivo
  - Transferencia
  - Cheque
  - Tarjeta
  - Otro
- **Referencia:** Número de transacción, cheque, etc. (opcional)
- **Observaciones:** Campo de texto opcional

**Distribución del Pago:**
- Si se seleccionaron múltiples facturas, permite distribuir el pago:
  - Automático (proporcional o por antigüedad)
  - Manual (usuario asigna montos)

**Totales:**
- Monto total del pago
- Facturas a aplicar
- Balance restante después del pago

**Acciones:**
- **Registrar Pago:** Confirma y registra
- **Cancelar:** Cierra sin guardar

### Reglas de Negocio

1. **Pagos Parciales Permitidos**
   - Puede pagar menos del balance total
   - El balance se actualiza automáticamente

2. **Impacto Automático:**
   - ✅ Balance del cliente se reduce
   - ✅ Estado de factura se actualiza (a "Pagada" si balance = 0)
   - ✅ Caja registra ingreso (si método es efectivo/transferencia)
   - ✅ Genera registro de pago (auditable)

3. **Validaciones:**
   - Monto no puede exceder balance pendiente
   - Al menos una factura debe estar seleccionada
   - Fecha de pago no puede ser futura (o requiere permiso especial)

4. **No se elimina un pago registrado**
   - Solo se puede revertir con permiso especial
   - La reversión genera registro de auditoría

5. **Múltiples Métodos de Pago:**
   - Si el pago es "mixto" (ej: RD$ 5,000 efectivo + RD$ 3,000 transferencia)
   - Se registran como dos pagos separados o un pago con distribución

---

## 3.3 ⏰ FACTURAS VENCIDAS

### Objetivo
Detectar riesgo de morosidad y facilitar acciones de cobro.

### Funcionalidades

#### Vista de Facturas Vencidas

**Filtros:**
- **Sucursal:** Filtrar por sucursal
- **Rango de días vencidos:**
  - 0-30 días
  - 31-60 días
  - 61-90 días
  - +90 días
- **Cliente:** Buscar por cliente específico

**Tabla de Facturas Vencidas:**
Columnas:
- **Cliente:** Nombre del cliente
- **Nro. Factura:** Número de factura
- **Vencimiento:** Fecha de vencimiento
- **Días Vencida:** Días transcurridos desde vencimiento (con badge de color según antigüedad)
  - 0-30: Amarillo
  - 31-60: Naranja
  - 61-90: Rojo claro
  - +90: Rojo oscuro
- **Balance Pendiente:** Monto adeudado
- **Acciones:** Botones rápidos

**Resumen por Antigüedad:**
- Cards con totales por rango de días:
  - 0-30 días: RD$ XX,XXX
  - 31-60 días: RD$ XX,XXX
  - 61-90 días: RD$ XX,XXX
  - +90 días: RD$ XX,XXX

#### Acciones Rápidas

Por cada factura vencida:

1. **Cobrar** ✅
   - Botón azul/verde
   - Abre modal/página de registro de pago
   - Factura pre-seleccionada

2. **Tarea de Cobro** 📋
   - Botón naranja
   - Crea tarea en módulo CRM
   - Asociada al cliente y factura
   - Tipo: "Seguimiento de cobro"

3. **Enviar Recordatorio** 💬
   - Botón verde
   - Envía mensaje por WhatsApp
   - Mensaje pre-configurado con detalles de factura

4. **Ver Estado de Cuenta** 👁️
   - Ver estado completo del cliente

### Reglas de Negocio

1. **Cálculo Automático**
   - Se calcula automáticamente comparando fecha de vencimiento con fecha actual
   - No es editable manualmente

2. **Vista Crítica**
   - Acceso prioritario para supervisores
   - Alertas en dashboard si hay facturas muy vencidas

3. **Actualización en Tiempo Real**
   - Al registrar un pago, la factura desaparece de esta vista si se paga completamente

---

## 3.4 🧾 HISTORIAL DE PAGOS

### Objetivo
Auditoría y trazabilidad completa de todos los pagos registrados.

### Funcionalidades

#### Vista de Historial

**Filtros:**
- Por cliente
- Por rango de fechas
- Por método de pago
- Por factura específica
- Por usuario que registró

**Tabla de Pagos:**
Columnas:
- **Fecha:** Fecha y hora del pago
- **Cliente:** Nombre del cliente
- **Factura:** Número de factura asociada
- **Monto:** RD$ XX,XXX
- **Método:** Efectivo, Transferencia, etc.
- **Referencia:** Número de transacción/cheque
- **Usuario:** Usuario que registró el pago
- **Observaciones:** Notas adicionales
- **Acciones:** Ver detalle (si aplica)

**Totales:**
- Total pagado en el período seleccionado

### Reglas de Negocio

1. **Solo Lectura**
   - No se puede editar ni eliminar
   - Solo se puede revertir con permiso especial (genera registro de reversión)

2. **Auditoría Completa**
   - Todo pago queda registrado con:
     - Usuario
     - Fecha y hora exacta
     - Método
     - Facturas aplicadas

---

## 3.5 📊 RESUMEN DE CxC

### Objetivo
Vista ejecutiva del crédito otorgado a clientes.

### Funcionalidades

#### Vista de Resumen

**KPIs Principales:**
1. **Total por Cobrar**
   - RD$ XX,XXX
   - Icono: 💰 (verde)

2. **Total Vencido**
   - RD$ XX,XXX
   - Icono: ⚠️ (rojo)
   - Porcentaje del total por cobrar

3. **Clientes Morosos**
   - Número de clientes con facturas vencidas
   - Icono: 👥 (morado)

4. **Vencidas de 0-30 Días**
   - RD$ XX,XXX
   - Dropdown para ver otras categorías (31-60, 61-90, +90)

**Gráfico de Antigüedad:**
- Gráfico de barras o circular
- Distribución de saldos por antigüedad:
  - Al día (no vencidas)
  - 0-30 días
  - 31-60 días
  - 61-90 días
  - +90 días

**Top Clientes por Saldo:**
- Tabla con los 10 clientes con mayor saldo pendiente
- Columnas:
  - Cliente
  - Total pendiente
  - Total vencido
  - Días de mora promedio

### Reglas de Negocio

1. **Cálculo Automático**
   - Todos los valores se calculan en tiempo real
   - Filtrable por sucursal y fecha

2. **Exportación (Fase futura)**
   - Exportar resumen como PDF o Excel

---

## 🔐 Roles y Permisos

### Permisos por Acción

| Acción | Administrador | Supervisor | Operador/Cajero |
|--------|--------------|------------|-----------------|
| Ver CxC | ✅ | ✅ | ✅* |
| Ver estado de cuenta | ✅ | ✅ | ✅* |
| Registrar pagos | ✅ | ✅ | ✅ |
| Ver facturas vencidas | ✅ | ✅ | ❌ |
| Ver historial de pagos | ✅ | ✅ | ❌ |
| Ver resumen de CxC | ✅ | ✅ | ❌ |
| Enviar recordatorios | ✅ | ✅ | ❌ |
| Crear tarea de cobro | ✅ | ✅ | ❌ |

*Solo para clientes asignados o bajo su responsabilidad

**Regla:** Los permisos se asignan al **rol**, no al usuario individual.

---

## 🔗 Relación con Otros Módulos

### CxC se conecta con:

- **Ventas:** Para leer facturas a crédito
- **Caja:** Para registrar ingreso de pagos (cuando se cobra)
- **Clientes:** Para datos del cliente
- **CRM:** Para crear tareas de seguimiento de cobro
- **Reportes:** Para reportes de morosidad y cobranza

### ❌ Qué NO debe hacer CxC:

- ❌ Crear ventas (eso es Ventas)
- ❌ Editar facturas (eso es Ventas, solo anulación)
- ❌ Generar NCF (eso es Ventas)
- ❌ Manejar usuarios (eso es Configuración)

---

## 📊 Flujos Principales

### Flujo 1: Registro de Pago Total
```
1. Usuario selecciona cliente (o viene desde Estado de Cuenta)
2. Selecciona factura(s) a pagar
3. Ingresa monto (igual al balance)
4. Selecciona método de pago
5. Registra pago
   → Balance de factura(s) = 0
   → Estado cambia a "Pagada"
   → Se registra ingreso en Caja
   → Se genera registro de pago
```

### Flujo 2: Registro de Pago Parcial
```
1. Usuario selecciona cliente
2. Selecciona factura
3. Ingresa monto (menor al balance)
4. Selecciona método de pago
5. Registra pago
   → Balance de factura se reduce
   → Estado permanece "Pendiente" o "Vencida"
   → Se registra ingreso en Caja
   → Se genera registro de pago
```

### Flujo 3: Seguimiento de Factura Vencida
```
1. Supervisor ve factura vencida en listado
2. Crea tarea de cobro (CRM)
   → Tarea asociada a cliente y factura
   → Asignada a vendedor o cobrador
3. Envía recordatorio por WhatsApp
4. Cuando se registra pago, la tarea se puede marcar como completada
```

---

## 📝 Notas de Implementación

1. **Performance:**
   - Índices en base de datos para búsquedas por cliente y fecha de vencimiento
   - Cálculo de días vencidos en query (no en aplicación)

2. **Notificaciones (Fase futura):**
   - Alertas automáticas cuando una factura está por vencer
   - Notificaciones de facturas muy vencidas

3. **Integración con CRM:**
   - Creación automática de tareas cuando una factura pasa cierto número de días vencida

4. **Reversión de Pagos:**
   - Solo con permiso especial
   - Requiere motivo
   - Genera registro de auditoría

---

**Módulo relacionado:** Integrado con Ventas, Caja, Clientes y CRM.



