# Sistema de Roles y Permisos

Este documento define el sistema de control de acceso basado en roles (RBAC) del sistema.

---

## 🎯 Objetivo

Controlar el acceso a funcionalidades del sistema mediante roles predefinidos y permisos granulares, garantizando que cada usuario solo pueda realizar las acciones permitidas según su rol.

---

## 🏗️ Arquitectura del Sistema de Permisos

### Componentes

1. **Roles:** Roles predefinidos con conjuntos de permisos
2. **Permisos:** Acciones específicas sobre recursos
3. **Usuarios:** Asociados a un rol
4. **Middleware:** Validación de permisos en cada request

### Flujo de Validación

```
Request → JWT Validation → Extract User & Role → Check Permissions → Allow/Deny
```

---

## 👥 Roles del Sistema

### 1. Administrador (ADMINISTRATOR)

**Descripción:** Acceso completo a todas las funcionalidades del sistema.

**Características:**
- Puede realizar cualquier acción
- Puede gestionar usuarios y roles
- Puede ver todos los reportes y métricas
- Puede configurar parámetros del sistema

**Uso típico:** Propietario de la empresa, Gerente General

---

### 2. Supervisor (SUPERVISOR)

**Descripción:** Acceso amplio para supervisar operaciones, con algunas restricciones administrativas.

**Características:**
- Puede ver y gestionar operaciones diarias
- Puede anular facturas
- Puede cerrar cajas
- Puede ajustar inventario
- Puede ver reportes y métricas
- NO puede gestionar usuarios (excepto operadores bajo su supervisión)
- NO puede modificar configuraciones críticas

**Uso típico:** Gerente de Operaciones, Supervisor de Tienda

---

### 3. Operador (OPERATOR)

**Descripción:** Acceso para operaciones diarias básicas.

**Características:**
- Puede crear ventas y facturas
- Puede registrar pagos
- Puede ver información de clientes
- Puede consultar inventario
- Puede ver estado de caja
- NO puede anular facturas fiscales
- NO puede cerrar cajas
- NO puede ajustar inventario
- NO puede ver reportes globales

**Uso típico:** Vendedor, Asistente de ventas

---

### 4. Cajero (CASHIER)

**Descripción:** Acceso limitado para operaciones de caja y ventas básicas.

**Características:**
- Puede usar POS
- Puede registrar pagos
- Puede abrir caja (su propia caja)
- Puede ver movimientos de caja
- NO puede cerrar caja (requiere supervisor)
- NO puede anular facturas
- NO puede ver reportes
- NO puede ajustar inventario

**Uso típico:** Cajero de tienda

---

## 🔐 Permisos Granulares

Los permisos siguen el formato: `{módulo}:{acción}`

### Módulos y Acciones

#### Dashboard
- `dashboard:read` - Ver dashboard

#### Ventas
- `sales:read` - Ver facturas y cotizaciones
- `sales:create` - Crear facturas y cotizaciones
- `sales:update` - Editar facturas (solo borradores)
- `sales:delete` - Eliminar borradores
- `sales:cancel` - Anular facturas emitidas
- `sales:print` - Imprimir facturas
- `sales:send` - Enviar por WhatsApp/Email
- `sales:ncf` - Emitir NCF
- `sales:pos` - Usar Punto de Venta
- `sales:credit-note` - Crear notas de crédito

#### Cuentas por Cobrar
- `receivables:read` - Ver cuentas por cobrar
- `receivables:payment:create` - Registrar pagos
- `receivables:payment:delete` - Eliminar/revertir pagos
- `receivables:overdue:read` - Ver facturas vencidas
- `receivables:reminder:send` - Enviar recordatorios
- `receivables:report:read` - Ver reportes de CxC

#### Caja
- `cash:read` - Ver movimientos de caja
- `cash:open` - Abrir caja
- `cash:close` - Cerrar caja
- `cash:movement:create` - Registrar movimientos manuales
- `cash:movement:delete` - Eliminar movimientos
- `cash:history:read` - Ver historial de cajas

#### Inventario
- `inventory:read` - Ver productos y stock
- `inventory:product:create` - Crear productos
- `inventory:product:update` - Editar productos
- `inventory:product:delete` - Eliminar productos
- `inventory:stock:read` - Ver stock
- `inventory:movement:read` - Ver kardex
- `inventory:adjust:create` - Crear ajustes de inventario
- `inventory:adjust:delete` - Eliminar ajustes

#### Clientes
- `clients:read` - Ver clientes
- `clients:create` - Crear clientes
- `clients:update` - Editar clientes
- `clients:delete` - Eliminar clientes

#### CRM
- `crm:read` - Ver tareas y seguimientos
- `crm:task:create` - Crear tareas
- `crm:task:update` - Editar tareas
- `crm:task:delete` - Eliminar tareas

#### Reportes
- `reports:read` - Ver reportes
- `reports:export` - Exportar reportes

#### Configuración
- `settings:read` - Ver configuración
- `settings:update` - Modificar configuración
- `settings:users:read` - Ver usuarios
- `settings:users:create` - Crear usuarios
- `settings:users:update` - Editar usuarios
- `settings:users:delete` - Eliminar usuarios
- `settings:roles:read` - Ver roles
- `settings:roles:update` - Modificar roles

---

## 📋 Matriz de Permisos por Rol

