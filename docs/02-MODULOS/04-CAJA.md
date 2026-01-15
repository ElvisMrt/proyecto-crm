# Módulo: Caja

## 🎯 Objetivo del Módulo

Controlar el flujo diario de dinero del negocio de forma:
- **Clara**
- **Simple**
- **Auditable**

Este módulo responde a: *"¿Cuánto dinero entró hoy, cuánto salió y cuánto debería haber en caja?"*

📌 **Importante:** Este módulo NO es contabilidad, es **control operativo diario**.

---

## 🧩 Submódulos de Caja

El módulo Caja se divide internamente en:

1. **Apertura de Caja**
2. **Movimientos de Caja**
3. **Cierre de Caja**
4. **Historial de Cajas**
5. **Resumen Diario de Caja**

---

## 4.1 🔓 APERTURA DE CAJA

### Objetivo
Iniciar formalmente una jornada de ventas.

### Funcionalidades

#### Formulario de Apertura

**Información General:**
- **Sucursal:** Selector (si hay múltiples sucursales)
- **Usuario responsable:** Pre-llenado con usuario actual (no editable)
- **Fecha y hora:** Auto-generado (no editable)

**Monto Inicial:**
- Campo numérico obligatorio
- Formato: RD$ XX,XXX.XX
- **Validación:** Debe ser >= 0

**Observaciones:**
- Campo de texto opcional
- Ejemplos: "Fondo de caja del día anterior", "Apertura nueva sucursal"

**Acciones:**
- **Abrir Caja:** Confirma apertura
- **Cancelar:** Cierra sin guardar

#### Vista de Estado de Apertura

Si hay una caja abierta, mostrar:
- **Estado:** "Abierta" (badge verde)
- **Desde:** Fecha y hora de apertura
- **Responsable:** Usuario que abrió
- **Monto inicial:** RD$ XX,XXX
- **Balance actual:** RD$ XX,XXX (calculado)

### Reglas de Negocio

1. **Solo puede haber una caja abierta por sucursal**
   - Validar antes de permitir apertura
   - Mensaje: "Ya existe una caja abierta para esta sucursal"

2. **No se pueden registrar ventas sin caja abierta**
   - Validar en módulo Ventas antes de permitir venta
   - Mensaje: "Debe abrir caja antes de realizar ventas"

3. **La apertura queda registrada y auditada**
   - Usuario, fecha y hora
   - Monto inicial
   - No se puede editar después de crear

4. **Permisos:**
   - Solo usuarios con permiso "Abrir caja" pueden abrir
   - Normalmente: Administrador, Supervisor, Cajero

---

## 4.2 🔄 MOVIMIENTOS DE CAJA

### Objetivo
Registrar entradas y salidas durante el día.

### Funcionalidades

#### Vista de Movimientos

**Filtros:**
- Por fecha (default: hoy)
- Por tipo (Entrada, Salida, Todos)
- Por usuario
- Por método de pago

**Tabla de Movimientos:**
Columnas:
- **Fecha:** Fecha y hora
- **Tipo:** Badge con icono y texto
  - **L Apertura:** Apertura (morado)
  - **Pago:** Pago recibido (verde)
  - **D Venta:** Venta al contado (azul)
  - **U Salida:** Salida manual (rojo)
  - **DI Cierre:** Cierre (gris)
- **Detalle:** Descripción del movimiento
- **Monto:** 
  - Positivo para entradas (verde)
  - Negativo para salidas (rojo)
- **Usuario:** Usuario que registró o ejecutó

**Totales:**
- Total Ingresos
- Total Egresos
- **Balance en Caja** (destacado)

#### Registro Manual de Movimientos

**Registrar Entrada:**
- Formulario:
  - **Concepto:** (obligatorio)
  - **Monto:** (obligatorio, > 0)
  - **Método:** Efectivo, Transferencia, Tarjeta
  - **Observaciones:** (opcional)
- Ejemplos: "Pago adicional", "Reembolso"

**Registrar Salida:**
- Formulario:
  - **Concepto:** (obligatorio)
  - **Monto:** (obligatorio, > 0)
  - **Método:** Efectivo, Transferencia
  - **Motivo:** Selector o texto (obligatorio)
    - Gastos menores
    - Retiro autorizado
    - Pago a proveedor
    - Otro
  - **Observaciones:** (opcional)
- Ejemplos: "Gastos menores - Almuerzo", "Retiro efectivo"

### Reglas de Negocio

