# 🔐 CREDENCIALES DE ACCESO - AMBOS PANELES

## 🏢 PANEL CRM (TENANT) - Para usar el sistema CRM

### **URL de acceso:**
```
http://localhost:5174/login
```

### **Credenciales:**
```
Email:    admin@test.com
Password: admin123
```

**Usuario:** Admin User  
**Rol:** ADMINISTRATOR  
**Tenant:** demo

### **Qué puedes hacer:**
- ✅ Dashboard del CRM
- ✅ Módulo de Compras (`/purchases-test` para pruebas)
- ✅ Módulo de Ventas
- ✅ Inventario
- ✅ Clientes
- ✅ Proveedores
- ✅ Reportes
- ✅ Configuración

---

## 🌐 PANEL SAAS ADMIN - Para gestionar tenants

### **URL de acceso:**
```
http://localhost:5174/saas/login
```

### **Credenciales disponibles:**

#### **SUPER ADMIN (Recomendado):**
```
Email:    superadmin@crm.com
Password: (necesitas verificar o crear)
```
**Rol:** SUPER_ADMIN  
**Permisos:** Gestión completa de tenants

#### **Otros usuarios SaaS (SUPPORT):**
```
Email:    admin@miempresademo.com
Password: (necesitas verificar o crear)
```

```
Email:    admin@neypier.com
Password: (necesitas verificar o crear)
```

```
Email:    prueba@crm.com
Password: (necesitas verificar o crear)
```

### **Qué puedes hacer:**
- ✅ Ver lista de tenants
- ✅ Crear nuevos tenants
- ✅ Editar configuración de tenants
- ✅ Ver estadísticas del sistema
- ✅ Gestionar suscripciones

---

## ⚠️ PROBLEMA IDENTIFICADO

Los usuarios de SaaS Admin **NO tienen contraseña configurada** en la base de datos actual.

### **Solución rápida:**

Necesitas crear/actualizar la contraseña para el usuario SaaS Admin. Ejecuta:

```javascript
// Script para crear contraseña para superadmin
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function setPassword() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@localhost:5434/crm_master?schema=public'
      }
    }
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.masterUser.update({
    where: { email: 'superadmin@crm.com' },
    data: { password: hashedPassword }
  });

  console.log('✅ Password set for superadmin@crm.com');
  await prisma.$disconnect();
}

setPassword();
```

---

## 🎯 RECOMENDACIÓN

### **Para probar el módulo de compras AHORA:**

1. **Usa el panel CRM:**
   - URL: `http://localhost:5174/login`
   - Email: `admin@test.com`
   - Password: `admin123`

2. **Ve a la página de prueba:**
   - `http://localhost:5174/purchases-test`

3. **Prueba los botones:**
   - "Listar Compras (GET)"
   - "Crear Compra (POST)"

### **Para probar el panel SaaS Admin:**

Primero necesitas configurar la contraseña del usuario SaaS Admin ejecutando el script anterior.

---

## 📊 RESUMEN DE USUARIOS EN BD

### **Tabla `User` (Usuarios del CRM - Tenant):**
```
Email:              admin@test.com
Nombre:             Admin User
Rol:                ADMINISTRATOR
Estado:             Activo
Contraseña:         ✅ Configurada (admin123)
```

### **Tabla `MasterUser` (Usuarios SaaS Admin):**
```
1. superadmin@crm.com      - SUPER_ADMIN - ⚠️ Sin contraseña
2. admin@miempresademo.com - SUPPORT      - ⚠️ Sin contraseña
3. admin@neypier.com       - SUPPORT      - ⚠️ Sin contraseña
4. prueba@crm.com          - SUPPORT      - ⚠️ Sin contraseña
```
