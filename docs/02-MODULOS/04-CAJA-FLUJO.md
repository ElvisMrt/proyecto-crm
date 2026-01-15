# Flujo de Apertura y Gestión de Caja

## 📋 Esquema General

Este documento establece el flujo completo para la apertura, operación y cierre de caja, incluyendo la gestión de sucursales y usuarios.

---

## 🔄 Flujo Completo de Caja

### 1. **Apertura de Caja**

#### 1.1 Requisitos Previos
- ✅ Usuario autenticado en el sistema
- ✅ Sucursal seleccionada y disponible
- ✅ Permisos necesarios para abrir caja
- ✅ Efectivo físico contado y disponible

#### 1.2 Proceso de Apertura

```
┌─────────────────────────────────────────────────┐
│  PASO 1: Selección de Sucursal                   │
│  - El usuario selecciona la sucursal donde       │
│    trabajará                                     │
│  - Solo puede haber una caja abierta por         │
│    sucursal                                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 2: Ingreso de Monto Inicial                │
│  - Usuario ingresa el efectivo físico disponible │
│  - El sistema valida que sea >= 0                │
│  - Se muestra el monto formateado en RD$         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 3: Observaciones (Opcional)               │
│  - Usuario puede agregar notas adicionales      │
│  - Ejemplo: "Fondo de caja del día anterior"    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 4: Confirmación                            │
│  - Sistema valida:                               │
│    • No existe caja abierta para la sucursal     │
│    • Usuario tiene permisos                      │
│    • Monto inicial es válido                     │
│  - Se crea el registro de caja                  │
│  - Se registra movimiento de apertura           │
│  - Se asocia usuario y sucursal                  │
└─────────────────────────────────────────────────┘
```

#### 1.3 Información Registrada
- **Usuario que abre**: Se toma automáticamente del usuario autenticado
- **Sucursal**: Seleccionada por el usuario
- **Monto inicial**: Ingresado por el usuario
- **Fecha y hora**: Automática (timestamp)
- **Observaciones**: Opcional, ingresadas por el usuario

#### 1.4 Validaciones
- ❌ No puede haber dos cajas abiertas en la misma sucursal
- ❌ El monto inicial no puede ser negativo
- ❌ El usuario debe tener permisos para abrir caja
- ❌ Debe seleccionarse una sucursal válida

---

### 2. **Operación de Caja (Caja Abierta)**

#### 2.1 Estado Visual
Cuando la caja está abierta, se muestra:
- ✅ **Estado**: "Caja Abierta" (badge verde)
- 📍 **Sucursal**: Nombre de la sucursal
- 💰 **Balance Actual**: Monto calculado en tiempo real
- 👤 **Abierta por**: Nombre del usuario que abrió
- 📅 **Fecha de Apertura**: Fecha y hora de apertura
- 📊 **Resumen**: Ingresos y egresos del día

#### 2.2 Operaciones Disponibles
Con la caja abierta, el usuario puede:
- ✅ Realizar ventas (POS y facturas)
- ✅ Registrar pagos de clientes
- ✅ Registrar entradas manuales
- ✅ Registrar salidas manuales (con permisos)
- ✅ Ver movimientos en tiempo real
- ✅ Ver resumen diario

#### 2.3 Movimientos Automáticos
El sistema registra automáticamente:
- 💰 **Ventas**: Al procesar una venta en POS o crear factura al contado
- 💳 **Pagos**: Al registrar un pago de cuenta por cobrar
- 📝 **Apertura**: Al abrir la caja (movimiento inicial)

#### 2.4 Movimientos Manuales
El usuario puede registrar:
- ➕ **Entradas**: Ingresos adicionales (reembolsos, etc.)
- ➖ **Salidas**: Egresos (gastos menores, retiros, etc.)

---

### 3. **Cierre de Caja**

#### 3.1 Proceso de Cierre

```
┌─────────────────────────────────────────────────┐
│  PASO 1: Revisión de Resumen                    │
│  - Sistema muestra:                              │
│    • Monto inicial                                │
│    • Total ingresos                               │
│    • Total egresos                                │
│    • Balance esperado                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 2: Conteo Físico                          │
│  - Usuario cuenta el efectivo físico real        │
│  - Ingresa el monto contado                       │
│  - Sistema calcula diferencia automáticamente    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 3: Observaciones (Opcional)              │
│  - Usuario puede explicar diferencias            │
│  - Ejemplo: "Faltante por cambio no registrado"  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PASO 4: Confirmación                           │
│  - Usuario confirma el cierre                    │
│  - Sistema valida y cierra la caja               │
│  - Se registra movimiento de cierre             │
│  - La caja queda en estado "Cerrada"             │
└─────────────────────────────────────────────────┘
```

#### 3.2 Información del Cierre
- **Usuario que cierra**: Se toma automáticamente del usuario autenticado
- **Fecha y hora**: Automática (timestamp)
- **Monto final**: Ingresado por el usuario (conteo físico)
- **Diferencia**: Calculada automáticamente (faltante o sobrante)
- **Observaciones**: Opcional

#### 3.3 Validaciones
- ❌ Debe haber una caja abierta para cerrarla
- ❌ El conteo físico es obligatorio
- ❌ El usuario debe tener permisos para cerrar caja

---

## 🏢 Gestión de Sucursales

### Selección de Sucursal

