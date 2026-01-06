# Módulo: Inventario

## 🎯 Objetivo del Módulo

Controlar de manera precisa y simple las existencias de productos, evitando:
- Quiebres de stock
- Pérdidas
- Descontrol operativo

Este módulo responde a: *"¿Qué tengo, cuánto tengo y dónde lo tengo?"*

📌 **Importante:** Este módulo NO es contabilidad, es **control físico-operativo del inventario**.

---

## 🧩 Submódulos de Inventario

El módulo Inventario se divide internamente en:

1. **Productos**
2. **Categorías**
3. **Stock / Existencias**
4. **Movimientos de Inventario (Kardex)**
5. **Ajustes de Inventario**
6. **Alertas de Stock**

---

## 5.1 📦 PRODUCTOS

### Objetivo
Definir los artículos que se venden o gestionan.

### Funcionalidades

#### Listado de Productos

**Vista principal:**
- Tabla con columnas:
  - **Código:** Código interno del producto
  - **Nombre:** Nombre del producto
  - **Categoría:** Categoría asignada
  - **Precio de venta:** RD$ XX,XXX
  - **Stock:** Cantidad disponible (si aplica)
  - **Estado:** Badge (Activo / Inactivo)
  - **Acciones:** Menú dropdown

**Filtros:**
- Por categoría
- Por estado (Activo, Inactivo, Todos)
- Por control de stock (Con stock, Sin stock, Todos)
- Por sucursal (si aplica)
- Búsqueda por código, nombre, SKU

**Acciones principales:**
- **+ Nuevo Producto:** Botón destacado
- **Importar productos:** (Fase futura)
- **Exportar productos:** Excel, CSV

---

#### Crear/Editar Producto

**Información General:**
- **Código interno:** Campo obligatorio (único)
- **Código de barras:** Campo opcional
- **Nombre:** Campo obligatorio
- **Descripción:** Campo de texto opcional
- **Categoría:** Selector (obligatorio)
- **Marca:** Campo opcional
- **Unidad de medida:** Selector (Unidad, Kg, L, etc.)

**Precios:**
- **Precio de venta:** Campo numérico obligatorio (>= 0)
- **Costo:** Campo numérico opcional (>= 0)
- **Precio con ITBIS:** Checkbox (incluye ITBIS en precio de venta)

**Impuestos:**
- **ITBIS aplicable:** Checkbox (sí / no)
- **% de ITBIS:** Campo numérico (default: 18%)

**Control de Stock:**
- **Controla stock:** Checkbox (sí / no)
  - Si "Sí":
    - **Stock inicial:** Campo numérico (default: 0)
    - **Stock mínimo:** Campo numérico (default: 0)
    - **Stock por sucursal:** Tabla con stock por sucursal/almacén
  - Si "No": Producto es un servicio (no tiene stock)

**Ubicación:**
- **Almacén/Sucursal:** Selector (si hay múltiples)
- **Ubicación física:** Campo opcional (ej: "Estantería A, Fila 3")

**Estado:**
- **Activo:** Checkbox (producto disponible para venta)
- **Inactivo:** Producto no se muestra en ventas (pero se mantiene historial)

**Imagen:**
- Upload de imagen del producto (opcional)

**Acciones:**
- **Guardar:** Guarda producto
- **Guardar y crear otro:** Guarda y abre formulario nuevo
- **Cancelar:** Cierra sin guardar

---

### Reglas de Negocio

1. **Un producto puede ser:**
   - **Físico (con stock):** Tiene cantidad disponible, se reduce con ventas
   - **Servicio (sin stock):** No tiene cantidad, solo se factura

2. **No se elimina un producto con historial**
   - Solo se puede desactivar
   - El historial (ventas, movimientos) se mantiene
   - Cambios quedan auditados

3. **Código único:**
   - El código interno debe ser único en todo el sistema
   - El código de barras debe ser único (si se ingresa)

4. **Validaciones:**
   - Nombre obligatorio
   - Categoría obligatoria
   - Precio de venta >= 0
   - Si controla stock, stock mínimo >= 0

---

## 5.2 🗂️ CATEGORÍAS

### Objetivo
Organizar productos para facilitar búsqueda y reportes.

### Funcionalidades

#### Listado de Categorías

