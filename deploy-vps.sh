#!/bin/bash

# ============================================
# SCRIPT DE DESPLIEGUE CRM EN VPS
# ============================================

set -e

echo "🚀 Iniciando despliegue del CRM en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en VPS
check_vps() {
    log_info "Verificando entorno de VPS..."
    
    if [ ! -f /.dockerenv ]; then
        log_info "No estamos en Docker, continuando..."
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    
    log_success "Entorno verificado correctamente"
}

# Crear estructura de directorios
setup_directories() {
    log_info "Creando estructura de directorios..."
    
    mkdir -p nginx/conf.d
    mkdir -p nginx/ssl
    mkdir -p nginx/logs
    mkdir -p backups
    mkdir -p uploads
    
    log_success "Directorios creados"
}

# Generar archivo .env
setup_env() {
    log_info "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# ============================================
# CONFIGURACIÓN CRM - PRODUCCIÓN
# ============================================

# Base de Datos
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=crm_master

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d

# Configuración del Servidor
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-dominio.com

# Email SMTP (Configurar con tus datos)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@tu-dominio.com

# Email para notificaciones
ADMIN_EMAIL=admin@tu-dominio.com

# Dominio (Opcional - para SSL)
DOMAIN=tu-dominio.com
EOF
        log_warning "Archivo .env creado. Por favor edita las configuraciones de SMTP y dominio"
        log_info "Edita el archivo .env antes de continuar"
        read -p "Presiona Enter para continuar..."
    else
        log_success "Archivo .env ya existe"
    fi
}

# Configurar Nginx
setup_nginx() {
    log_info "Configurando Nginx..."
    
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

    cat > nginx/conf.d/default.conf << 'EOF'
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name _;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL (configurar certificados)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Formularios públicos (sin auth)
    location /public/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Archivos estáticos
    location /appointment-form.html {
        root /usr/share/nginx/html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    location /embed-script.js {
        root /usr/share/nginx/html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    log_success "Nginx configurado"
}

# Construir y desplegar
deploy() {
    log_info "Construyendo y desplegando contenedores..."
    
    # Construir imágenes
    docker-compose -f docker-compose.prod.yml build
    
    # Iniciar servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Contenedores desplegados"
}

# Verificar despliegue
verify() {
    log_info "Verificando despliegue..."
    
    # Esperar a que los servicios inicien
    sleep 30
    
    # Verificar contenedores
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Contenedores corriendo correctamente"
    else
        log_error "Algunos contenedores no están corriendo"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
    
    # Verificar backend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Backend respondiendo correctamente"
    else
        log_warning "Backend no responde aún (puede estar iniciando)"
    fi
    
    log_success "Verificación completada"
}

# Configurar SSL (Let's Encrypt)
setup_ssl() {
    if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "tu-dominio.com" ]; then
        log_info "Configurando SSL para $DOMAIN..."
        
        # Instalar certbot
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
        
        # Obtener certificado
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Copiar certificados a nginx/ssl
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
        
        # Reiniciar nginx
        docker-compose -f docker-compose.prod.yml restart nginx
        
        log_success "SSL configurado para $DOMAIN"
    else
        log_warning "Dominio no configurado, SSL omitido"
    fi
}

# Mostrar información final
show_info() {
    log_success "🎉 ¡CRM desplegado exitosamente!"
    
    echo ""
    echo "📋 Información del Despliegue:"
    echo "================================"
    echo "🌐 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost/api/v1"
    echo "📧 Formularios Públicos: http://localhost/public/"
    echo "📄 Formulario de Citas: http://localhost/appointment-form.html"
    echo ""
    echo "🔍 Comandos útiles:"
    echo "  docker-compose -f docker-compose.prod.yml ps      # Ver estado"
    echo "  docker-compose -f docker-compose.prod.yml logs     # Ver logs"
    echo "  docker-compose -f docker-compose.prod.yml restart  # Reiniciar"
    echo ""
    echo "📊 Base de Datos:"
    echo "  Host: localhost:5432"
    echo "  Database: crm_master"
    echo "  User: postgres"
    echo ""
    echo "📁 Archivos importantes:"
    echo "  .env              # Variables de entorno"
    echo "  nginx/             # Configuración Nginx"
    echo "  backups/           # Respaldos de BD"
    echo ""
}

# Función principal
main() {
    log_info "🚀 Iniciando despliegue del CRM en VPS..."
    
    check_vps
    setup_directories
    setup_env
    setup_nginx
    deploy
    verify
    setup_ssl
    show_info
    
    log_success "✅ Despliegue completado exitosamente"
}

# Ejecutar función principal
main "$@"
