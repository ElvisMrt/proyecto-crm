# Configuración de WhatsApp

El sistema soporta múltiples proveedores de WhatsApp. Por defecto, está en modo **SIMULATION** (solo muestra los mensajes en la consola).

## Proveedores Soportados

1. **SIMULATION** (por defecto) - Solo muestra mensajes en consola
2. **EVOLUTION** - Evolution API (gratis, requiere servidor propio)
3. **TWILIO** - Twilio WhatsApp API (de pago, más confiable)

## Configuración

### 1. Modo SIMULATION (Desarrollo/Pruebas)

No requiere configuración. Los mensajes se muestran en la consola del backend.

```env
WHATSAPP_PROVIDER=SIMULATION
```

### 2. Evolution API (Recomendado para desarrollo)

Evolution API es una solución gratuita y open-source que puedes instalar en tu propio servidor.

**Instalación rápida con Docker:**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key-segura \
  -e DATABASE_ENABLED=true \
  -e DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/evolution \
  atendai/evolution-api:latest
```

**Variables de entorno en el backend:**
```env
WHATSAPP_PROVIDER=EVOLUTION
WHATSAPP_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_ID=tu-instance-id
EVOLUTION_TOKEN=tu-api-key-segura
```

**Pasos:**
1. Instala Evolution API en un servidor
2. Crea una instancia desde el panel web (puerto 8080)
3. Obtén el `instanceId` y el `token` (API Key)
4. Configura las variables de entorno en el backend

**Documentación:** https://doc.evolution-api.com/

### 3. Twilio WhatsApp API (Producción)

Twilio es un servicio de pago pero muy confiable y fácil de configurar.

**Pasos:**
1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Activa WhatsApp Sandbox (gratis para pruebas) o solicita un número verificado
3. Obtén tus credenciales:
   - Account SID
   - Auth Token
   - Número de WhatsApp (formato: whatsapp:+1234567890)

**Variables de entorno en el backend:**
```env
WHATSAPP_PROVIDER=TWILIO
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

**Documentación:** https://www.twilio.com/docs/whatsapp

## Formato de Números de Teléfono

El sistema normaliza automáticamente los números:
- Números locales (10 dígitos): Se asume código de país +1 (República Dominicana)
- Números internacionales: Se agrega el prefijo `+` si falta

**Ejemplos:**
- `8091234567` → `+18091234567`
- `8291234567` → `+18291234567`
- `+18091234567` → `+18091234567` (sin cambios)

## Verificación

Para verificar que está funcionando:

1. **Modo SIMULATION:** Revisa los logs del backend, verás:
   ```
   📱 [WhatsApp SIMULADO]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📞 Para: +18091234567
   💬 Mensaje: ...
   ```

2. **Modo EVOLUTION/TWILIO:** Los mensajes deberían llegar al WhatsApp del destinatario.

## Solución de Problemas

### Los mensajes no llegan

1. **Verifica las variables de entorno:**
   ```bash
   docker-compose exec backend env | grep WHATSAPP
   ```

2. **Revisa los logs del backend:**
   ```bash
   docker-compose logs backend | grep -i whatsapp
   ```

3. **Verifica la conexión con el proveedor:**
   - Evolution: Verifica que el servidor esté corriendo y accesible
   - Twilio: Verifica las credenciales en el dashboard de Twilio

4. **Verifica el formato del número:**
   - Debe tener al menos 10 dígitos
   - El sistema normaliza automáticamente, pero verifica que el número sea válido

### Error: "Número de teléfono inválido"

- Asegúrate de que el número tenga al menos 10 dígitos
- Verifica que el cliente tenga un número de teléfono registrado

### Error: "Provider no configurado correctamente"

- Verifica que todas las variables de entorno requeridas estén configuradas
- Revisa la documentación del proveedor específico

## Notas Importantes

- **Modo SIMULATION:** Perfecto para desarrollo y pruebas, no requiere configuración
- **Evolution API:** Gratis pero requiere un servidor propio, ideal para desarrollo y pequeñas empresas
- **Twilio:** De pago pero muy confiable, ideal para producción