**Vista principal:**
- Tabla o árbol de categorías
- Columnas:
  - **Nombre:** Nombre de la categoría
  - **Descripción:** Descripción breve
  - **Productos:** Número de productos en la categoría
  - **Estado:** Badge (Activa / Inactiva)
  - **Acciones:** Editar, Eliminar (si no tiene productos)

**Acciones principales:**
- **+ Nueva Categoría:** Botón destacado

---

#### Crear/Editar Categoría

**Información:**
- **Nombre:** Campo obligatorio (único)
- **Descripción:** Campo de texto opcional
- **Categoría padre:** Selector opcional (para jerarquías)
- **Estado:** Checkbox (Activa / Inactiva)

**Acciones:**
- **Guardar:** Guarda categoría
- **Cancelar:** Cierra sin guardar

---

### Reglas de Negocio

1. **No se elimina categoría con productos activos**
   - Solo se puede desactivar
   - Los productos deben ser movidos a otra categoría antes de eliminar

2. **Jerarquías (Fase futura):**
   - Soporte para categorías y subcategorías

---

## 5.3 📊 STOCK / EXISTENCIAS

### Objetivo
Visualizar el stock real por producto, categoría y sucursal/almacén.

### Funcionalidades

#### Vista de Stock

**Filtros:**
- Por producto (búsqueda)
- Por categoría
- Por sucursal/almacén
- Por estado de stock (Disponible, Bajo mínimo, Sin stock)

**Tabla de Stock:**
Columnas:
- **Producto:** Nombre del producto
- **Código:** Código interno
- **Categoría:** Categoría
- **Stock disponible:** Cantidad (con badge de color)
  - Verde: Stock normal
  - Amarillo: Stock bajo mínimo
  - Rojo: Sin stock
- **Stock mínimo:** Cantidad configurada
- **Stock comprometido:** (Fase futura: productos reservados)
- **Sucursal:** Nombre de sucursal/almacén
- **Último movimiento:** Fecha del último movimiento
- **Acciones:** Ver kardex, Ajustar stock

**Vista por Sucursal:**
- Selector de sucursal
- Muestra stock solo de esa sucursal

**Resumen:**
- Total de productos con stock
- Total de productos bajo mínimo
- Total de productos sin stock
- Valor total de inventario (costo * cantidad)

---

#### Vista Detallada de Producto

Al hacer click en un producto:
- Historial de movimientos
- Stock por sucursal (si hay múltiples)
- Gráfico de tendencia de stock (últimos 30 días)
- Información del producto

---

### Reglas de Negocio

1. **El stock se actualiza automáticamente con:**
   - ✅ Ventas (reduce stock)
   - ✅ Notas de crédito (aumenta stock)
   - ✅ Ajustes manuales (aumenta o reduce según tipo)

2. **No se edita manualmente desde aquí**
   - Solo se visualiza
   - Para modificar: usar Ajustes de Inventario

3. **Cálculo de stock disponible:**
   - Stock disponible = Stock inicial + Entradas - Salidas
   - No incluye stock comprometido (si aplica)

4. **Multi-sucursal:**
   - Cada sucursal tiene su propio stock
   - Los movimientos entre sucursales se registran como transferencias (Fase futura)

---

## 5.4 🔄 MOVIMIENTOS DE INVENTARIO (KARDEX)

### Objetivo
Trazabilidad completa del inventario (historial de movimientos).

### Funcionalidades

#### Vista de Kardex

**Filtros:**
- Por producto
- Por tipo de movimiento
- Por rango de fechas
- Por sucursal
- Por usuario

**Tabla de Movimientos:**
Columnas:
- **Fecha:** Fecha y hora del movimiento
- **Tipo:** Badge con icono
  - **Venta:** Venta (rojo, reduce stock)
  - **Nota Crédito:** Devolución (verde, aumenta stock)
  - **Ajuste Entrada:** Ajuste positivo (verde)
  - **Ajuste Salida:** Ajuste negativo (rojo)
  - **Transferencia:** (Fase futura)
- **Producto:** Nombre del producto
- **Documento origen:** Número de factura, nota, ajuste
- **Entrada:** Cantidad (si es entrada)
- **Salida:** Cantidad (si es salida)
- **Saldo:** Stock después del movimiento
- **Usuario:** Usuario que ejecutó
- **Observaciones:** Notas adicionales

**Totales:**
- Total entradas (período seleccionado)
- Total salidas (período seleccionado)
- Saldo inicial (al inicio del período)
- Saldo final (al final del período)

