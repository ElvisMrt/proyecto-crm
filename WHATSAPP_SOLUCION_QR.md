# 🔧 Solución: QR Code no aparece

## ✅ Estado Actual

La instancia `crm-whatsapp-instance` está creada pero en estado **"close"** (cerrada).

## 🔍 Problema

El QR no aparece porque la instancia necesita ser **conectada explícitamente**.

## 💡 Soluciones

### Solución 1: Desde el Panel Manager (Más Fácil)

1. **Abre el Panel Manager:**
   ```
   http://localhost:8081/manager
   ```

2. **Busca la instancia `crm-whatsapp-instance`** en la lista

3. **Haz clic en el botón "Connect" o "Conectar"** (debe ser un botón verde o azul)

4. **Espera unos segundos** - El QR debería aparecer automáticamente

5. **Si no aparece**, intenta:
   - Hacer clic en "Restart" o "Reiniciar" primero
   - Luego hacer clic en "Connect" de nuevo

### Solución 2: Reiniciar la Instancia

En el panel manager:
1. Busca la instancia `crm-whatsapp-instance`
2. Haz clic en **"Restart"** o **"Reiniciar"**
3. Espera a que se reinicie
4. Haz clic en **"Connect"** o **"Conectar"**
5. El QR debería aparecer

### Solución 3: Eliminar y Recrear

Si nada funciona:
1. En el panel manager, **elimina** la instancia `crm-whatsapp-instance`
2. **Crea una nueva** con el mismo nombre
3. **Inmediatamente haz clic en "Connect"**
4. El QR debería aparecer

## 📱 Una vez que veas el QR

1. Abre WhatsApp en tu teléfono
2. Ve a: **Configuración → Dispositivos vinculados → Vincular un dispositivo**
3. Escanea el código QR
4. Espera la confirmación de conexión

## ✅ Verificar Conexión

Después de escanear el QR:
- El estado debería cambiar a **"open"** o **"connected"**
- Verás tu número de teléfono en el panel
- Ya puedes enviar mensajes desde el CRM

## 🐛 Si el QR sigue sin aparecer

1. **Revisa los logs:**
   ```bash
   docker-compose logs evolution --tail=50
   ```

2. **Verifica que la instancia esté activa:**
   - Debe aparecer en la lista del panel manager
   - El estado debe cambiar cuando haces clic en "Connect"

3. **Reinicia Evolution API:**
   ```bash
   docker-compose restart evolution
   ```

4. **Espera 30 segundos** y vuelve a intentar

## 📞 Información de Debug

- **Instancia ID:** `85e731f9-197e-4da3-a8f2-da2d5a54e82d`
- **Nombre:** `crm-whatsapp-instance`
- **Estado actual:** `close`
- **Token:** `6F0D9A02AD66-4FB4-8574-985400928FF9`
- **Integration:** `WHATSAPP-BAILEYS`

