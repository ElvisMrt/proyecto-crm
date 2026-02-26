# 📘 Manual de Usuario - Sistema CRM + Facturación

## Sistema de Gestión Empresarial para MIPYMES

---

# 📑 ÍNDICE

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Roles y Permisos](#3-roles-y-permisos)
4. [Dashboard](#4-dashboard)
5. [Flujo Completo del Sistema](#5-flujo-completo-del-sistema)
6. [Módulo de Ventas](#6-módulo-de-ventas)
7. [Módulo de Caja](#7-módulo-de-caja)
8. [Módulo de Cuentas por Cobrar](#8-módulo-de-cuentas-por-cobrar)
9. [Módulo de Inventario](#9-módulo-de-inventario)
10. [Módulo de Clientes](#10-módulo-de-clientes)
11. [Módulo CRM](#11-módulo-crm)
12. [Configuración del Sistema](#12-configuración-del-sistema)
13. [Solución de Problemas](#13-solución-de-problemas)
14. [Preguntas Frecuentes](#14-preguntas-frecuentes)

---

# 1. INTRODUCCIÓN

## 1.1 ¿Qué es el Sistema CRM?

El Sistema CRM + Facturación es una plataforma integral diseñada para Micro, Pequeñas y Medianas Empresas (MIPYMES) en República Dominicana. Permite gestionar de manera eficiente todas las operaciones comerciales de su negocio.

## 1.2 Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **Ventas** | Facturación, cotizaciones, punto de venta (POS) |
| **Caja** | Control diario de efectivo, apertura y cierre |
| **Cuentas por Cobrar** | Gestión de créditos y cobros pendientes |
| **Inventario** | Control de productos, stock y movimientos |
| **Clientes** | Base de datos de clientes y seguimiento |
| **CRM** | Tareas comerciales y recordatorios |
| **Reportes** | Análisis y estadísticas del negocio |

## 1.3 Acceso al Sistema

- **URL:** http://localhost:5174 (desarrollo) o la URL de su servidor
- **Navegadores compatibles:** Chrome, Firefox, Safari, Edge (últimas versiones)

---

# 2. PRIMEROS PASOS

## 2.1 Credenciales de Acceso

El sistema viene con usuarios de ejemplo para comenzar:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Administrador** | `admin@crm.com` | `admin123` | Acceso total |
| **Supervisor** | `supervisor@crm.com` | `admin123` | Supervisión y reportes |
| **Cajero** | `cajero@crm.com` | `admin123` | Ventas y caja |

## 2.2 Primer Inicio de Sesión

1. Abra el navegador e ingrese la URL del sistema
2. Ingrese su correo electrónico y contraseña
3. Haga clic en "Iniciar Sesión"
4. Será redirigido al Dashboard principal

## 2.3 Cambio de Contraseña (Recomendado)

1. Vaya a **Configuración > Usuarios**
2. Seleccione su usuario
3. Haga clic en "Editar"
4. Cambie la contraseña por una segura
5. Guarde los cambios

---

# 3. ROLES Y PERMISOS

## 3.1 Roles del Sistema

### 👤 Administrador
- Acceso completo a todos los módulos
- Gestión de usuarios y sucursales
- Configuración del sistema
- Anulación de facturas
- Reportes administrativos

### 👤 Supervisor
- Acceso a ventas y reportes
- Supervisión de caja
- Gestión de inventario
- Cuentas por cobrar
- No puede anular facturas (solo Administrador)

### 👤 Cajero
- Punto de Venta (POS)
- Apertura y cierre de caja
- Ventas rápidas
- Consulta de precios
- No puede ver costos ni márgenes

### 👤 Operador
- Ventas básicas
- Gestión de clientes
- Cotizaciones
- Consultas limitadas

## 3.2 Matriz de Permisos por Rol

| Función | Admin | Supervisor | Cajero | Operador |
|---------|-------|------------|--------|----------|
| Crear facturas | ✅ | ✅ | ✅ | ✅ |
| Anular facturas | ✅ | ❌ | ❌ | ❌ |
| Ver costos | ✅ | ✅ | ❌ | ❌ |
| Configurar NCF | ✅ | ❌ | ❌ | ❌ |
| Cerrar caja de otros | ✅ | ❌ | ❌ | ❌ |
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ | ❌ |

---

# 4. DASHBOARD

## 4.1 Vista General

El Dashboard es la pantalla principal que muestra el estado actual del negocio:

### KPIs Principales
- **Ventas del Día:** Total vendido hoy
- **Ventas del Mes:** Acumulado mensual
- **Cuentas por Cobrar:** Total pendiente
- **Stock Bajo:** Productos con stock crítico

### Alertas Importantes
🔴 **Críticas:**
- Facturas vencidas
- Stock agotado
- Caja no cuadrada

🟡 **Advertencias:**
- Tareas atrasadas
- Cotizaciones pendientes
- Stock bajo

## 4.2 Acciones Rápidas

Desde el Dashboard puede:
- Crear factura rápida
- Abrir caja
- Ver clientes con deudas
- Consultar inventario

---

# 5. FLUJO COMPLETO DEL SISTEMA

## 5.1 Flujo de Venta al Contado (Más Común)

### Paso 1: Apertura de Caja
```
Caja > Abrir Caja > Ingrese monto inicial > Confirmar
```

### Paso 2: Crear Venta
```
Ventas > Punto de Venta (POS) > Agregar productos > Seleccionar cliente > Cobrar
```

### Paso 3: Cobro
```
Ingrese monto recibido > Seleccione método de pago > Imprimir ticket
```

### Paso 4: Cierre de Caja (Al final del día)
```
Caja > Cerrar Caja > Cuente efectivo > Ingrese arqueo > Confirmar
```

## 5.2 Flujo de Venta a Crédito

### Paso 1: Verificar Límite de Crédito
```
Clientes > Buscar cliente > Ver "Límite de Crédito" y "Balance"
```

### Paso 2: Crear Factura a Crédito
```
Ventas > Nueva Factura > Seleccionar cliente > Tipo: Crédito > Definir vencimiento > Emitir
```

### Paso 3: Seguimiento
```
Cuentas por Cobrar > Ver facturas pendientes > Registrar pagos parciales
```

## 5.3 Flujo de Cotización a Factura

### Paso 1: Crear Cotización
```
Ventas > Cotizaciones > Nueva > Agregar productos > Guardar
```

### Paso 2: Enviar al Cliente
```
Abrir cotización > Enviar por email/WhatsApp > Esperar aprobación
```

### Paso 3: Convertir a Factura
```
Abrir cotización > "Convertir a Factura" > Confirmar > Emitir
```

## 5.4 Flujo de Reorden de Inventario

### Paso 1: Detectar Stock Bajo
```
Dashboard ver alerta "Stock Bajo" o Inventario > Alertas
```

### Paso 2: Revisar Productos
```
Inventario > Productos con stock bajo > Ver detalles
```

### Paso 3: Registrar Compra
```
Inventario > Movimientos > Entrada > Ingresar cantidad recibida
```

---

# 6. MÓDULO DE VENTAS

## 6.1 Punto de Venta (POS)

El POS es para ventas rápidas, ideal para atención al cliente.

### Interfaz del POS

**Panel Izquierdo - Búsqueda de Productos:**
- Barra de búsqueda (por nombre o código)
- Grid de productos con imagen, nombre y precio
- Categorías como filtros

**Panel Derecho - Carrito:**
- Productos agregados
- Cantidad editable
- Descuento por línea
- Subtotal, ITBIS y Total

**Teclas Rápidas:**
- `F2` - Buscar producto
- `F4` - Buscar cliente
- `F9` - Cobrar
- `ESC` - Cancelar

### Proceso de Venta en POS

1. **Agregar Productos**
   - Busque por nombre o escanee código
   - Haga clic en el producto
   - Ajuste cantidad si es necesario

2. **Seleccionar Cliente** (Opcional)
   - Haga clic en "Cliente"
   - Busque cliente existente o cree nuevo

3. **Aplicar Descuento** (Si aplica)
   - Haga clic en el ícono de descuento
   - Ingrese porcentaje o monto

4. **Cobrar**
   - Haga clic en "Cobrar" (F9)
   - Seleccione método de pago:
     - **Efectivo:** Ingrese monto recibido, sistema calcula cambio
     - **Tarjeta:** Ingrese autorización
     - **Transferencia:** Ingrese referencia
   - Imprima ticket

## 6.2 Facturas

### Tipos de Factura

| Tipo | Uso | Requiere NCF |
|------|-----|--------------|
| **Fiscal (NCF)** | Ventas formales con DGII | Sí |
| **No Fiscal** | Ventas internas, consumo interno | No |
| **Proforma** | Cotizaciones formales | No |

### Estados de Factura

- **🟡 Emitida:** Creada, pendiente de pago
- **🟢 Pagada:** Totalmente pagada
- **🟠 Vencida:** Fecha de vencimiento pasada
- **🔴 Anulada:** Cancelada (no eliminada)

### Crear Factura Fiscal

1. **Ventas > Facturas > Nueva Factura**
2. **Seleccionar Cliente:** Obligatorio para facturas fiscales
3. **Seleccionar Tipo:** Fiscal (NCF)
4. **Agregar Productos:** Busque y seleccione
5. **Definir Términos:**
   - Tipo de pago: Contado o Crédito
   - Fecha de vencimiento (si es crédito)
6. **Emitir:** Confirme y genere NCF

### Acciones sobre Facturas

| Acción | Descripción | Quién puede |
|--------|-------------|-------------|
| **Ver** | Ver detalle completo | Todos |
| **Cobrar** | Registrar pago | Todos |
| **Anular** | Cancelar factura | Solo Admin |
| **WhatsApp** | Enviar PDF | Todos |
| **Imprimir** | Generar PDF | Todos |
| **Duplicar** | Copiar factura | Todos |

### Anulación de Facturas

⚠️ **Importante:** Solo Administradores pueden anular.

**Antes de anular:**
- ✅ Verifique que no tenga pagos parciales (si los tiene, use Nota de Crédito)
- ✅ Tenga el motivo de anulación listo (obligatorio)

**Proceso:**
1. Abra la factura
2. Haga clic en "Anular"
3. Ingrese motivo detallado
4. Confirme

**Impacto de la Anulación:**
- Restaura stock de productos
- Elimina cuenta por cobrar (si era crédito)
- Revierte ingreso en caja (si era contado)
- Genera registro de auditoría

## 6.3 Cotizaciones

### Crear Cotización

1. **Ventas > Cotizaciones > Nueva**
2. **Seleccionar Cliente**
3. **Agregar Productos y Servicios**
4. **Definir Validez:** Fecha límite de la cotización
5. **Guardar**

### Estados de Cotización

- **Borrador:** En edición
- **Enviada:** Enviada al cliente
- **Aprobada:** Cliente aceptó
- **Rechazada:** Cliente no aceptó
- **Facturada:** Convertida a factura
- **Vencida:** Pasó fecha de validez

### Convertir Cotización a Factura

1. Abra la cotización aprobada
2. Haga clic en "Convertir a Factura"
3. Verifique que los productos y precios están correctos
4. Emita la factura

---

# 7. MÓDULO DE CAJA

## 7.1 Conceptos Importantes

### ¿Qué es una Caja?

Una caja es un período de operación diaria que registra:
- **Apertura:** Monto inicial en efectivo
- **Movimientos:** Ingresos (ventas) y egresos (gastos, retiros)
- **Cierre:** Arqueo físico vs. sistema

### Estados de Caja

- **🔴 Cerrada:** No se pueden hacer ventas
- **🟢 Abierta:** Operando normalmente
- **🟡 Por Cerrar:** Pendiente de arqueo

## 7.2 Apertura de Caja

### Requisitos para Abrir
- Tener permisos de cajero o superior
- No tener otra caja abierta

### Proceso

1. **Caja > Abrir Caja**
2. **Seleccionar Sucursal** (si aplica)
3. **Ingresar Monto Inicial:** Cuente el efectivo inicial
4. **Confirmar:** Registre observaciones si es necesario

**Ejemplo:**
```
Monto Inicial: RD$ 5,000.00
Sucursal: Principal
Observaciones: Apertura turno mañana
```

## 7.3 Operaciones Durante el Día

### Movimientos de Caja

Durante el día, la caja registra automáticamente:
- ✅ **Ingresos:** Ventas en efectivo
- ✅ **Ingresos:** Pagos de cuentas por cobrar
- ❌ **Egresos:** Gastos operativos
- ❌ **Egresos:** Retiros de efectivo

### Registrar Movimiento Manual

1. **Caja > Movimientos > Nuevo**
2. **Tipo:** Ingreso o Egreso
3. **Concepto:** Descripción del movimiento
4. **Monto:** Valor
5. **Categoría:**
   - Ingresos: Reembolsos, Otros
   - Egresos: Combustible, Suministros, Pago servicios, Viáticos, Otros
6. **Guardar**

## 7.4 Cierre de Caja

### Antes de Cerrar

1. Cuente físicamente todo el efectivo
2. Sumas cheques y tarjetas (si aplica)
3. Tenga lista la cantidad exacta

### Proceso de Cierre

1. **Caja > Cerrar Caja**
2. **Ingrese Arqueo:**
   - Efectivo contado físicamente
   - Cheques
   - Tarjetas
   - Otras formas de pago
3. **El sistema muestra:**
   - **Esperado:** Lo que debería haber según sistema
   - **Contado:** Lo que ingresó
   - **Diferencia:** Posible sobrante o faltante

### Diferencias de Caja

| Situación | Indica | Acción |
|-----------|--------|--------|
| **Diferencia = 0** | Cuadre perfecto | Cerrar normal |
| **Diferencia > 0** | Sobrante | Registrar sobrante |
| **Diferencia < 0** | Faltante | Registrar faltante |

### Reporte de Cierre

Al cerrar, el sistema genera:
- Resumen de ventas del día
- Detalle de movimientos
- Diferencias (si las hay)
- Gráfico de métodos de pago

---

# 8. MÓDULO DE CUENTAS POR COBRAR (CxC)

## 8.1 Conceptos

### ¿Qué son Cuentas por Cobrar?

Son facturas emitidas a crédito que el cliente debe pagar en el futuro.

### Términos Importantes

| Término | Definición |
|---------|------------|
| **Límite de Crédito** | Monto máximo que puede adeudar un cliente |
| **Balance** | Total que debe el cliente actualmente |
| **Vencimiento** | Fecha límite de pago |
| **Mora** | Días de retraso en el pago |
| **Estado de Cuenta** | Historial completo de facturas y pagos |

## 8.2 Estado de Cuenta del Cliente

### Consultar

1. **Cuentas por Cobrar > Estado de Cuenta**
2. **Buscar Cliente**
3. **Ver Resumen:**
   - Total facturado
   - Total pagado
   - Balance pendiente
   - Límite de crédito disponible

### Detalle

- Lista de todas las facturas a crédito
- Pagos realizados por factura
- Facturas vencidas destacadas en rojo

## 8.3 Registrar Pago

### Proceso

1. **Cuentas por Cobrar > Registrar Pago** o desde Estado de Cuenta
2. **Seleccionar Cliente**
3. **Seleccionar Factura(s)** a pagar
4. **Ingrese Monto:** Puede ser parcial o total
5. **Seleccione Método de Pago:**
   - Efectivo
   - Cheque
   - Transferencia
   - Tarjeta
   - Depósito
6. **Ingrese Referencia** (si aplica)
7. **Confirmar**

### Pago Parcial

El sistema permite pagos parciales:
- Factura queda con "Balance Pendiente"
- Estado cambia a "Pagado Parcialmente"
- Se puede seguir registrando pagos hasta saldar

### Pago de Múltiples Facturas

1. Seleccione el cliente
2. El sistema muestra todas las facturas pendientes
3. Seleccione las facturas a pagar
4. Ingrese monto total del pago
5. El sistema distribuye automáticamente (o manual si prefiere)

## 8.4 Facturas Vencidas

### Consultar Vencidas

**Cuentas por Cobrar > Vencidas**

Muestra:
- Clientes con facturas vencidas
- Días de mora
- Monto vencido
- Total adeudado

### Acciones sobre Vencidas

- **Llamar:** Registre intento de cobro
- **Recordatorio:** Enviar notificación
- **Acuerdo de Pago:** Registrar promesa
- **Nota de Cobro:** Generar documento formal

## 8.5 Resumen de CxC

**Cuentas por Cobrar > Resumen**

Indicadores clave:
- Total por cobrar
- Por rango de vencimiento (0-30, 31-60, 61-90, 90+ días)
- Top clientes deudores
- Tendencia de morosidad

---

# 9. MÓDULO DE INVENTARIO

## 9.1 Gestión de Productos

### Catálogo de Productos

**Inventario > Productos**

Campos principales:
- **Código:** Identificador único (SKU)
- **Nombre:** Descripción del producto
- **Categoría:** Clasificación
- **Precio de Venta:** PVP
- **Costo:** Precio de compra
- **Stock:** Cantidad disponible
- **Stock Mínimo:** Punto de reorden
- **Unidad de Medida:** Unidad, Caja, Litro, etc.
- **Ubicación:** Estante/bodega

### Crear Producto

1. **Inventario > Productos > Nuevo**
2. **Complete Datos Básicos:**
   - Código único
   - Nombre descriptivo
   - Categoría
3. **Defina Precios:**
   - Costo (opcional para algunos roles)
   - Precio de venta
   - Precio mayor (opcional)
4. **Configure Stock:**
   - Stock inicial
   - Stock mínimo (para alertas)
   - Stock máximo (opcional)
5. **Guardar**

### Tipos de Producto

| Tipo | Descripción | Control de Stock |
|------|-------------|------------------|
| **Físico** | Producto tangible con stock | Sí |
| **Servicio** | Servicios prestados | No |
| **Combo** | Grupo de productos | Automático |

## 9.2 Control de Stock

### Consultar Existencias

**Inventario > Stock**

Vistas disponibles:
- **Todos:** Todos los productos
- **Con Stock:** Solo disponibles
- **Sin Stock:** Agotados
- **Stock Bajo:** Por debajo del mínimo

### Kardex (Movimientos)

**Inventario > Movimientos**

Historial completo de entradas y salidas:
- Fecha
- Tipo (Entrada/Salida)
- Motivo (Venta, Compra, Ajuste, etc.)
- Cantidad
- Stock anterior
- Stock nuevo
- Usuario que realizó el movimiento

### Alertas de Stock

**Inventario > Alertas**

El sistema alerta cuando:
- Stock llega al mínimo configurado (🟡)
- Stock se agota (🔴)

## 9.3 Ajustes de Inventario

### Cuándo Ajustar

- Conteo físico diferente al sistema
- Productos dañados
- Vencimientos
- Robo/Pérdida
- Corrección de errores

### Proceso de Ajuste

1. **Inventario > Ajustes > Nuevo**
2. **Seleccionar Producto**
3. **Tipo de Ajuste:**
   - **Entrada:** Aumentar stock (hallazgo, corrección)
   - **Salida:** Disminuir stock (daño, pérdida)
4. **Cantidad a Ajustar**
5. **Motivo:**
   - Conteo físico
   - Daño
   - Vencido
   - Robo
   - Corrección
   - Otro
6. **Observaciones:** Detalle del motivo
7. **Guardar**

⚠️ **Importante:** Los ajustes quedan registrados en auditoría y no pueden eliminarse.

## 9.4 Categorías

**Inventario > Categorías**

Permite organizar productos en:
- Categorías principales
- Subcategorías
- Facilita búsquedas y reportes

---

# 10. MÓDULO DE CLIENTES

## 10.1 Ficha del Cliente

**Clientes > Lista > Seleccionar**

Información disponible:
- **Datos Generales:** Nombre, RNC/Cédula, teléfono, email
- **Dirección:** Dirección completa
- **Crédito:** Límite asignado, balance actual
- **Historial:** Todas las facturas
- **Estadísticas:** Total comprado, promedio, frecuencia

## 10.2 Crear Cliente

1. **Clientes > Nuevo**
2. **Datos Básicos:**
   - Nombre completo o razón social
   - Identificación (RNC o Cédula)
   - Teléfono
   - Email
3. **Dirección:**
   - Dirección completa
   - Ciudad
   - Referencias
4. **Crédito (opcional):**
   - Límite de crédito
   - Plazo de pago (días)
5. **Guardar**

## 10.3 Historial del Cliente

Consulte desde la ficha del cliente:
- **Facturas:** Todas las compras
- **Cotizaciones:** Presupuestos enviados
- **Pagos:** Historial de pagos
- **Tareas:** Seguimiento comercial (CRM)
- **Notas:** Comentarios internos

## 10.4 Tipos de Cliente

| Tipo | Características | Tratamiento |
|------|-----------------|-------------|
| **Contado** | Sin crédito aprobado | Pago inmediato |
| **Crédito** | Con límite aprobado | Facturas a crédito |
| **VIP** | Alto volumen de compras | Atención preferencial |

---

# 11. MÓDULO CRM

## 11.1 Tareas y Seguimiento

### Crear Tarea

1. **CRM > Tareas > Nueva**
2. **Asunto:** Descripción breve
3. **Tipo:**
   - Llamada
   - Visita
   - Reunión
   - Seguimiento
   - Cobro
4. **Cliente:** Relacionar con cliente (opcional)
5. **Fecha y Hora**
6. **Prioridad:** Alta, Media, Baja
7. **Asignar a:** Usuario responsable
8. **Descripción:** Detalles

### Estados de Tarea

- **Pendiente:** Por realizar
- **En Progreso:** Iniciada
- **Completada:** Finalizada
- **Cancelada:** No se realizará

## 11.2 Recordatorios

El sistema muestra alertas para:
- Tareas para hoy
- Tareas atrasadas (vencidas)
- Cobros programados
- Cumpleaños de clientes (si se registró)

## 11.3 Notas de Cliente

Desde la ficha del cliente, puede agregar notas:
- Preferencias
- Historial de conversaciones
- Información relevante

---

# 12. CONFIGURACIÓN DEL SISTEMA

## 12.1 Configuración de la Empresa

**Configuración > Empresa**

Datos fiscales:
- Nombre/Razón social
- RNC
- Dirección fiscal
- Teléfono
- Logo

## 12.2 Secuencias NCF

**Configuración > NCF**

Configuración de comprobantes fiscales:
- **01 - Crédito Fiscal:** Para empresas con crédito
- **02 - Consumo:** Ventas al detalle
- **03 - Gastos Menores:** Hasta RD$ 50,000
- **04 - Regímenes Especiales:** Otros
- **15 - Proveedores Informales:** Compras informales

### Configurar Secuencia

1. Seleccionar tipo de NCF
2. Ingresar secuencia inicial (ej: 0000000001)
3. Guardar

⚠️ **Importante:** Las secuencias deben coincidir con las autorizadas por DGII.

## 12.3 Sucursales

**Configuración > Sucursales**

Para empresas con múltiples ubicaciones:
- Crear sucursal
- Asignar usuarios
- Definir cajas por sucursal
- Reportes por sucursal

## 12.4 Gestión de Usuarios

**Configuración > Usuarios**

### Crear Usuario

1. **Nuevo Usuario**
2. **Datos:**
   - Nombre completo
   - Email (será el usuario)
   - Teléfono
3. **Rol:** Seleccionar de la lista
4. **Sucursal:** Asignar sucursal (si aplica)
5. **Guardar**

### Estados de Usuario

- **Activo:** Puede iniciar sesión
- **Inactivo:** No puede iniciar sesión (mantener histórico)

---

# 13. SOLUCIÓN DE PROBLEMAS

## 13.1 No Puede Iniciar Sesión

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "Usuario no existe" | Email incorrecto | Verifique mayúsculas/minúsculas |
| "Contraseña incorrecta" | Contraseña errónea | Use "Olvidé contraseña" o contacte admin |
| "Cuenta inactiva" | Usuario deshabilitado | Contacte al administrador |
| Pantalla en blanco | Problema de conexión | Verifique internet y recargue |

## 13.2 Errores en Ventas

| Error | Causa | Solución |
|-------|-------|----------|
| "No hay caja abierta" | Caja cerrada | Abra caja primero |
| "Stock insuficiente" | Producto agotado | Verifique inventario |
| "Cliente requerido" | Factura fiscal sin cliente | Seleccione cliente |
| "NCF agotado" | Secuencia terminó | Configure nueva secuencia |
| "Límite de crédito excedido" | Cliente debe mucho | Solicite pago parcial |

## 13.3 Problemas de Caja

| Problema | Causa | Solución |
|----------|-------|----------|
| "Diferencia de caja" | Arqueo incorrecto | Revise conteo físico |
| "No puede cerrar caja de otro" | Permisos | Contacte supervisor |
| "Caja ya abierta" | Caja abierta en otra sucursal | Cierre caja anterior |

## 13.4 Errores de Impresión

1. Verifique que la impresora esté encendida
2. Verifique conexión (USB/Red)
3. Revise que tenga papel
4. En Chrome: Use Ctrl+P > Destino: Guardar como PDF

---

# 14. PREGUNTAS FRECUENTES

## 14.1 Uso General

**¿Puedo usar el sistema desde mi celular?**
Sí, el sistema es responsive y funciona en dispositivos móviles, aunque para operaciones de venta recomendamos tablet o computadora.

**¿Cuántos usuarios pueden usar el sistema simultáneamente?**
Depende del plan contratado. El sistema soporta múltiples usuarios concurrentes.

**¿Se guarda automáticamente?**
Sí, todas las operaciones se guardan inmediatamente. No hay necesidad de guardar manualmente.

## 14.2 Ventas

**¿Puedo anular una factura de ayer?**
Sí, pero solo un Administrador puede hacerlo y se requiere motivo.

**¿Puedo cambiar precios en medio de una venta?**
Sí, haga clic en el producto y modifique el precio. Esto queda registrado en auditoría.

**¿Qué pasa si el cliente quiere cambiar un producto?**
Use Nota de Crédito para anular parcialmente y cree una nueva factura.

## 14.3 Caja

**¿Debo cerrar caja todos los días?**
Sí, es recomendable cerrar caja al finalizar el turno para evitar acumulación de movimientos.

**¿Qué hago si hay diferencia de caja?**
Registre la diferencia en el cierre. El sistema guarda el registro para auditoría.

**¿Puedo reabrir una caja cerrada?**
No, una vez cerrada no se puede reabrir. Debe abrir una nueva caja.

## 14.4 Inventario

**¿El stock se actualiza automáticamente?**
Sí, cada venta reduce stock automáticamente. Las anulaciones lo restauran.

**¿Puedo tener stock negativo?**
Por defecto no. El sistema valida stock disponible antes de vender.

**¿Cómo registro una compra de mercancía?**
Use "Inventario > Movimientos > Entrada" o espere el módulo de Compras.

## 14.5 Cuentas por Cobrar

**¿Puedo dar crédito a cualquier cliente?**
Solo si tiene límite de crédito configurado en su ficha.

**¿Cómo cobro una factura vencida?**
Vaya a Cuentas por Cobrar > Vencidas > Registrar Pago.

**¿Puedo generar un reporte de deudores?**
Sí, en Cuentas por Cobrar > Resumen > Exportar.

---

# 📞 SOPORTE

Si necesita ayuda adicional:

- **Email de soporte:** soporte@crm.com
- **Teléfono:** (809) 555-HELP
- **Horario:** Lunes a Viernes, 8:00 AM - 6:00 PM

---

**Versión del Manual:** 1.0  
**Última actualización:** Febrero 2026  
**Sistema:** CRM + Facturación v1.0.0
