# Script para configurar WhatsApp con Evolution API

Write-Host "`n📱 Configuración de WhatsApp con Evolution API`n" -ForegroundColor Cyan

# Verificar que Evolution esté corriendo
Write-Host "🔍 Verificando que Evolution API esté corriendo..." -ForegroundColor Yellow
$evolutionStatus = docker ps --filter "name=crm_evolution" --format "{{.Status}}"
if ($evolutionStatus) {
    Write-Host "✅ Evolution API está corriendo: $evolutionStatus" -ForegroundColor Green
} else {
    Write-Host "❌ Evolution API no está corriendo. Iniciando..." -ForegroundColor Red
    docker-compose up -d evolution
    Start-Sleep -Seconds 10
}

# URL del panel
$panelUrl = "http://localhost:8081"
Write-Host "`n🌐 Panel de Evolution API: $panelUrl" -ForegroundColor Cyan

# Intentar abrir el navegador
Write-Host "`n📋 Pasos para conectar WhatsApp:" -ForegroundColor Yellow
Write-Host "   1. Abre el panel en: $panelUrl" -ForegroundColor White
Write-Host "   2. Crea una instancia con el nombre: crm-whatsapp-instance" -ForegroundColor White
Write-Host "   3. Escanea el código QR con tu WhatsApp" -ForegroundColor White
Write-Host "   4. Una vez conectado, los mensajes funcionarán automáticamente`n" -ForegroundColor White

# Intentar abrir el navegador
$openBrowser = Read-Host "¿Deseas abrir el panel en el navegador? (S/N)"
if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Start-Process $panelUrl
}

Write-Host "`n✅ Configuración lista. Una vez conectes WhatsApp, podrás enviar mensajes desde el CRM.`n" -ForegroundColor Green