| Permiso | Administrador | Supervisor | Operador | Cajero |
|---------|--------------|------------|----------|--------|
| `dashboard:read` | ✅ | ✅ | ✅ | ✅ |
| `sales:read` | ✅ | ✅ | ✅ | ✅ |
| `sales:create` | ✅ | ✅ | ✅ | ✅ |
| `sales:cancel` | ✅ | ✅ | ❌ | ❌ |
| `sales:ncf` | ✅ | ✅ | ✅ | ✅ |
| `sales:pos` | ✅ | ✅ | ✅ | ✅ |
| `sales:credit-note` | ✅ | ✅ | ❌ | ❌ |
| `receivables:read` | ✅ | ✅ | ✅* | ✅* |
| `receivables:payment:create` | ✅ | ✅ | ✅ | ✅ |
| `receivables:overdue:read` | ✅ | ✅ | ❌ | ❌ |
| `receivables:report:read` | ✅ | ✅ | ❌ | ❌ |
| `cash:read` | ✅ | ✅ | ✅ | ✅ |
| `cash:open` | ✅ | ✅ | ✅ | ✅ |
| `cash:close` | ✅ | ✅ | ❌ | ❌ |
| `cash:movement:create` | ✅ | ✅ | ✅ | ✅ |
| `inventory:read` | ✅ | ✅ | ✅ | ✅ |
| `inventory:product:create` | ✅ | ✅ | ❌ | ❌ |
| `inventory:adjust:create` | ✅ | ✅ | ❌ | ❌ |
| `clients:read` | ✅ | ✅ | ✅ | ✅ |
| `clients:create` | ✅ | ✅ | ✅ | ✅ |
| `reports:read` | ✅ | ✅ | ❌ | ❌ |
| `settings:users:create` | ✅ | ✅* | ❌ | ❌ |
| `settings:update` | ✅ | ❌ | ❌ | ❌ |

*Permisos limitados (solo sus clientes o usuarios bajo su supervisión)

---

## 🔒 Implementación Técnica

### Estructura en Base de Datos

```typescript
// Modelo Role
{
  id: string;
  name: string;
  permissions: string[]; // Array de permisos
}

// Modelo User
{
  id: string;
  roleId: string;
  role: Role;
}
```

### Middleware de Validación

```typescript
// Ejemplo conceptual
function requirePermission(permission: string) {
  return async (req, res, next) => {
    const user = req.user; // Extraído del JWT
    const role = await getRole(user.roleId);
    
    if (!role.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}
```

### Uso en Endpoints

```typescript
// Ejemplo
router.post('/sales/invoices/:id/cancel',
  authenticate,
  requirePermission('sales:cancel'),
  cancelInvoiceController
);
```

---

## 🛡️ Validaciones Adicionales

### Validaciones de Contexto

Además de permisos, se validan:

1. **Tenant Context:**
   - Usuario solo puede acceder a datos de su tenant
   - Validación automática en middleware

2. **Sucursal/Branch:**
   - Algunos usuarios solo pueden acceder a su sucursal
   - Validación opcional según configuración

3. **Ownership:**
   - Algunos recursos solo pueden ser modificados por su creador
   - Ejemplo: Un cajero solo puede modificar sus propias cajas

---

## 📝 Reglas de Negocio

### Reglas Importantes

1. **Un usuario solo puede tener un rol**
   - Los roles no se pueden combinar
   - Si necesita múltiples roles, crear roles personalizados

2. **Los permisos se asignan al rol, no al usuario**
   - Facilita gestión masiva
   - Evita inconsistencias

3. **Los permisos son acumulativos**
   - Si un rol tiene `sales:read`, también puede ver el listado
   - No hay permisos "negativos"

4. **Validación en Backend y Frontend**
   - Backend: Validación obligatoria (seguridad)
   - Frontend: Validación para UX (ocultar botones no permitidos)

---

## 🔄 Flujo de Asignación de Permisos

### Proceso Típico

1. **Administrador crea/edita rol**
   - Selecciona permisos del listado
   - Guarda rol

2. **Administrador asigna rol a usuario**
   - Al crear usuario
   - Al editar usuario existente

3. **Sistema valida permisos**
   - En cada request
   - Al cargar interfaz (frontend)

---

## 🚨 Casos Especiales

### Permisos Temporales
- (Fase futura) Permitir permisos temporales
- Ejemplo: Permitir a un operador cerrar caja solo el día X

### Permisos por Sucursal
- (Fase futura) Restringir acceso por sucursal
- Ejemplo: Supervisor solo puede ver su sucursal

### Delegación de Permisos
- (Fase futura) Permitir delegación temporal
- Ejemplo: Supervisor delega permiso de cierre a operador

---

## 📊 Auditoría de Permisos

### Registro de Acciones

Todas las acciones críticas se registran en `AuditLog`:
- Usuario
- Acción realizada
- Permiso utilizado
- Resultado (éxito/fallo)
- Fecha y hora

### Reportes de Auditoría

- Accesos denegados
- Acciones por usuario
- Uso de permisos por rol

---

## 🔐 Mejores Prácticas

1. **Principio de Menor Privilegio:**
   - Asignar solo los permisos necesarios
   - Revisar periódicamente

2. **Validación en Múltiples Capas:**
   - Frontend (UX)
   - Backend (Seguridad)
   - Base de datos (Última línea)

3. **Documentación Clara:**
   - Documentar qué hace cada permiso
   - Mantener matriz actualizada

4. **Testing:**
   - Probar cada permiso
   - Verificar que las restricciones funcionan

---

**Última actualización:** [Fecha]



