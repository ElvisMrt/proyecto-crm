#!/bin/bash

# Script de configuración local para SaaS Multitenant
# Configura /etc/hosts para probar subdominios localmente

set -e

DOMAIN="neypier.com"
IP="127.0.0.1"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configuración Local para neypier.com${NC}"
echo "=============================================="
echo ""

# Función para agregar entrada a /etc/hosts si no existe
add_host() {
    local subdomain=$1
    local entry="$IP $subdomain.$DOMAIN"
    
    if grep -q "$entry" /etc/hosts; then
        echo "✅ $subdomain.$DOMAIN ya existe"
    else
        echo "$entry" | sudo tee -a /etc/hosts > /dev/null
        echo "📝 Agregado: $subdomain.$DOMAIN"
    fi
}

echo -e "${YELLOW}Agregando subdominios de prueba a /etc/hosts...${NC}"
echo "(Se requiere contraseña de administrador)"
echo ""

# Agregar subdominios de prueba
add_host "admin"           # Panel SaaS (admin.neypier.com)
add_host "app"             # App principal (app.neypier.com)
add_host "mi-empresa-demo" # Tenant de prueba (mi-empresa-demo.neypier.com)
add_host "empresa-test"    # Otro tenant (empresa-test.neypier.com)
add_host "demo"            # Demo (demo.neypier.com)

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "Subdominios configurados:"
echo "  • http://admin.neypier.com:5173      → Panel SaaS Admin"
echo "  • http://mi-empresa-demo.neypier.com:5173 → Tenant Demo"
echo "  • http://empresa-test.neypier.com:5173  → Tenant Test"
echo "  • http://demo.neypier.com:5173       → Demo"
echo ""
echo "Para verificar:"
echo "  cat /etc/hosts | grep neypier"
echo ""
echo "Para probar:"
echo "  1. Inicia Docker: docker compose up"
echo "  2. Abre: http://admin.neypier.com:5173/saas/login"
echo "  3. Crea un tenant y accede con su subdominio"
echo ""