1. **Movimientos Automáticos:**
   - Se registran automáticamente:
     - **Ventas:** Cuando se emite una factura al contado
     - **Pagos de CxC:** Cuando se registra un pago
     - **Apertura:** Al abrir caja
     - **Cierre:** Al cerrar caja
   - No requieren acción manual

2. **Movimientos Manuales:**
   - Requieren permiso específico
   - Deben tener:
     - Tipo (Entrada/Salida)
     - Monto
     - Motivo/Concepto
     - Usuario
   - Quedan auditados

3. **Validaciones:**
   - No se puede registrar salida mayor al balance disponible (si es efectivo)
   - Fecha no puede ser futura (o requiere permiso)

4. **Tipos de Movimiento:**
   - **L (Apertura):** Apertura de caja
   - **Pago:** Pago recibido (de CxC)
   - **D (Venta):** Venta directa
   - **U (Salida):** Salida manual
   - **DI (Cierre):** Cierre de caja

---

## 4.3 🔒 CIERRE DE CAJA

### Objetivo
Cerrar la jornada y validar el efectivo físico.

### Funcionalidades

#### Formulario de Cierre

**Resumen Automático:**
- **Monto inicial:** RD$ XX,XXX
- **Total ingresos:** RD$ XX,XXX (desglosado)
  - Por ventas
  - Por pagos
  - Por entradas manuales
- **Total egresos:** RD$ XX,XXX (desglosado)
  - Por salidas manuales
- **Balance esperado:** RD$ XX,XXX (calculado)
  - Monto inicial + Ingresos - Egresos

**Conteo Físico:**
- **Efectivo contado:** Campo numérico obligatorio
- **Formato:** RD$ XX,XXX.XX
- **Diferencia:** Calculado automáticamente
  - Positiva: Sobra dinero
  - Negativa: Falta dinero
  - Cero: Cuadra perfectamente

**Métodos de Pago (Opcional, si se lleva detalle):**
- Efectivo: RD$ XX,XXX
- Transferencias: RD$ XX,XXX
- Tarjetas: RD$ XX,XXX

**Observaciones:**
- Campo de texto opcional
- Ejemplos: "Faltante por cambio", "Sobrante por propina no registrada"

**Confirmación:**
- Checkbox: "Confirmo que el conteo es correcto"
- Botón: **CERRAR CAJA** (grande, destacado)

#### Después del Cierre

- Mensaje de confirmación
- Resumen impreso o descargable (PDF)
- Opción de imprimir comprobante de cierre

### Reglas de Negocio

1. **Una caja cerrada no se puede modificar**
   - No se pueden agregar/editar movimientos después del cierre
   - Solo lectura

2. **Las diferencias quedan registradas**
   - Se guarda la diferencia (sobrante o faltante)
   - Queda auditado

3. **Requiere permiso de cierre**
   - Normalmente: Administrador, Supervisor

4. **Validaciones:**
   - Debe haber una caja abierta para cerrarla
   - El conteo físico es obligatorio
   - No se puede cerrar con fecha futura

5. **Después del cierre:**
   - No se pueden registrar más ventas hasta nueva apertura
   - Todos los movimientos quedan bloqueados

---

## 4.4 🗂️ HISTORIAL DE CAJAS

### Objetivo
Auditoría y control histórico de todas las operaciones de caja.

### Funcionalidades

#### Vista de Historial

**Filtros:**
- Por sucursal
- Por rango de fechas
- Por usuario responsable
- Por estado (Abierta, Cerrada, Todas)

**Tabla de Cajas:**
Columnas:
- **Fecha:** Fecha de apertura
- **Sucursal:** Nombre de sucursal
- **Responsable:** Usuario que abrió
- **Monto inicial:** RD$ XX,XXX
- **Total ingresos:** RD$ XX,XXX
- **Total egresos:** RD$ XX,XXX
- **Balance final:** RD$ XX,XXX
- **Diferencia:** RD$ XX,XXX (con badge de color)
  - Verde: Sin diferencia
  - Amarillo: Pequeña diferencia (0.01 - 100)
  - Rojo: Gran diferencia (> 100)
- **Estado:** Badge (Abierta / Cerrada)
- **Acciones:** Ver detalle

#### Vista de Detalle

Al hacer click en una caja:
- Ver todos los movimientos de esa caja
- Exportar a PDF o Excel
- Imprimir resumen

### Reglas de Negocio

1. **Solo lectura**
   - No se pueden editar cajas cerradas
   - Solo se puede consultar

2. **Filtrado por permisos:**
   - Un cajero solo ve sus propias cajas (si aplica)
   - Supervisor ve todas las cajas de su sucursal
   - Administrador ve todas las cajas

