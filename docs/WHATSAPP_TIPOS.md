# Tipos de WhatsApp para Evolution API

## Opciones Disponibles

### 1. WhatsApp Personal (Recomendado para empezar)
- **Tipo**: Cuenta personal normal de WhatsApp
- **Integración**: `WHATSAPP-BAILEYS` ✅ (configuración actual)
- **Ventajas**:
  - Fácil de configurar
  - No requiere aprobación de Meta
  - Funciona inmediatamente después de escanear el QR
  - Ideal para pruebas y uso interno
- **Limitaciones**:
  - Puede tener restricciones de envío masivo
  - No tiene características avanzadas de Business

### 2. WhatsApp Business (App Normal)
- **Tipo**: WhatsApp Business app (descargable desde Play Store/App Store)
- **Integración**: `WHATSAPP-BAILEYS` ✅ (misma configuración)
- **Ventajas**:
  - Perfil de negocio con información adicional
  - Catálogo de productos
  - Mensajes automáticos
  - Horarios de atención
  - Estadísticas básicas
- **Limitaciones**:
  - Similar a WhatsApp personal en términos de API
  - No es la API oficial de Meta

### 3. WhatsApp Business API (Oficial de Meta)
- **Tipo**: API oficial de Meta/Facebook
- **Integración**: Requiere configuración diferente (`WHATSAPP-BAILEYS` NO aplica)
- **Ventajas**:
  - API oficial y estable
  - Sin límites de envío (con aprobación)
  - Características avanzadas
  - Soporte oficial
- **Desventajas**:
  - Requiere aprobación de Meta
  - Proceso de verificación complejo
  - Puede tener costos asociados
  - Configuración más compleja

## Configuración Actual

Tu sistema está configurado con:
```javascript
integration: 'WHATSAPP-BAILEYS'
```

Esto funciona con:
- ✅ WhatsApp Personal
- ✅ WhatsApp Business (app normal)
- ❌ NO funciona con WhatsApp Business API oficial

## Recomendación

### Para empezar (Recomendado):
**Usa WhatsApp Personal o WhatsApp Business app normal**

1. Descarga WhatsApp o WhatsApp Business en tu teléfono
2. Crea una cuenta nueva (o usa una existente)
3. Escanea el QR code desde el CRM
4. ¡Listo! Ya puedes enviar mensajes

### Para producción avanzada:
Si necesitas características avanzadas y envío masivo, considera:
1. Solicitar acceso a WhatsApp Business API oficial
2. Cambiar la integración a la API oficial de Meta
3. Configurar webhooks y templates aprobados

## Notas Importantes

⚠️ **Número nuevo recomendado**: 
- Si el número ya está en uso con WhatsApp, elimínalo primero
- Espera unos minutos antes de crear la instancia
- El número debe poder recibir SMS/códigos de verificación

⚠️ **No uses tu número personal principal**:
- Usa un número secundario o dedicado
- Si eliminas la cuenta de WhatsApp, perderás acceso a los chats anteriores

## Cambiar el Tipo

Si quieres usar WhatsApp Business API oficial, necesitarías:
1. Cambiar la integración en el código
2. Configurar credenciales de Meta
3. Obtener aprobación de Meta
4. Configurar webhooks y templates

**Para la mayoría de casos, WhatsApp Personal o Business app normal es suficiente.**










