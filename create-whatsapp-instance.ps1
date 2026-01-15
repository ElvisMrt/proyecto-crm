# Script para crear instancia de WhatsApp y obtener QR

$apiKey = "6F0D9A02AD66-4FB4-8574-985400928FF9"
$baseUrl = "http://localhost:8081"
$instanceName = "crm-whatsapp-instance"

Write-Host ""
Write-Host "Configurando instancia de WhatsApp..." -ForegroundColor Cyan
Write-Host ""

# Headers con autenticacion
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

# 1. Crear instancia
Write-Host "1. Creando instancia..." -ForegroundColor Yellow
$createBody = @{
    instanceName = $instanceName
    token = $apiKey
    qrcode = $true
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/instance/create" -Method POST -Headers $headers -Body $createBody
    Write-Host "Instancia creada exitosamente" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.ErrorDetails.Message -like "*already exists*") {
        Write-Host "La instancia ya existe, continuando..." -ForegroundColor Yellow
    } else {
        Write-Host "Error creando instancia: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. Abrir URL con autenticacion
Write-Host ""
Write-Host "Abriendo panel de conexion..." -ForegroundColor Yellow
Write-Host ""
Write-Host "URL: $baseUrl/instance/connect/$instanceName" -ForegroundColor Cyan
Write-Host ""
Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Abre WhatsApp en tu telefono" -ForegroundColor White
Write-Host "2. Ve a: Configuracion -> Dispositivos vinculados -> Vincular un dispositivo" -ForegroundColor White
Write-Host "3. Escanea el codigo QR" -ForegroundColor White
Write-Host ""

# Abrir navegador con autenticacion
$urlWithAuth = "$baseUrl/instance/connect/$instanceName?apikey=$apiKey"
Start-Process $urlWithAuth

Write-Host "Listo! Escanea el QR con tu WhatsApp" -ForegroundColor Green
Write-Host ""
