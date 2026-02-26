#!/bin/bash

echo "🚀 Iniciando servidor para formulario de citas..."

# Cambiar al directorio público
cd /Users/user/Documents/proyecto-crm/public

# Verificar archivos
echo "📁 Verificando archivos..."
ls -la

# Iniciar servidor Python
echo "🌐 Iniciando servidor en http://localhost:8080"
echo "📄 Formulario: http://localhost:8080/appointment-form.html"
echo "📋 Ejemplos: http://localhost:8080/example-usage.html"
echo "🔥 Presiona Ctrl+C para detener"

# Iniciar servidor
python3 -m http.server 8080
