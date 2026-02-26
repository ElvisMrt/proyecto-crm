# 🚀 Guía de Deployment - neypier.com (Hostinger VPS)

## 📋 Requisitos

- Hostinger VPS (recomendado: Business Cloud o superior)
- Ubuntu 20.04/22.04 LTS
- 4GB+ RAM (8GB recomendado para múltiples tenants)
- Dominio apuntado al VPS

---

## 1️⃣ Configuración DNS en Hostinger

### En el panel de Hostinger (DNS Zone Editor):

```
Type: A
Name: @
Value: [TU_IP_DEL_VPS]
TTL: 3600

Type: A
Name: *
Value: [TU_IP_DEL_VPS]
TTL: 3600

Type: CNAME (opcional para www)
Name: www
Value: neypier.com
TTL: 3600
```

> **Nota**: El wildcard `*` es CRUCIAL para los subdominios de tenants.

---

## 2️⃣ Preparar el VPS

### Conectar por SSH:
```bash
ssh root@[TU_IP]
```

### Instalar Docker y Docker Compose:
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install -y docker-compose-plugin

# Verificar
docker --version
docker compose version
```

---

## 3️⃣ Configurar SSL (Let's Encrypt)

### Instalar Certbot:
```bash
apt install -y certbot

# Generar certificado wildcard
# (Requiere validación DNS en Hostinger)
certbot certonly --manual --preferred-challenges dns \
  -d "neypier.com" \
  -d "*.neypier.com"
```

### Configurar auto-renovación:
```bash
crontab -e

# Agregar:
0 3 * * * certbot renew --quiet --deploy-hook "docker compose -f /root/neypier/docker-compose.prod.yml restart nginx"
```

---

## 4️⃣ Deploy del Proyecto

### Clonar/Subir el proyecto:
```bash
cd /root
mkdir neypier
cd neypier

# Copiar archivos del proyecto (via SCP o git)
# Ejemplo con SCP desde local:
# scp -r /Users/user/Documents/proyecto-crm/* root@[TU_IP]:/root/neypier/
```

### Configurar variables de entorno:
```bash
cat > .env << 'EOF'
# Base de datos
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/crm_master

# JWT
JWT_SECRET=tu-secreto-muy-largo-y-seguro-aqui-2026
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://neypier.com

# Email SMTP (ejemplo con Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=NeyPier CRM <noreply@neypier.com>

# Producción
NODE_ENV=production
PORT=3000
EOF
```

---

## 5️⃣ Iniciar Servicios

```bash
# Producción
docker compose -f docker-compose.prod.yml up -d

# Verificar logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 6️⃣ Crear Superadmin

```bash
docker compose exec -T backend npx tsx src/scripts/createSuperAdmin.ts \
  --email=superadmin@neypier.com \
  --password=tu-password-segura \
  --name="Super Admin"
```

---

## 🔧 Troubleshooting

### Verificar puertos:
```bash
netstat -tulpn | grep -E '(80|443|3000|5173)'
```

### Verificar DNS propagación:
```bash
nslookup admin.neypier.com
nslookup mi-empresa.neypier.com
```

### Reiniciar servicios:
```bash
docker compose restart
docker compose down && docker compose up -d
```

### Ver logs:
```bash
# Backend
docker compose logs backend --tail 50

# Nginx
docker compose logs nginx --tail 50
```

---

## 📞 URLs de Producción

| URL | Descripción |
|-----|-------------|
| https://neypier.com | Panel SaaS Admin |
| https://admin.neypier.com | Panel SaaS (alternativo) |
| https://[tenant].neypier.com | CRM del tenant |

---

## 💰 Costos Estimados (Hostinger)

| Plan | Precio/mes | Tenants soportados |
|------|-----------|-------------------|
| Business Cloud | ~$8-10 | 5-10 tenants |
| Cloud Startup | ~$15-20 | 20-50 tenants |
| Enterprise | ~$30-50 | 100+ tenants |

---

## 🔒 Seguridad Checklist

- [ ] Cambiar puerto SSH (22 → otro)
- [ ] Configurar firewall UFW
- [ ] Deshabilitar root login SSH
- [ ] Usar claves SSH (no password)
- [ ] Fail2ban instalado
- [ ] Backups automáticos configurados
- [ ] SSL/TLS activado (Let's Encrypt)

---

## 📚 Comandos Útiles

```bash
# Ver uso de recursos
docker stats

# Backup de DB
docker compose exec postgres pg_dump -U postgres crm_master > backup.sql

# Restaurar DB
cat backup.sql | docker compose exec -T postgres psql -U postgres crm_master

# Limpiar Docker
docker system prune -a
```

---

**¿Necesitas ayuda?**
- Documentación: `/docs/PRODUCTION-DEPLOY.md`
- Soporte: soporte@neypier.com