---

#### Vista de Kardex por Producto

Al seleccionar un producto específico:
- Solo movimientos de ese producto
- Ordenado por fecha (más reciente primero)
- Gráfico de tendencia de stock

---

### Reglas de Negocio

1. **Solo lectura**
   - No se puede editar ni eliminar movimientos
   - Es un registro histórico y auditable

2. **Trazabilidad completa:**
   - Cada movimiento tiene:
     - Fecha y hora exacta
     - Tipo
     - Producto
     - Cantidad
     - Documento origen (si aplica)
     - Usuario
     - Saldo resultante

3. **Validación de saldo:**
   - El saldo debe ser consistente
   - Cálculo: Saldo anterior + Entradas - Salidas = Saldo nuevo

---

## 5.5 ⚠️ AJUSTES DE INVENTARIO

### Objetivo
Corregir diferencias físicas entre el stock del sistema y el stock real.

### Funcionalidades

#### Crear Ajuste de Inventario

**Tipo de Ajuste:**
- **Entrada:** Aumenta stock (sobrante encontrado)
- **Salida:** Reduce stock (faltante encontrado)

**Información del Ajuste:**
- **Fecha:** Fecha del ajuste (default: hoy)
- **Sucursal/Almacén:** Selector (obligatorio)
- **Motivo:** Selector obligatorio
  - Conteo físico
  - Pérdida
  - Daño
  - Robo
  - Error de sistema
  - Otro (con campo de texto)
- **Observaciones:** Campo de texto opcional

**Productos a Ajustar:**
- Tabla de productos:
  - Búsqueda/selector de producto
  - Stock actual (solo lectura)
  - Cantidad a ajustar (positiva)
  - Nuevo stock (calculado automáticamente)
- Botón "Agregar producto"
- Puede ajustar múltiples productos en un solo ajuste

**Resumen:**
- Total de productos ajustados
- Total entradas (si es ajuste de entrada)
- Total salidas (si es ajuste de salida)

**Acciones:**
- **Guardar ajuste:** Confirma y aplica el ajuste
- **Cancelar:** Cierra sin guardar

---

#### Listado de Ajustes

**Vista de ajustes realizados:**
- Tabla con columnas:
  - **Fecha:** Fecha del ajuste
  - **Sucursal:** Sucursal
  - **Tipo:** Entrada / Salida
  - **Motivo:** Motivo del ajuste
  - **Productos:** Número de productos ajustados
  - **Usuario:** Usuario que ejecutó
  - **Acciones:** Ver detalle

---

### Reglas de Negocio

1. **Requiere permiso especial**
   - No todos los usuarios pueden ajustar inventario
   - Normalmente: Administrador, Supervisor

2. **Impacta stock inmediatamente**
   - Al guardar el ajuste, el stock se actualiza
   - Se genera registro en kardex
   - No se puede deshacer fácilmente (requiere ajuste inverso)

3. **Queda auditado**
   - Usuario, fecha, motivo, productos
   - No se puede editar después de crear

4. **Validaciones:**
   - Motivo obligatorio
   - Al menos un producto debe ser ajustado
   - Cantidad de ajuste debe ser > 0
   - Si es ajuste de salida, no puede exceder el stock disponible

5. **Motivos comunes:**
   - **Conteo físico:** Inventario físico realizado
   - **Pérdida:** Productos perdidos o dañados
   - **Robo:** Productos robados
   - **Error de sistema:** Corrección de error anterior

---

## 5.6 🚨 ALERTAS DE STOCK

### Objetivo
Prevenir quiebres de inventario mediante alertas proactivas.

### Funcionalidades

#### Vista de Alertas

**Productos Bajo Stock Mínimo:**
- Listado de productos cuyo stock está por debajo del mínimo configurado
- Columnas:
  - **Producto:** Nombre
  - **Stock actual:** Cantidad (badge rojo/amarillo)
  - **Stock mínimo:** Cantidad configurada
  - **Diferencia:** Cuánto falta para llegar al mínimo
  - **Última venta:** Fecha de última venta
  - **Acciones:** Ver producto, Crear tarea de reorden (CRM)

**Alertas Críticas:**
- Productos sin stock
- Productos con stock muy bajo (< 20% del mínimo)
- Productos con alta rotación y stock bajo

**Notificaciones:**
- Badge en menú de Inventario con número de alertas
- Integración con Dashboard (ver módulo Dashboard)

