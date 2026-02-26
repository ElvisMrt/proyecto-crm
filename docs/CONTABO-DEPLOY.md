# 🚀 Guía de Deployment - neypier.com (Contabo VPS)

> **Contabo** ofrece VPS con mejor relación precio/recursos que Hostinger
> - 8GB RAM VPS desde €5.99/mes
> - 16GB RAM VPS desde €10.99/mes
> - Incluye backup automático

---

## 📋 Requisitos Contabo

| Plan | RAM | CPU | Storage | Precio/mes |
|------|-----|-----|---------|-----------|
| VPS 1 | 8GB | 4 vCores | 200GB SSD | €5.99 |
| VPS 2 | 16GB | 6 vCores | 400GB SSD | €10.99 |
| VPS 3 | 30GB | 8 vCores | 800GB SSD | €20.99 |

**Recomendado**: VPS 1 (8GB) para 20-50 tenants. VPS 2 (16GB) para 100+ tenants.

---

## 1️⃣ Comprar VPS en Contabo

1. Ir a: https://contabo.com/en/vps/
2. Seleccionar: **VPS S (8GB RAM)** o superior
3. **Región**: US East (New York) o US Central (St. Louis) para mejor latencia desde RD
4. **Sistema**: Ubuntu 22.04 LTS (recomendado)
5. **Backup**: Activar (€2.99/mes - opcional pero recomendado)
6. Completar pago

---

## 2️⃣ Acceso al VPS

### Datos de acceso (llegan por email):
```
IP: [TU_IP]
Usuario: root
Password: [TU_PASSWORD]
```

### Conectar por SSH:
```bash
ssh root@[TU_IP]
```

---

## 3️⃣ Preparar VPS

### Actualizar sistema:
```bash
apt update && apt upgrade -y
```

### Instalar Docker:
```bash
# Desinstalar versiones antiguas (si existen)
apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependencias
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar
docker --version
docker compose version
```

### Configurar firewall:
```bash
# Instalar UFW
apt install -y ufw

# Configurar reglas
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Backend API (opcional, solo si expuesto directo)

# Activar
ufw --force enable
ufw status
```

---

## 4️⃣ Configurar SSL (Let's Encrypt)

### Instalar Certbot:
```bash
apt install -y certbot
```

### Generar certificado wildcard:
```bash
# Este comando te pedirá crear un registro TXT en tu DNS
certbot certonly --manual --preferred-challenges dns \
  -d "neypier.com" \
  -d "*.neypier.com" \
  --agree-tos \
  --email admin@neypier.com
```

### Copiar certificados a nginx:
```bash
mkdir -p /root/neypier/nginx/ssl
cp /etc/letsencrypt/live/neypier.com/fullchain.pem /root/neypier/nginx/ssl/neypier.com.crt
cp /etc/letsencrypt/live/neypier.com/privkey.pem /root/neypier/nginx/ssl/neypier.com.key
```

### Auto-renovación:
```bash
crontab -e

# Agregar línea:
0 3 * * * certbot renew --quiet --deploy-hook "cp /etc/letsencrypt/live/neypier.com/*.pem /root/neypier/nginx/ssl/ && docker compose -f /root/neypier/docker-compose.prod.yml restart nginx"
```

---

## 5️⃣ Configurar DNS (donde tengas el dominio)

Independiente de dónde compraste el dominio (Namecheap, GoDaddy, Cloudflare, etc.):

```
Type: A
Name: @
Value: [IP_DE_CONTABO]
TTL: 3600

Type: A
Name: *
Value: [IP_DE_CONTABO]
TTL: 3600
```

> ⚠️ **Importante**: El wildcard `*` permite que cualquier subdominio (tenant.neypier.com) funcione.

---

## 6️⃣ Deploy del Proyecto

### Subir archivos al VPS:
```bash
# Desde tu máquina local (Mac):
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /Users/user/Documents/proyecto-crm/ \
  root@[IP_CONTABO]:/root/neypier/
```

