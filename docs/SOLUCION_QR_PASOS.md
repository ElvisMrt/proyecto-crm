# 🔧 Solución: QR Code no aparece - Pasos Detallados

## ⚠️ Problema Identificado

El QR no se está generando. Esto puede deberse a:
1. Versión de Baileys desactualizada
2. Estado de la instancia incorrecto
3. Configuración de Evolution API

## ✅ Solución Aplicada

He actualizado la configuración de Evolution API para usar una versión específica de Baileys que resuelve este problema.

## 🔄 Pasos para Resolver

### Paso 1: Reiniciar Evolution API

```bash
docker-compose restart evolution
```

Espera 30 segundos para que se reinicie completamente.

### Paso 2: En el Panel Manager

1. **Abre:** http://localhost:8081/manager
2. **Busca** la instancia `crm-whatsapp-instance`
3. **Haz clic en el botón "Get QR Code"** (botón naranja)
4. **Espera 5-10 segundos** - El QR debería aparecer

### Paso 3: Si el QR sigue sin aparecer

1. **Haz clic en "RESTART"** (botón gris)
2. **Espera 15-20 segundos** a que se reinicie
3. **Haz clic en "Get QR Code"** de nuevo
4. El QR debería aparecer ahora

### Paso 4: Escanear el QR

1. Abre WhatsApp en tu teléfono
2. Ve a: **Configuración → Dispositivos vinculados → Vincular un dispositivo**
3. Escanea el código QR
4. Espera la confirmación

## 🔍 Verificación

Después de escanear:
- El estado debería cambiar de "Disconnected" a "Connected"
- Verás tu número de teléfono en el panel
- Los contadores (Contacts, Chats, Messages) pueden cambiar

## 🐛 Si Aún No Funciona

### Opción A: Eliminar y Recrear la Instancia

1. En el panel manager, **elimina** la instancia `crm-whatsapp-instance`
2. **Crea una nueva** con:
   - **Name:** `crm-whatsapp-instance`
   - **Integration:** `WHATSAPP-BAILEYS`
   - **Token:** `6F0D9A02AD66-4FB4-8574-985400928FF9`
3. **Inmediatamente haz clic en "Get QR Code"**
4. El QR debería aparecer

### Opción B: Verificar Logs

```bash
docker-compose logs evolution --tail=50
```

Busca errores relacionados con:
- QR code generation
- Instance connection
- Baileys version

## 📝 Nota Importante

He actualizado `docker-compose.yml` para usar una versión específica de Baileys (`CONFIG_SESSION_PHONE_VERSION: "2.3000.1025062854"`) que resuelve problemas conocidos con la generación de QR.

**Debes reiniciar Evolution API** para que los cambios surtan efecto:

```bash
docker-compose restart evolution
```

