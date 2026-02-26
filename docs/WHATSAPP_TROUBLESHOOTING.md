# 🔧 Solución de Problemas - WhatsApp

## Problema: Los mensajes no llegan

### Diagnóstico

Si escaneaste el QR pero los mensajes no llegan, sigue estos pasos:

### 1. Verificar Estado de Conexión

**Desde el CRM:**
1. Ve a **Configuración → WhatsApp**
2. Verifica el estado:
   - ✅ **Verde "Conectado"**: La conexión está activa
   - ⚠️ **Amarillo "Conectando"**: Espera unos segundos más
   - ❌ **Rojo "Desconectado"**: Necesitas escanear el QR de nuevo

**Desde la terminal:**
```powershell
$headers = @{ "apikey" = "6F0D9A02AD66-4FB4-8574-985400928FF9" }
$status = Invoke-RestMethod -Uri "http://localhost:8081/instance/fetchInstances" -Method GET -Headers $headers
$status.connectionStatus  # Debe ser "open"
```

### 2. Verificar en WhatsApp

**En tu teléfono:**
1. Abre WhatsApp
2. Ve a **Configuración → Dispositivos vinculados**
3. Verifica que aparezca el dispositivo "CRM" o similar
4. Si no aparece, escanea el QR de nuevo

### 3. Problemas Comunes

#### A) Timeout al enviar mensajes

**Síntomas:**
- El mensaje se envía desde el CRM
- No llega al destinatario
- Logs muestran "HeadersTimeoutError"

**Soluciones:**
1. **Verificar que la instancia esté conectada:**
   - Estado debe ser "open" (no "connecting" o "close")

2. **Verificar formato del número:**
   - Formato correcto: `18093133509` (sin +)
   - Con código de país: `1` + número local
   - Ejemplo: `8093133509` → `18093133509`

3. **Verificar que Evolution API esté funcionando:**
   ```powershell
   docker-compose logs evolution --tail=50
   ```

4. **Reiniciar servicios:**
   ```powershell
   docker-compose restart evolution backend
   ```

#### B) Mensajes no se envían

**Síntomas:**
- Error 400, 500 o timeout
- El mensaje no aparece en el CRM

**Soluciones:**
1. **Verificar logs del backend:**
   ```powershell
   docker-compose logs backend --tail=100 | Select-String -Pattern "whatsapp|message|error"
   ```

2. **Verificar que el número de destino sea válido:**
   - Debe tener código de país
   - Formato: `18093133509` (11 dígitos para RD)

3. **Verificar que el mensaje no esté vacío**

#### C) QR no aparece o expira

**Síntomas:**
- No se muestra el QR code
- El QR expira rápidamente

**Soluciones:**
1. **Generar nuevo QR:**
   - Haz clic en "Actualizar QR" en el CRM
   - O elimina y recrea la instancia

2. **Verificar que Evolution API esté corriendo:**
   ```powershell
   docker-compose ps evolution
   ```

3. **Verificar logs:**
   ```powershell
   docker-compose logs evolution --tail=50
   ```

### 4. Verificación de Red

**Problemas de conectividad:**
1. **Backend → Evolution API:**
   ```powershell
   docker-compose exec backend ping -c 2 evolution
   ```

2. **Evolution API → Internet:**
   - Evolution API necesita internet para enviar mensajes
   - Verifica que el servidor tenga acceso a internet

### 5. Pruebas de Envío

**Probar envío manual:**

```powershell
$headers = @{ 
    "apikey" = "6F0D9A02AD66-4FB4-8574-985400928FF9"
    "Content-Type" = "application/json"
}
$body = @{
    number = "18093133509"  # Tu número de prueba
    text = "Test desde CRM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/message/sendText/crm-whatsapp-instance" `
    -Method POST -Headers $headers -Body $body -TimeoutSec 30
```

### 6. Restricciones de WhatsApp

**Limitaciones importantes:**
- ⚠️ **No puedes enviar a números que NO te tienen en contactos** (inicialmente)
- ⚠️ **WhatsApp puede limitar envíos masivos** si detecta spam
- ⚠️ **El número debe estar activo** en WhatsApp

**Para enviar a números nuevos:**
1. El destinatario debe enviarte un mensaje primero, O
2. Debes tener el número guardado en tus contactos, O
3. Debes usar WhatsApp Business API oficial (requiere aprobación)

### 7. Logs Útiles

**Ver logs en tiempo real:**
```powershell
# Backend
docker-compose logs -f backend | Select-String -Pattern "whatsapp|message"

# Evolution API
docker-compose logs -f evolution | Select-String -Pattern "sendText|message|error"
```

### 8. Reinicio Completo

Si nada funciona:

```powershell
# 1. Detener servicios
docker-compose down

# 2. Eliminar instancia de Evolution (opcional)
docker volume rm proyecto-crm_evolution_instances

# 3. Reiniciar
docker-compose up -d

# 4. Esperar a que Evolution API inicie
Start-Sleep -Seconds 10

# 5. Crear nueva instancia desde el CRM
```

### 9. Contacto de Soporte

Si el problema persiste:
1. Revisa los logs completos
2. Verifica el estado de la instancia
3. Prueba enviar a tu propio número primero
4. Verifica que WhatsApp en tu teléfono esté actualizado

---

## Estado Actual

- ✅ **Conexión**: Estado "open" (conectado)
- ✅ **Número**: 18093133509@s.whatsapp.net
- ⚠️ **Envío**: Puede dar timeout (verificar logs)










