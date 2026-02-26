# 🔧 Configuración de Evolution Manager

## ⚠️ Problema: Error 401 Unauthorized

Evolution Manager está intentando conectarse a Evolution API sin la API key correcta.

## ✅ Solución

### Opción 1: Usar el CRM Integrado (Recomendado) ⭐

**Ya tienes todo integrado en el CRM, no necesitas Evolution Manager:**

1. Abre el CRM: http://localhost:5173
2. Ve a **Configuración → WhatsApp**
3. Verás:
   - Estado de conexión
   - QR code directamente en la pantalla
   - Botones para crear instancia y actualizar QR

**Ventajas:**
- ✅ No necesitas abrir otra aplicación
- ✅ Todo en un solo lugar
- ✅ Más fácil de usar
- ✅ Ya está funcionando

### Opción 2: Configurar Evolution Manager

Si prefieres usar Evolution Manager, necesitas configurarlo con la API key:

#### Paso 1: Acceder a Evolution Manager

Si Evolution Manager está corriendo en http://localhost:8081/manager, necesitas:

1. **Iniciar sesión** en Evolution Manager
2. **Configurar la API Key** en la configuración:
   - API Key: `6F0D9A02AD66-4FB4-8574-985400928FF9`
   - Evolution API URL: `http://localhost:8081`

#### Paso 2: Verificar Configuración

Evolution Manager necesita tener configurado:
- **VITE_EVOLUTION_API_URL**: `http://localhost:8081`
- **API Key**: `6F0D9A02AD66-4FB4-8574-985400928FF9`

#### Paso 3: Reiniciar Evolution Manager

Después de configurar, reinicia Evolution Manager para que aplique los cambios.

## 🔍 Verificación

Para verificar que Evolution API está funcionando:

```powershell
$headers = @{ "apikey" = "6F0D9A02AD66-4FB4-8574-985400928FF9" }
Invoke-RestMethod -Uri "http://localhost:8081/instance/fetchInstances" -Method GET -Headers $headers
```

Si esto funciona, Evolution API está correctamente configurado.

## 💡 Recomendación

**Usa el método integrado en el CRM** (Configuración → WhatsApp). Es más fácil, más rápido y ya está funcionando.

Si necesitas Evolution Manager por alguna razón específica, asegúrate de configurarlo con la API key correcta.