---

## 4.5 📊 RESUMEN DIARIO DE CAJA

### Objetivo
Vista rápida para supervisión diaria.

### Funcionalidades

#### Vista de Resumen

**KPIs del Día:**
- **Total ingresos:** RD$ XX,XXX
- **Total egresos:** RD$ XX,XXX
- **Balance final:** RD$ XX,XXX
- **Estado:** Badge (Cuadrada / Con diferencia)

**Comparación con días anteriores:**
- Gráfico de líneas o barras
- Últimos 7 días
- Comparación de ingresos y egresos

**Movimientos más frecuentes:**
- Top 5 conceptos de entrada
- Top 5 conceptos de salida

**Alertas:**
- Diferencias frecuentes
- Cajas sin cerrar de días anteriores

### Reglas de Negocio

1. **Solo lectura**
2. **Actualización automática** cuando hay movimiento

---

## 🔐 Roles y Permisos

### Permisos por Acción

| Acción | Administrador | Supervisor | Operador/Cajero |
|--------|--------------|------------|-----------------|
| Abrir caja | ✅ | ✅ | ✅ |
| Ver movimientos | ✅ | ✅ | ✅ |
| Registrar entrada manual | ✅ | ✅ | ✅* |
| Registrar salida manual | ✅ | ✅ | ❌ |
| Cerrar caja | ✅ | ✅ | ❌ |
| Ver historial | ✅ | ✅ | ❌* |
| Ver diferencias | ✅ | ✅ | ❌ |

*Puede tener permiso específico si se configura

**Regla:** Los permisos se asignan al **rol**, no al usuario individual.

---

## 🔗 Relación con Otros Módulos

### Caja se conecta con:

- **Ventas:** Para registrar ingresos automáticos de ventas al contado
- **Cuentas por Cobrar:** Para registrar ingresos de pagos
- **Reportes:** Para reportes de flujo de caja
- **Configuración:** Para parámetros de caja (métodos de pago, etc.)

### ❌ Qué NO debe hacer Caja:

- ❌ Crear ventas (eso es Ventas)
- ❌ Gestionar clientes (eso es Clientes)
- ❌ Manejar inventario (eso es Inventario)
- ❌ Sustituir contabilidad (solo control operativo)

---

## 📊 Flujos Principales

### Flujo 1: Apertura y Operación Normal
```
1. Usuario abre caja (monto inicial)
   → Caja queda "Abierta"
   → Se registra movimiento de apertura

2. Durante el día:
   - Ventas al contado → Registro automático
   - Pagos de CxC → Registro automático
   - Salidas manuales → Registro manual (si tiene permiso)

3. Al final del día:
   - Usuario cierra caja
   - Ingresa conteo físico
   - Sistema calcula diferencia
   - Usuario confirma y cierra
   → Caja queda "Cerrada"
   → No se pueden registrar más movimientos
```

### Flujo 2: Registro de Salida Manual
```
1. Usuario con permiso selecciona "Registrar Salida"
2. Ingresa concepto y monto
3. Selecciona motivo (ej: "Gastos menores")
4. Agrega observaciones
5. Confirma
   → Se registra movimiento
   → Balance de caja se reduce
   → Queda auditado
```

### Flujo 3: Cierre con Diferencia
```
1. Usuario cierra caja
2. Sistema muestra balance esperado: RD$ 10,000
3. Usuario ingresa conteo físico: RD$ 9,950
4. Sistema calcula diferencia: -RD$ 50 (faltante)
5. Usuario agrega observación: "Faltante por cambio no registrado"
6. Usuario confirma cierre
   → Caja se cierra
   → Diferencia queda registrada
   → Supervisor puede revisar después
```

---

## 📝 Notas de Implementación

1. **Performance:**
   - Índices en base de datos para búsquedas por fecha y sucursal
   - Cálculo de balance en tiempo real (puede cachearse si necesario)

2. **Validaciones:**
   - No permitir cerrar caja con movimientos pendientes de sincronizar
   - Validar que no haya duplicados en movimientos

3. **Impresión:**
   - Formato de ticket o A4 para comprobante de cierre
   - Incluir todos los movimientos del día

4. **Multi-sucursal:**
   - Cada sucursal tiene su propia caja
   - No se mezclan movimientos entre sucursales

5. **Backup y Sincronización:**
   - Los movimientos deben sincronizarse en tiempo real
   - Backup automático de cierres

---

**Módulo relacionado:** Integrado con Ventas y Cuentas por Cobrar.