O si prefieres usar git:
```bash
# En tu VPS:
cd /root
apt install -y git
git clone [TU_REPOSITORIO] neypier
cd neypier
```

### Configurar variables de entorno:
```bash
cd /root/neypier
cat > .env << 'EOF'
# Base de datos
POSTGRES_PASSWORD=password-seguro-aqui-1234
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/crm_master

# JWT (generar con: openssl rand -base64 64)
JWT_SECRET=generar-secreto-largo-aqui-con-openssl
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://neypier.com

# Email SMTP (ejemplo con Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-gmail
SMTP_FROM=NeyPier CRM <noreply@neypier.com>

# Producción
NODE_ENV=production
PORT=3000
EOF
```

### Generar secreto JWT:
```bash
# Generar un secreto seguro
openssl rand -base64 64
# Copiar el resultado en JWT_SECRET en el archivo .env
```

---

## 7️⃣ Iniciar Servicios

```bash
cd /root/neypier

# Construir e iniciar
docker compose -f docker-compose.prod.yml up -d --build

# Verificar estado
docker compose ps
docker compose logs -f backend
```

---

## 8️⃣ Crear Superadmin

```bash
docker compose exec -T backend npx prisma db push

docker compose exec -T backend npx tsx << 'EOF'
import bcrypt from 'bcryptjs';
import { masterPrisma } from './src/middleware/tenant.middleware';

async function createSuperAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await masterPrisma.masterUser.create({
    data: {
      email: 'superadmin@neypier.com',
      password: hashedPassword,
      name: 'Super Administrador',
      role: 'SUPER_ADMIN',
    },
  });
  
  console.log('Superadmin creado:', user.email);
  process.exit(0);
}

createSuperAdmin();
EOF
```

---

## 9️⃣ Verificar Instalación

### Comandos útiles:
```bash
# Verificar contenedores
docker compose ps

# Ver logs
docker compose logs backend --tail 50
docker compose logs nginx --tail 20

# Verificar bases de datos
docker compose exec postgres psql -U postgres -l | grep crm_

# Espacio en disco
df -h

# Uso de recursos
docker stats --no-stream
```

### URLs de prueba:
```
https://neypier.com              → Panel SaaS Admin
https://mi-empresa.neypier.com   → CRM de un tenant
```

---

## 🔧 Troubleshooting Contabo

### Firewall bloqueando:
```bash
ufw status
ufw allow 80,443/tcp
```

### Docker no inicia:
```bash
systemctl enable docker
systemctl start docker
systemctl status docker
```

### Puerto 3000 no accesible:
Contabo bloquea algunos puertos. Usa solo 80 y 443 (nginx los maneja).

### Certificado SSL:
```bash
# Verificar certificado
certbot certificates

# Renovación manual
certbot renew
```

---

## 💰 Costos Mensuales Estimados (Contabo)

| Servicio | Costo/mes |
|----------|-----------|
| VPS 1 (8GB) | €5.99 (~$6.50) |
| Backup (opcional) | €2.99 (~$3.25) |
| Dominio .com | ~$10-15/año |
| **Total** | **~$10-12/mes** |

---

## 🔒 Seguridad Adicional

```bash
# Cambiar puerto SSH (opcional pero recomendado)
nano /etc/ssh/sshd_config
# Cambiar: Port 22 → Port 2222
# Reiniciar: systemctl restart sshd

# Instalar fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Deshabilitar login root por password (usar claves SSH)
nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
```

---

## 📞 Soporte Contabo

- **Email**: support@contabo.com
- **Panel**: https://my.contabo.com
- **Docs**: https://docs.contabo.com/

---

## 🚀 Comandos Rápidos (Guardar)

```bash
# Deploy completo
cd /root/neypier && docker compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker compose logs -f

# Backup
docker compose exec postgres pg_dump -U postgres crm_master > backup_$(date +%Y%m%d).sql

# Actualizar (después de cambios)
docker compose down && docker compose up -d --build
```

---

**¿Listo para deploy? Compra el VPS en Contabo y sigue esta guía paso a paso.**