---

#### Acciones desde Alertas

1. **Ver Producto:** Ir a detalle del producto
2. **Crear Tarea de Reorden:** Crea tarea en CRM para reordenar producto
3. **Ver Historial:** Ver movimientos recientes del producto

---

### Reglas de Negocio

1. **Cálculo automático:**
   - Se calcula comparando stock actual vs stock mínimo
   - Se actualiza en tiempo real o cada cierto intervalo

2. **Integración con Dashboard:**
   - Las alertas críticas aparecen en Dashboard
   - Número total de productos bajo stock mínimo

3. **Integración con CRM:**
   - Se pueden crear tareas automáticas o manuales para reordenar

---

## 🔐 Roles y Permisos

### Permisos por Acción

| Acción | Administrador | Supervisor | Operador/Cajero |
|--------|--------------|------------|-----------------|
| Ver inventario | ✅ | ✅ | ✅ |
| Ver stock | ✅ | ✅ | ✅ |
| Crear/editar productos | ✅ | ✅ | ❌ |
| Ver kardex | ✅ | ✅ | ❌ |
| Ajustar inventario | ✅ | ✅ | ❌ |
| Ver alertas | ✅ | ✅ | ✅* |

*Solo alertas, no puede ver reportes detallados

**Regla:** Los permisos se asignan al **rol**, no al usuario individual.

---

## 🔗 Relación con Otros Módulos

### Inventario se conecta con:

- **Ventas:** Para validar stock y reducir existencias al vender
- **Notas de Crédito:** Para aumentar stock al devolver productos
- **Reportes:** Para reportes de inventario y rotación
- **Dashboard:** Para alertas de stock bajo
- **Configuración:** Para parámetros (unidades de medida, etc.)

### ❌ Qué NO debe hacer Inventario:

- ❌ Manejar compras contables (fase futura)
- ❌ Gestionar proveedores complejos (fase futura)
- ❌ Modificar ventas (solo lee datos de ventas)

---

## 📊 Flujos Principales

### Flujo 1: Venta Reduce Stock
```
1. Usuario crea venta (Módulo Ventas)
2. Agrega productos
3. Al emitir factura:
   → Sistema valida stock disponible
   → Si hay stock: reduce automáticamente
   → Si no hay stock: error (o permite si está configurado)
   → Se genera movimiento en kardex (tipo: Venta)
```

### Flujo 2: Nota de Crédito Aumenta Stock
```
1. Usuario crea nota de crédito (Módulo Ventas)
2. Selecciona productos a devolver
3. Al emitir nota de crédito:
   → Sistema aumenta stock de productos devueltos
   → Se genera movimiento en kardex (tipo: Nota Crédito)
```

### Flujo 3: Ajuste de Inventario
```
1. Usuario con permiso crea ajuste
2. Selecciona tipo (Entrada/Salida)
3. Selecciona motivo (obligatorio)
4. Agrega productos y cantidades
5. Guarda ajuste
   → Stock se actualiza inmediatamente
   → Se genera movimiento en kardex (tipo: Ajuste)
   → Queda auditado
```

### Flujo 4: Alerta de Stock Bajo
```
1. Sistema detecta producto bajo stock mínimo
2. Aparece alerta en Dashboard y módulo Inventario
3. Usuario puede crear tarea de reorden (CRM)
4. Cuando se recibe producto, se ajusta stock (aumento)
   → Alerta desaparece automáticamente
```

---

## 📝 Notas de Implementación

1. **Performance:**
   - Índices en base de datos para búsquedas por producto, categoría y sucursal
   - Cálculo de stock en tiempo real (puede cachearse si necesario)
   - Vista materializada para reportes de stock (si necesario)

2. **Concurrencia:**
   - Manejar situaciones donde múltiples usuarios venden el mismo producto simultáneamente
   - Usar transacciones y locks en base de datos

3. **Validaciones:**
   - No permitir ventas si no hay stock (o según configuración)
   - Validar que ajustes no causen stock negativo (a menos que esté configurado)

4. **Multi-sucursal:**
   - Cada sucursal tiene su propio stock
   - Transferencias entre sucursales (Fase futura)

5. **Códigos de barras:**
   - Soporte para lectura de códigos de barras
   - Validación de formato EAN-13, UPC, etc.

---

**Módulo relacionado:** Integrado con Ventas (principalmente), Dashboard y CRM.



