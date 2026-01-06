# Módulo: Ventas

## 🎯 Objetivo del Módulo

Gestionar todas las operaciones de venta y facturación del negocio de forma:
- **Rápida** (especialmente POS)
- **Controlada** (auditable y trazable)
- **Fiscalmente correcta** (cumpliendo normativa RD - NCF)
- **Integrada** (con inventario, caja y cuentas por cobrar)

Este módulo responde a: *"Vender, facturar, cobrar y documentar correctamente"*

---

## 🧩 Submódulos de Ventas

El módulo Ventas se divide internamente en:

1. **Facturas**
2. **Cotizaciones**
3. **Punto de Venta (POS)**
4. **Notas de Crédito**
5. **Historial / Anulados**

---

## 2.1 📄 FACTURAS

### Objetivo
Registrar y consultar facturas emitidas, fiscales o no fiscales.

### Funcionalidades

#### Listado de Facturas

**Vista principal:**
- Tabla con columnas:
  - **Nro:** Número interno (#FA-XXXX)
  - **Tipo:** Tipo de documento (FACE, etc.)
  - **Cliente:** Nombre del cliente
  - **Estado:** Badge visual (Emitido, Pagado, Vencido, Anulado)
  - **Total:** RD$ XX,XXX
  - **Balance:** RD$ XX,XXX (pendiente si aplica)
  - **Fecha:** Fecha de emisión
  - **Acciones:** Menú dropdown

**Filtros:**
- Por tipo (Factura fiscal, No fiscal)
- Por estado (Emitido, Pagado, Vencido, Anulado)
- Por cliente
- Por rango de fechas
- Por sucursal
- Por rango de montos

**Búsqueda:**
- Por número de factura
- Por NCF
- Por cliente

**Tabs de categoría:**
- **Facturas** (principal)
- **Cotizaciones**
- **Notas de Crédito**
- **NCF Anulados** (con badge si hay anulados)

**Estados de Factura:**
- **Emitida** (Azul): Factura creada, no pagada
- **Pagada** (Verde): Totalmente pagada
- **Vencida** (Naranja): Fecha de vencimiento pasada, no pagada
- **Anulada** (Rojo): Factura anulada (no eliminada)

**Tipos de Factura:**
- **Fiscal (NCF):** Requiere NCF válido, cumple normativa RD
- **No Fiscal:** Para casos especiales (internas, etc.)

---

### Acciones por Factura

#### Menú de Acciones (Dropdown por fila)

1. **Ver** 👁️
   - Ver detalle completo de la factura
   - Vista previa de impresión
   - Información de pago

2. **Cobrar** ✅
   - Registrar pago total o parcial
   - Redirige a módulo CxC o modal de pago

3. **Anular** ❌
   - Anular factura (requiere motivo obligatorio)
   - Impacta inventario (restaura stock)
   - Impacta CxC (elimina cuenta por cobrar)
   - Genera registro de anulación

4. **WhatsApp** 💬
   - Enviar factura por WhatsApp
   - Formato: PDF o imagen

5. **Imprimir** 🖨️
   - Imprimir factura
   - Formatos: PDF, A4, Ticket

6. **Copiar** 📋
   - Duplicar factura como nueva (base para nueva venta)

7. **Convertir en Nota Crédito** 🔄
   - Crear nota de crédito basada en esta factura
   - Redirige a creación de Nota de Crédito

8. **Eliminar** 🗑️
   - Solo disponible si la factura está en borrador
   - No disponible para facturas emitidas

---

### Crear/Editar Factura

#### Formulario de Factura

**Información General:**
- **Cliente:** Selector de cliente (obligatorio)
- **Fecha:** Fecha de emisión (default: hoy)
- **Vencimiento:** Fecha de vencimiento (si es crédito)
- **Tipo:** Fiscal / No Fiscal
- **NCF:** Auto-generado si es fiscal (o manual si hay stock)

**Productos/Servicios:**
- Tabla de ítems:
  - Código / Búsqueda de producto
  - Descripción
  - Cantidad
  - Precio unitario
  - Descuento (% o monto)
  - Subtotal
- Botón "Agregar producto"
- Total automático

**Totales:**
- Subtotal
- ITBIS (si aplica)
- Descuento general (si aplica)
- Total

**Método de Pago:**
- Contado / Crédito
- Si contado: Efectivo, Transferencia, Tarjeta
- Si crédito: Plazo (días)

**Observaciones:**
- Campo de texto opcional

**Acciones:**
- **Guardar borrador:** Guarda sin emitir
- **Emitir:** Emite la factura (impacta inventario, caja, CxC)

---

### Reglas de Negocio

#### ❌ Reglas Críticas

1. **No se elimina una factura emitida**
   - Solo se anula
   - La anulación conserva trazabilidad completa

2. **Impacto automático al emitir:**
   - ✅ Reduce stock (si aplica)
   - ✅ Afecta Caja (si es contado)
   - ✅ Crea Cuenta por Cobrar (si es crédito)
   - ✅ Genera NCF (si es fiscal)

3. **Validaciones:**
   - Cliente obligatorio
   - Al menos un producto
   - Stock disponible (si controla stock)
   - Caja abierta (si es contado)
   - NCF disponible (si es fiscal)

4. **Anulación:**
   - Requiere motivo obligatorio
   - Impacta inventario (restaura stock)
   - Impacta CxC (elimina cuenta)
   - Genera registro de anulación
   - No se puede anular factura ya pagada parcialmente (solo vía Nota de Crédito)

---

## 2.2 📝 COTIZACIONES

### Objetivo
Crear propuestas de venta sin impacto contable ni operativo.

### Funcionalidades

#### Listado de Cotizaciones
- Similar a listado de facturas
- Estados: **Abierta**, **Aceptada**, **Rechazada**, **Convertida**

#### Crear Cotización
- Formulario similar a factura
- **NO requiere:**
  - NCF
  - Caja abierta
  - Stock disponible
- **SÍ requiere:**
  - Cliente
  - Productos
  - Fecha de validez (opcional)

#### Acciones de Cotización
1. **Ver** 👁️
2. **Editar** ✏️ (si está abierta)
3. **Convertir a Factura** 🔄
   - Convierte cotización en factura
   - Pre-llena formulario de factura
   - La cotización pasa a estado "Convertida"
4. **Enviar por WhatsApp** 💬
5. **Imprimir** 🖨️
6. **Eliminar** 🗑️ (si está abierta)

### Reglas de Negocio
- ❌ No afecta inventario
- ❌ No afecta caja
- ❌ No genera NCF
- ✅ Al convertir → pasa a facturación normal
- ✅ Puede editarse hasta ser convertida o rechazada

---

## 2.3 🧾 PUNTO DE VENTA (POS)

### Objetivo
Registrar ventas rápidas, principalmente de mostrador.

### Funcionalidades

#### Interfaz de POS

**Área de Búsqueda/Selección:**
- Búsqueda rápida de productos (por código, nombre, código de barras)
- Escáner de códigos de barras
- Grid o lista de productos frecuentes

**Carrito de Venta:**
- Lista de productos seleccionados
- Cantidad editable
- Precio editable (si tiene permiso)
- Descuento por ítem
- Botón eliminar ítem

**Totales:**
- Subtotal
- Descuento total
- ITBIS
- **Total a pagar** (destacado)

**Acciones:**
- **Agregar cliente** (opcional): Para venta a crédito
- **Aplicar descuento general**
- **Método de pago:**
  - Efectivo
  - Transferencia
  - Tarjeta
  - Mixto (si aplica)
- **Cobrar** (botón grande verde)
- **Cancelar venta**

**Después de cobrar:**
- Mostrar total pagado y vuelto (si es efectivo)
- Opción de imprimir ticket
- Opción de enviar por WhatsApp
- Opción de nueva venta

### Reglas de Negocio

1. **Requiere caja abierta**
   - Validar antes de permitir venta

2. **Emite factura automáticamente**
   - Genera factura al cobrar
   - Tipo: Fiscal o No Fiscal (según configuración)

3. **Impacta automáticamente:**
   - ✅ Inventario (reduce stock)
   - ✅ Caja (registra ingreso)
   - ✅ CxC (si es crédito)

4. **Atajos de teclado:**
   - `F1`: Nueva venta
   - `F2`: Buscar producto
   - `Enter`: Agregar producto / Cobrar
   - `Esc`: Cancelar

---

## 2.4 🔁 NOTAS DE CRÉDITO

### Objetivo
Corregir o revertir facturas emitidas (parcial o totalmente).

### Funcionalidades

#### Crear Nota de Crédito

**Desde factura:**
- Acción "Convertir en Nota Crédito" desde factura
- Pre-llena productos y montos

**Formulario:**
- **Factura origen:** Obligatorio (select)
- **Motivo:** Obligatorio (select o texto)
- **Productos:**
  - Muestra productos de factura original
  - Permite seleccionar cuáles devolver
  - Cantidad editable (máx: cantidad original)
- **Totales:** Calculados automáticamente
- **NCF:** Auto-generado (si aplica)

#### Tipos de Nota de Crédito
- **Total:** Revierte toda la factura
- **Parcial:** Revierte solo algunos productos o montos

### Reglas de Negocio

1. **No se crea libremente**
   - Siempre ligada a una factura

2. **Impacto automático:**
   - ✅ Inventario (restaura stock)
   - ✅ CxC (reduce balance o elimina cuenta)
   - ✅ Genera registro de anulación parcial/total

3. **Validaciones:**
   - Motivo obligatorio
   - No puede exceder montos/cantidades de factura original

4. **Auditabilidad:**
   - Usuario que creó
   - Fecha y hora
   - Motivo
   - Factura asociada

---

## 2.5 🗂️ HISTORIAL / ANULADOS

### Objetivo
Mantener trazabilidad completa de documentos anulados.

### Funcionalidades

#### Vista de Historial
- Listado de facturas anuladas
- Listado de notas de crédito
- Filtros:
  - Por fecha
  - Por usuario
  - Por motivo
- Columnas:
  - Fecha de anulación
  - Documento original
  - Usuario que anuló
  - Motivo
  - Tipo (Anulación / Nota Crédito)

### Reglas de Negocio
- **Solo lectura:** No se puede modificar
- **Auditoría completa:** Todo queda registrado

---

## 🔐 Roles y Permisos

### Permisos por Acción

| Acción | Administrador | Supervisor | Operador/Cajero |
|--------|--------------|------------|-----------------|
| Ver facturas | ✅ | ✅ | ✅ |
| Crear factura | ✅ | ✅ | ✅ |
| Editar factura (borrador) | ✅ | ✅ | ✅ |
| Anular factura | ✅ | ✅ | ❌* |
| Emitir NCF | ✅ | ✅ | ✅ |
| Ver utilidades | ✅ | ✅ | ❌ |
| Imprimir | ✅ | ✅ | ✅ |
| Enviar WhatsApp | ✅ | ✅ | ✅ |
| POS | ✅ | ✅ | ✅ |
| Nota de Crédito | ✅ | ✅ | ❌ |

*Puede tener permiso específico si se configura

**Regla:** Los permisos se asignan al **rol**, no al usuario individual.

---

## 🔗 Relación con Otros Módulos

### Ventas se conecta con:

- **Clientes:** Para datos del comprador
- **Inventario:** Para validar stock y reducir existencias
- **Caja:** Para registrar ingresos (si es contado)
- **Cuentas por Cobrar:** Para crear cuentas (si es crédito)
- **Reportes:** Para datos de ventas
- **CRM:** Para registrar actividad del cliente

### ❌ Qué NO debe hacer Ventas:

- ❌ Gestionar usuarios
- ❌ Definir precios globales (eso es Configuración)
- ❌ Manejar stock manual (eso es Inventario)
- ❌ Gestionar tareas (eso es CRM)

---

## 📊 Flujos Principales

### Flujo 1: Venta Contado (POS)
```
1. Usuario abre POS
2. Busca/selecciona productos
3. Opcional: Selecciona cliente
4. Selecciona método de pago (Efectivo)
5. Cobra
   → Se emite factura
   → Se reduce stock
   → Se registra ingreso en caja
6. Se imprime ticket (opcional)
```

### Flujo 2: Venta a Crédito
```
1. Usuario crea factura
2. Selecciona cliente
3. Agrega productos
4. Define vencimiento
5. Emite factura
   → Se reduce stock
   → Se crea cuenta por cobrar
   → NO afecta caja
```

### Flujo 3: Anulación de Factura
```
1. Usuario selecciona factura
2. Acción "Anular"
3. Ingresa motivo (obligatorio)
4. Confirma anulación
   → Se restaura stock
   → Se elimina cuenta por cobrar (si aplica)
   → Se genera registro de anulación
```

### Flujo 4: Cotización → Factura
```
1. Usuario crea cotización
2. Envía cotización a cliente
3. Cliente acepta
4. Usuario convierte a factura
   → Se pre-llena formulario
   → Usuario ajusta si necesario
   → Emite factura
   → Cotización pasa a "Convertida"
```

---

## 📝 Notas de Implementación

1. **NCF (Número de Comprobante Fiscal):**
   - Integración con DGII (Dirección General de Impuestos Internos de RD)
   - Validación de secuencias disponibles
   - Generación automática según tipo de documento

2. **Performance:**
   - El POS debe ser muy rápido
   - Cache de productos frecuentes
   - Búsqueda con debounce

3. **Impresión:**
   - Soporte para múltiples formatos
   - Impresoras térmicas (tickets)
   - Impresoras A4 (facturas formales)

4. **Offline (Fase futura):**
   - POS offline con sincronización posterior

---

**Módulo relacionado:** Todos los módulos operativos dependen de Ventas.



