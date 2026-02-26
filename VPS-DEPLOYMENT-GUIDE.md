# 🚀 **GUÍA COMPLETA DE DESPLIEGUE EN VPS**

## 📋 **PREPARACIÓN ANTES DEL DESPLIEGUE**

### **✅ **Requisitos Previos:**
1. **🔑 Acceso SSH** a tu VPS
2. **🌐 Dominio configurado** (opcional pero recomendado)
3. **📧 Cuenta de email** para SMTP (Gmail, SendGrid, etc.)
4. **💳 VPS con al menos 2GB RAM y 20GB storage**

---

## 🛠️ **PASO 1 - CONEXIÓN Y PREPARACIÓN VPS**

### **✅ **Conectar a VPS:**
```bash
# Conectar via SSH
ssh usuario@tu-vps-ip

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip
```

### **✅ **Instalar Docker:**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

---

## 📁 **PASO 2 - SUBIR ARCHIVOS AL VPS**

### **✅ **Opción 1 - Git Clone:**
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/proyecto-crm.git
cd proyecto-crm
```

### **✅ **Opción 2 - SCP/SFTP:**
```bash
# Subir archivos desde local
scp -r /Users/user/Documents/proyecto-crm usuario@tu-vps-ip:/home/usuario/

# Conectar y mover a directorio adecuado
ssh usuario@tu-vps-ip
sudo mv /home/usuario/proyecto-crm /opt/
cd /opt/proyecto-crm
```

---

## ⚙️ **PASO 3 - CONFIGURAR VARIABLES DE ENTORNO**

### **✅ **Ejecutar Script de Despliegue:**
```bash
# Hacer ejecutable el script
chmod +x deploy-vps.sh

# Ejecutar despliegue
./deploy-vps.sh
```

### **✅ **O Configurar Manualmente:**
```bash
# Crear archivo .env
nano .env
```

**Contenido del archivo .env:**
```bash
# Base de Datos
POSTGRES_PASSWORD=tu-contraseña-segura-aqui
POSTGRES_DB=crm_master

# JWT
JWT_SECRET=tu-jwt-secret-muy-largo-aqui
JWT_EXPIRES_IN=7d

# Configuración
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-dominio.com

# Email SMTP (Ejemplo Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-gmail
SMTP_FROM=noreply@tu-dominio.com

# Email administrador
ADMIN_EMAIL=admin@tu-dominio.com

# Dominio (para SSL)
DOMAIN=tu-dominio.com
```

---

## 🚀 **PASO 4 - DESPLEGAR APLICACIÓN**

### **✅ **Construir y Desplegar:**
```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose -f docker-compose.prod.yml ps
```

### **✅ **Verificar Funcionamiento:**
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Probar backend
curl http://localhost:3000/health

# Verificar base de datos
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d crm_master -c "\dt"
```

---

## 🔐 **PASO 5 - CONFIGURAR SSL (OPCIONAL)**

### **✅ **Con Dominio Configurado:**
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com --non-interactive --agree-tos --email admin@tu-dominio.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📧 **PASO 6 - CONFIGURAR EMAIL**

### **✅ **Gmail SMTP:**
1. **Activar 2FA** en tu cuenta Gmail
2. **Generar App Password:**
   - Ir a Google Account → Security → 2-Step Verification → App passwords
   - Generar password para "Mail"
3. **Usar en .env:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password-generado
   ```

### **✅ **SendGrid (Alternativa):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.api-key-generado
```

---

## 🔍 **PASO 7 - VERIFICACIÓN FINAL**

### **✅ **Acceder a la Aplicación:**
```
🌐 Frontend: https://tu-dominio.com
🔧 Backend API: https://tu-dominio.com/api/v1
📧 Formularios Públicos: https://tu-dominio.com/public/
📄 Formulario Citas: https://tu-dominio.com/appointment-form.html
```

### **✅ **Probar Funcionalidades:**
1. **👤 Crear usuario** en el sistema
2. **📧 Probar notificaciones** por email
3. **📊 Crear clientes y ventas**
4. **📅 Probar formulario de citas** externo
5. **📋 Verificar dashboard** y reportes

---

## 🛠️ **COMANDOS DE MANTENIMIENTO**

### **✅ **Operaciones Comunes:**
```bash
# Ver estado de contenedores
docker-compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Actualizar aplicación
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Backup de base de datos
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres crm_master > backup-$(date +%Y%m%d).sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres crm_master < backup-20240220.sql
```

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **✅ **Problemas Comunes:**

#### **❌ Contenedores no inician:**
```bash
# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Reconstruir imágenes
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

#### **❌ Error de conexión a BD:**
```bash
# Verificar contenedor postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d crm_master -c "SELECT 1;"

# Reiniciar postgres
docker-compose -f docker-compose.prod.yml restart postgres
```

#### **❌ Email no funciona:**
```bash
# Probar conexión SMTP
telnet smtp.gmail.com 587

# Verificar variables
docker-compose -f docker-compose.prod.yml exec backend env | grep SMTP
```

#### **❌ SSL no funciona:**
```bash
# Verificar certificados
sudo certbot certificates

# Reemitir certificado
sudo certbot --nginx -d tu-dominio.com --force-renewal
```

---

## 📊 **MONITOREO Y ALERTAS**

### **✅ **Configurar Monitoreo Básico:**
```bash
# Instalar herramientas de monitoreo
sudo apt install -y htop iotop nethogs

# Script de health check
cat > health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "CRM DOWN - $(date)" | mail -s "CRM Alert" admin@tu-dominio.com
    docker-compose -f /opt/proyecto-crm/docker-compose.prod.yml restart
fi
EOF

# Agregar a crontab (cada 5 minutos)
echo "*/5 * * * * /opt/proyecto-crm/health-check.sh" | crontab -
```

---

## 🔄 **ACTUALIZACIONES**

### **✅ **Actualizar Sistema:**
```bash
# Actualizar código
cd /opt/proyecto-crm
git pull origin main

# Reconstruir y desplegar
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verificar actualización
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/health
```

---

## 🎯 **RESUMEN FINAL**

### **✅ **URLs de Acceso:**
- **🌐 Aplicación Principal:** `https://tu-dominio.com`
- **📧 Formulario Citas:** `https://tu-dominio.com/appointment-form.html`
- **📋 Ejemplos:** `https://tu-dominio.com/example-usage.html`
- **🔧 API:** `https://tu-dominio.com/api/v1`
- **📊 API Pública:** `https://tu-dominio.com/api/public`

### **✅ **Credenciales Iniciales:**
- **👤 Usuario:** Crear desde la interfaz
- **🔑 Contraseña:** Definir al crear usuario
- **🗄️ BD:** postgres / tu-contraseña
- **📧 Email:** Configurar en .env

---

**🎉 ¡Tu CRM estará completamente funcional en producción!**

**El sistema incluye todas las características: gestión de clientes, ventas, compras, inventario, citas con formularios externos, y notificaciones automáticas.** 🚀✨