#### En Apertura de Caja
- El usuario **debe** seleccionar una sucursal antes de abrir
- Solo se muestran sucursales activas
- Si solo hay una sucursal, se selecciona automáticamente
- Si no hay sucursales, se muestra un mensaje de error

#### Validación
- ✅ Solo puede haber una caja abierta por sucursal
- ✅ Las ventas se registran en la sucursal de la caja abierta
- ✅ Los movimientos se asocian a la sucursal de la caja

---

## 👤 Gestión de Usuarios

### Usuario Actual

#### Información Mostrada
En el formulario de apertura se muestra:
- **Nombre completo**: Del usuario autenticado
- **Email**: Del usuario autenticado
- **Rol**: Implícito (para validación de permisos)

#### Asociación con Caja
- **Usuario que abre**: Se asocia automáticamente al crear la caja
- **Usuario que cierra**: Se asocia automáticamente al cerrar la caja
- **Usuario en movimientos**: Se registra en cada movimiento manual

### Permisos

#### Para Abrir Caja
- ✅ **Administrador**: Puede abrir caja en cualquier sucursal
- ✅ **Supervisor**: Puede abrir caja en su sucursal asignada
- ✅ **Cajero**: Puede abrir caja (si tiene permiso específico)

#### Para Cerrar Caja
- ✅ **Administrador**: Puede cerrar cualquier caja
- ✅ **Supervisor**: Puede cerrar caja de su sucursal
- ❌ **Cajero**: No puede cerrar caja (normalmente)

#### Para Movimientos Manuales
- ✅ **Entradas**: Todos los usuarios con caja abierta
- ✅ **Salidas**: Solo Administrador y Supervisor

---

## 📊 Visualización del Estado

### Panel Principal de Caja

```
┌─────────────────────────────────────────────────────┐
│  Estado de Caja                                      │
│                                                       │
│  [Caja Abierta] o [Caja Cerrada]                    │
│                                                       │
│  ┌─────────────┬─────────────┬─────────────┬──────┐│
│  │ Sucursal    │ Balance     │ Abierta por │ Fecha││
│  │ Nombre      │ RD$ XX,XXX  │ Usuario     │ Hora ││
│  └─────────────┴─────────────┴─────────────┴──────┘│
│                                                       │
│  Ingresos: RD$ XX,XXX    Egresos: RD$ XX,XXX        │
└─────────────────────────────────────────────────────┘
```

### Indicadores Visuales
- 🟢 **Verde**: Caja abierta (operativa)
- 🔴 **Rojo**: Caja cerrada (no operativa)
- 📊 **Resumen**: Ingresos y egresos destacados

---

## 🔐 Reglas de Negocio

### Apertura
1. **Una caja por sucursal**: No puede haber dos cajas abiertas simultáneamente en la misma sucursal
2. **Usuario requerido**: Debe haber un usuario autenticado
3. **Sucursal requerida**: Debe seleccionarse una sucursal válida
4. **Monto inicial**: Debe ser >= 0
5. **Auditoría**: Todos los datos quedan registrados y no se pueden modificar

### Operación
1. **Ventas bloqueadas sin caja**: No se pueden realizar ventas si no hay caja abierta
2. **Movimientos en tiempo real**: Todos los movimientos se registran inmediatamente
3. **Balance calculado**: El balance se calcula automáticamente
4. **Asociación automática**: Los movimientos se asocian automáticamente a la caja abierta

### Cierre
1. **Caja abierta requerida**: Debe haber una caja abierta para cerrarla
2. **Conteo físico obligatorio**: El usuario debe ingresar el efectivo contado
3. **Diferencia registrada**: Las diferencias (faltantes/sobrantes) se registran
4. **Inmovilización**: Después del cierre, no se pueden agregar más movimientos

---

## 🎯 Flujo de Trabajo Recomendado

### Inicio del Día
1. Usuario inicia sesión
2. Va al módulo de Caja
3. Selecciona su sucursal
4. Cuenta el efectivo físico
5. Ingresa el monto inicial
6. Abre la caja
7. ✅ Listo para operar

### Durante el Día
1. Realiza ventas normalmente
2. Registra pagos de clientes
3. Registra entradas/salidas manuales si es necesario
4. Monitorea el balance en tiempo real

### Fin del Día
1. Revisa el resumen de movimientos
2. Cuenta el efectivo físico
3. Ingresa el monto contado
4. Revisa la diferencia (si hay)
5. Agrega observaciones si es necesario
6. Cierra la caja
7. ✅ Jornada completada

---

## 📝 Notas Importantes

1. **Auditoría Completa**: Todos los movimientos quedan registrados con usuario, fecha y hora
2. **No se puede editar**: Una vez abierta o cerrada, la caja no se puede modificar
3. **Multi-sucursal**: Cada sucursal tiene su propia caja independiente
4. **Permisos**: Los permisos se validan en cada acción
5. **Validaciones**: El sistema valida todas las reglas antes de permitir acciones

---

## 🔗 Relación con Otros Módulos

### Ventas
- ✅ Requiere caja abierta para procesar ventas
- ✅ Registra automáticamente ingresos por ventas
- ✅ Asocia ventas a la sucursal de la caja abierta

### Cuentas por Cobrar
- ✅ Registra automáticamente ingresos por pagos
- ✅ Asocia pagos a la sucursal de la caja abierta

### Reportes
- ✅ Utiliza información de caja para reportes financieros
- ✅ Filtra por sucursal y usuario

---

**Última actualización**: Enero 2025











