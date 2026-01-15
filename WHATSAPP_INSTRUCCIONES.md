# 📱 Configuración de WhatsApp - Instrucciones

## ✅ Estado Actual

Evolution API está configurado y corriendo. Ahora puedes conectar tu WhatsApp directamente desde el CRM.

## 🎯 Método Recomendado: Desde el CRM

### Paso 1: Acceder al Módulo de Configuración

1. Inicia sesión en el CRM
2. Ve a **Configuración** (menú lateral)
3. Haz clic en la pestaña **"WhatsApp"**

### Paso 2: Verificar Estado de Conexión

En la sección **"Conexión WhatsApp"** verás:
- ✅ **Verde**: WhatsApp está conectado
- ⚠️ **Amarillo**: WhatsApp está desconectado (necesitas escanear QR)
- ❌ **Rojo**: Instancia no existe (necesitas crearla)

### Paso 3: Crear Instancia (si no existe)

1. Si ves **"Instancia no encontrada"**, haz clic en **"Crear Instancia y Generar QR"**
2. Espera a que se cree la instancia (puede tardar unos segundos)
3. El código QR aparecerá automáticamente

### Paso 4: Escanear QR con WhatsApp

1. **Abre WhatsApp en tu teléfono**
2. Ve a **Configuración → Dispositivos vinculados → Vincular un dispositivo**
3. **Escanea el código QR** que aparece en la pantalla del CRM
4. Espera a que se complete la conexión

### Paso 5: Verificar Conexión

Una vez escaneado el QR:
- El estado cambiará automáticamente a **"WhatsApp Conectado"** (verde)
- Verás tu número de teléfono
- Ya puedes enviar mensajes desde el CRM

### Paso 6: Actualizar QR (si es necesario)

Si el QR expira o necesitas uno nuevo:
1. Haz clic en **"Actualizar QR"** en la sección de conexión
2. Se generará un nuevo código QR
3. Escanéalo nuevamente con tu WhatsApp

## 🔄 Método Alternativo: Evolution Manager

Si prefieres usar el panel web de Evolution Manager:

**URL:** http://localhost:8081/manager

### Pasos:

1. Abre el panel en tu navegador
2. Busca la instancia `crm-whatsapp-instance`
3. Haz clic en **"Connect"** o **"Get QR Code"**
4. Escanea el QR con tu WhatsApp

## 🧪 Probar el Envío

Una vez conectado, puedes probar enviando un mensaje desde el CRM:

1. Ve a cualquier módulo que permita enviar WhatsApp (Ventas, Clientes, etc.)
2. Haz clic en el botón de enviar por WhatsApp
3. El mensaje debería llegar al número del cliente

## ⚙️ Configuración Actual

- **Proveedor:** Evolution API
- **URL Interna:** http://evolution:8080
- **URL Externa:** http://localhost:8080
- **Panel Manager:** http://localhost:8081/manager (opcional)
- **Instance ID:** `crm-whatsapp-instance`
- **API Key:** `6F0D9A02AD66-4FB4-8574-985400928FF9`

## 💡 Ventajas del Método Integrado

✅ **Más fácil**: Todo desde el CRM, sin salir de la aplicación  
✅ **Más rápido**: No necesitas abrir otra ventana  
✅ **Actualización automática**: El estado se actualiza solo  
✅ **QR visible**: Se muestra directamente en la pantalla  
✅ **Instrucciones incluidas**: Pasos claros en la misma pantalla

## 🔒 Seguridad

⚠️ **IMPORTANTE:** En producción, cambia la API key:

1. Edita `docker-compose.yml`
2. Cambia `EVOLUTION_API_KEY` por una clave segura
3. Reinicia los contenedores: `docker-compose restart evolution backend`

## 🐛 Solución de Problemas

### Error 401 Unauthorized

Si recibes error 401 al acceder a los endpoints:

1. **Verifica la API Key:**
   - Debe ser: `6F0D9A02AD66-4FB4-8574-985400928FF9`
   - Está configurada en `docker-compose.yml`

2. **Usa el método integrado:**
   - Ve a **Configuración → WhatsApp** en el CRM
   - Todo está integrado, no necesitas salir de la aplicación
   - El QR se muestra directamente en la pantalla

3. **Verifica los logs:**
   ```bash
   docker-compose logs evolution
   ```

### El QR no aparece

- Verifica que Evolution esté corriendo: `docker-compose ps evolution`
- Revisa los logs: `docker-compose logs evolution`
- Asegúrate de haber creado la instancia primero

### Los mensajes no llegan

- Verifica que WhatsApp esté conectado (estado "open" en el panel)
- Revisa los logs del backend: `docker-compose logs backend | grep -i whatsapp`
- Verifica que el número del cliente esté en formato correcto
- Asegúrate de que la instancia esté en estado "open" o "connected"

### Error de conexión

- Verifica que el contenedor de Evolution esté corriendo
- Verifica la URL en las variables de entorno del backend
- Revisa que la instancia exista en el panel manager

## 📞 Soporte

Si tienes problemas, revisa:
- Logs de Evolution: `docker-compose logs evolution`
- Logs del Backend: `docker-compose logs backend`
- Estado de contenedores: `docker-compose ps`
- Panel Manager: http://localhost:8081/manager

## 🎯 Método Alternativo: API Directa

Si prefieres usar la API directamente, necesitas incluir el header `apikey` en todas las peticiones:

```bash
# Crear instancia
curl -X POST http://localhost:8081/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: 6F0D9A02AD66-4FB4-8574-985400928FF9" \
  -d '{
    "instanceName": "crm-whatsapp-instance",
    "token": "6F0D9A02AD66-4FB4-8574-985400928FF9",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Obtener QR
curl -X GET http://localhost:8081/instance/connect/crm-whatsapp-instance \
  -H "apikey: 6F0D9A02AD66-4FB4-8574-985400928FF9"
```

Pero es **mucho más fácil usar el método integrado** desde **Configuración → WhatsApp** en el CRM, donde el QR se muestra directamente en la pantalla.
