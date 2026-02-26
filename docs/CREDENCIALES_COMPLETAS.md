# 🔐 CREDENCIALES DE ACCESO - SISTEMA COMPLETO

## 📊 RESUMEN

- **1 Tenant** activo en el sistema
- **1 Usuario CRM** activo (tenant "demo")
- **1 Super Admin** para panel SaaS

---

## 🌐 PANEL SAAS ADMIN

### **Acceso:**
```
URL:      http://localhost:5174/login?mode=saas
Email:    superadmin@crm.com
Password: admin123
```

**Descripción:**
- Panel de administración global del SaaS
- Gestión de tenants, facturación, backups
- Requiere rol `SUPER_ADMIN`

---

## 🏢 PANEL CRM (TENANT)

### **Acceso Principal:**
```
URL:      http://localhost:5174/login
Email:    admin@test.com
Password: admin123
```

**Descripción:**
- Panel CRM del tenant "demo"
- Usuario: Admin User
- Rol: ADMINISTRATOR
- Acceso completo al sistema CRM

---

## 📋 TENANT ACTIVO

### **Mi Empresa Demo ✅**
```
Slug:       demo-tenant
Subdomain:  demo
Email:      admin@demo.com
Status:     ACTIVE
Plan:       BASIC
```
**Usuario CRM:**
- Email: `admin@test.com`
- Password: `admin123`
- Name: Admin User
- Role: ADMINISTRATOR
- ✅ **ESTE ES EL TENANT QUE ESTÁS USANDO**

---

## 🔧 ARQUITECTURA MULTI-TENANT

### **Configuración Actual:**

1. **Base de Datos Master:**
   - Tabla `Tenant`: Información de los tenants
   - Tabla `MasterUser`: Usuarios administradores de tenants (rol SUPPORT) y Super Admin (rol SUPER_ADMIN)

2. **Base de Datos Tenant:**
   - Tabla `User`: Usuarios del CRM (ADMINISTRATOR, SUPERVISOR, OPERATOR)
   - Todas las tablas del CRM (Client, Invoice, Purchase, etc.)

3. **Detección de Tenant:**
   - En localhost: Se usa subdomain "demo" por defecto
   - En producción: Se detecta por subdomain (ej: `mi-empresa.neypier.com`)

---

## 🚀 CÓMO ACCEDER

### **Panel SaaS Admin:**
1. Ir a: `http://localhost:5174/login?mode=saas`
2. Login: `superadmin@crm.com` / `admin123`
3. Acceso a gestión de tenants

### **Panel CRM (Tenant Demo):**
1. Ir a: `http://localhost:5174/login`
2. Login: `admin@test.com` / `admin123`
3. Acceso completo al CRM

---

## ⚠️ NOTAS IMPORTANTES

1. **Usuarios MasterUser vs Usuarios CRM:**
   - `MasterUser`: Administradores de tenants, autenticación en tabla master
   - `User`: Usuarios del CRM, autenticación en base de datos del tenant

2. **Tenant Único:**
   - Solo hay un tenant activo: "demo"
   - Tiene 1 usuario CRM provisionado: `admin@test.com`

3. **Contraseñas:**
   - Todas las contraseñas están hasheadas con bcrypt
   - La contraseña `admin123` fue configurada manualmente

4. **Localhost:**
   - Por defecto usa tenant "demo"
   - Para SaaS Admin: agregar `?mode=saas`
   - Para CRM: acceso directo sin parámetros

---

## 📝 SCRIPTS ÚTILES

### **Listar tenants:**
```bash
cd backend
node list-tenants.js
```

### **Listar usuarios CRM:**
```bash
cd backend
node list-tenant-users.js
```

### **Configurar contraseña Super Admin:**
```bash
cd backend
node set-superadmin-password.js
```

---

**Última actualización:** 19 de febrero de 2026
