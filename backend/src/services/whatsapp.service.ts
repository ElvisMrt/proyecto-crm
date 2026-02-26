/**
 * Servicio para enviar mensajes de WhatsApp
 * Soporta múltiples proveedores mediante variables de entorno
 */

interface WhatsAppConfig {
  provider: 'EVOLUTION' | 'TWILIO' | 'BAILEYS' | 'SIMULATION';
  apiUrl?: string;
  apiKey?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  instanceId?: string;
  token?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      provider: (process.env.WHATSAPP_PROVIDER as any) || 'EVOLUTION',
      apiUrl: process.env.WHATSAPP_API_URL || 'http://evolution:8080',
      apiKey: process.env.WHATSAPP_API_KEY,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      instanceId: process.env.EVOLUTION_INSTANCE_ID || 'crm-whatsapp-instance',
      token: process.env.EVOLUTION_TOKEN || process.env.EVOLUTION_API_KEY,
    };
  }

  /**
   * Normaliza el número de teléfono al formato internacional
   */
  private normalizePhone(phone: string): string {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:42',message:'normalizePhone entry',data:{originalPhone:phone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Eliminar caracteres no numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Si no tiene código de país, asumir República Dominicana (+1 809/829/849)
    if (cleanPhone.length === 10) {
      // Verificar si empieza con 809, 829 o 849
      if (cleanPhone.startsWith('809') || cleanPhone.startsWith('829') || cleanPhone.startsWith('849')) {
        cleanPhone = '1' + cleanPhone;
      } else {
        // Asumir que es un número local y agregar código de país
        cleanPhone = '1809' + cleanPhone;
      }
    }
    
    // Asegurar formato internacional
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:63',message:'normalizePhone exit',data:{normalizedPhone:cleanPhone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return cleanPhone;
  }

  /**
   * Envía mensaje usando Evolution API
   */
  private async sendViaEvolution(
    phone: string,
    message: string,
    subject?: string
  ): Promise<SendMessageResult> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:68',message:'sendViaEvolution entry',data:{phone,messageLength:message.length,hasSubject:!!subject,apiUrl:this.config.apiUrl,instanceId:this.config.instanceId,hasToken:!!this.config.token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    try {
      if (!this.config.apiUrl || !this.config.instanceId || !this.config.token) {
        console.error('[WhatsApp] ❌ Configuración incompleta:');
        console.error(`  apiUrl: ${this.config.apiUrl || 'NO CONFIGURADO'}`);
        console.error(`  instanceId: ${this.config.instanceId || 'NO CONFIGURADO'}`);
        console.error(`  token: ${this.config.token ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
        throw new Error('Evolution API no configurada correctamente');
      }
      
      console.log(`[WhatsApp] Configuración Evolution API:`);
      console.log(`  URL: ${this.config.apiUrl}`);
      console.log(`  Instance ID: ${this.config.instanceId}`);
      console.log(`  Token: ${this.config.token ? 'Configurado' : 'NO CONFIGURADO'}`);

      const normalizedPhone = this.normalizePhone(phone);
      // Evolution API requiere el número sin el + y sin espacios
      // Formato: código de país + número (ej: 18093243040 para +1 809 324 3040)
      let phoneNumber = normalizedPhone.replace(/^\+/, '').replace(/\s/g, '');
      
      // Asegurar que el número tenga el formato correcto
      // Si el número empieza con 1 y tiene 11 dígitos, está bien
      // Si tiene 10 dígitos y empieza con 809/829/849, agregar 1 al inicio
      if (phoneNumber.length === 10 && (phoneNumber.startsWith('809') || phoneNumber.startsWith('829') || phoneNumber.startsWith('849'))) {
        phoneNumber = '1' + phoneNumber;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:81',message:'phone number formatted',data:{originalPhone:phone,normalizedPhone,phoneNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Verificar que Evolution API esté accesible primero
      console.log(`[WhatsApp] Intentando conectar a Evolution API: ${this.config.apiUrl}`);
      console.log(`[WhatsApp] Instance ID: ${this.config.instanceId}`);
      
      // Verificar que la instancia esté conectada antes de enviar (con timeout más corto)
      const statusUrl = `${this.config.apiUrl}/instance/fetchInstances`;
      const statusController = new AbortController();
      const statusTimeout = setTimeout(() => statusController.abort(), 10000); // 10 segundos para verificar estado
      
      try {
        console.log(`[WhatsApp] Verificando estado de instancia: ${statusUrl}`);
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'apikey': this.config.token || '',
          },
          signal: statusController.signal,
        });
        
        clearTimeout(statusTimeout);
        
        if (!statusResponse.ok) {
          console.warn(`[WhatsApp] Error al verificar estado: ${statusResponse.status} ${statusResponse.statusText}`);
          throw new Error(`Evolution API no responde correctamente: ${statusResponse.status}`);
        }
        
        const instances = await statusResponse.json();
        const instance = Array.isArray(instances) 
          ? instances.find((inst: any) => inst.name === this.config.instanceId || inst.instanceName === this.config.instanceId)
          : instances;
        
        if (!instance) {
          throw new Error(`Instancia '${this.config.instanceId}' no encontrada en Evolution API`);
        }
        
        console.log(`[WhatsApp] Instancia encontrada. Estado: ${instance.connectionStatus || instance.status}`);
        
        if (instance.connectionStatus !== 'open' && instance.status !== 'open') {
          throw new Error(`La instancia de WhatsApp no está conectada. Estado: ${instance.connectionStatus || instance.status}. Por favor, escanea el QR code primero.`);
        }
        
        console.log(`[WhatsApp] Instancia conectada, procediendo a enviar mensaje`);
      } catch (statusError: any) {
        clearTimeout(statusTimeout);
        if (statusError.name === 'AbortError') {
          throw new Error('Timeout al verificar estado de Evolution API (10 segundos). Verifica que Evolution API esté corriendo y accesible.');
        }
        // Si es un error de conexión, lanzar el error
        if (statusError.message.includes('fetch failed') || statusError.message.includes('ECONNREFUSED')) {
          throw new Error(`No se puede conectar a Evolution API en ${this.config.apiUrl}. Verifica que el servicio esté corriendo.`);
        }
        throw statusError;
      }
      
      const url = `${this.config.apiUrl}/message/sendText/${this.config.instanceId}`;
      
      // Asegurar que el mensaje no tenga variables sin renderizar
      let cleanMessage = message;
      // Remover cualquier {{variable}} que quede sin renderizar
      cleanMessage = cleanMessage.replace(/\{\{[^}]+\}\}/g, '');
      
      const requestBody = {
        number: phoneNumber,
        text: subject ? `*${subject}*\n\n${cleanMessage}` : cleanMessage,
      };

      console.log(`[WhatsApp] Enviando mensaje a: ${url}`);
      console.log(`[WhatsApp] Número destino: ${phoneNumber}`);
      console.log(`[WhatsApp] Longitud del mensaje: ${requestBody.text.length} caracteres`);
      console.log(`[WhatsApp] Request body:`, JSON.stringify(requestBody, null, 2));
      console.log(`[WhatsApp] Mensaje original tenía variables sin renderizar: ${message.includes('{{')}`);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:104',message:'sending message to Evolution API',data:{url,phoneNumber,instanceId:this.config.instanceId,messageLength:requestBody.text.length,hasToken:!!this.config.token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Crear un AbortController para timeout personalizado (aumentado a 60 segundos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:187',message:'TIMEOUT TRIGGERED',data:{url,elapsedTime:Date.now()-startTime,phoneNumber,instanceId:this.config.instanceId,requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        console.error(`[WhatsApp] ⏱️ Timeout después de 60 segundos. URL: ${url}`);
        console.error(`[WhatsApp] Verifica que Evolution API esté accesible en: ${this.config.apiUrl}`);
        controller.abort();
      }, 60000); // 60 segundos - Evolution API puede tardar más con Redis desconectado

      const startTime = Date.now();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:193',message:'about to call fetch',data:{url,phoneNumber,instanceId:this.config.instanceId,hasToken:!!this.config.token,startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      try {
        console.log(`[WhatsApp] Iniciando petición fetch a Evolution API...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config.token || '',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        const elapsedTime = Date.now() - startTime;
        console.log(`[WhatsApp] Respuesta recibida después de ${elapsedTime}ms. Status: ${response.status}`);

        clearTimeout(timeoutId);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:210',message:'Evolution API response received',data:{responseOk:response.ok,status:response.status,statusText:response.statusText,elapsedTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No se pudo leer el error');
        let errorData: any = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        
        console.error('[WhatsApp] ❌ Evolution API Error Response:');
        console.error('[WhatsApp] Status:', response.status);
        console.error('[WhatsApp] Status Text:', response.statusText);
        console.error('[WhatsApp] Error Data:', JSON.stringify(errorData, null, 2));
        console.error('[WhatsApp] Error Text (raw):', errorText);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:214',message:'Evolution API error response',data:{status:response.status,statusText:response.statusText,errorData,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        throw new Error(errorData.message || errorData.error || errorData.raw || `Error ${response.status} al enviar mensaje`);
      }

        const data = await response.json();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:141',message:'message sent successfully',data:{messageId:(data as any).key?.id||(data as any).messageId,fullResponse:data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        console.log('Mensaje enviado exitosamente:', data);
        return {
          success: true,
          messageId: (data as any).key?.id || (data as any).messageId || `evol_${Date.now()}`,
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const elapsedTime = Date.now() - startTime;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:241',message:'fetch error caught',data:{errorName:fetchError.name,errorMessage:fetchError.message,isAbortError:fetchError.name==='AbortError',elapsedTime,url,phoneNumber,instanceId:this.config.instanceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (fetchError.name === 'AbortError') {
          console.error(`[WhatsApp] ❌ Timeout después de ${elapsedTime}ms`);
          console.error(`[WhatsApp] URL intentada: ${url}`);
          console.error(`[WhatsApp] Evolution API URL configurada: ${this.config.apiUrl}`);
          console.error(`[WhatsApp] Verifica:`);
          console.error(`  - Que Evolution API esté corriendo: docker-compose ps evolution`);
          console.error(`  - Que la URL sea accesible desde el backend: ${this.config.apiUrl}`);
          console.error(`  - Que la instancia esté conectada (escanea el QR si es necesario)`);
          throw new Error(`Timeout al enviar mensaje (30 segundos). Evolution API no responde en ${this.config.apiUrl}. Verifica que el servicio esté corriendo y accesible.`);
        }
        console.error(`[WhatsApp] ❌ Error en fetch:`, fetchError.message);
        console.error(`[WhatsApp] Error stack:`, fetchError.stack);
        throw fetchError;
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.service.ts:156',message:'Evolution API error caught',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      console.error('Evolution API error:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar mensaje por Evolution API',
      };
    }
  }

  /**
   * Envía mensaje usando Twilio
   */
  private async sendViaTwilio(
    phone: string,
    message: string,
    subject?: string
  ): Promise<SendMessageResult> {
    try {
      if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
        throw new Error('Twilio no configurado correctamente');
      }

      const normalizedPhone = this.normalizePhone(phone);
      const fullMessage = subject ? `*${subject}*\n\n${message}` : message;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('From', `whatsapp:${this.config.fromNumber}`);
      formData.append('To', `whatsapp:${normalizedPhone}`);
      formData.append('Body', fullMessage);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).message || `Error ${response.status} al enviar mensaje`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: (data as any).sid,
      };
    } catch (error: any) {
      console.error('Twilio error:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar mensaje por Twilio',
      };
    }
  }

  /**
   * Simula el envío (modo desarrollo)
   */
  private async sendViaSimulation(
    phone: string,
    message: string,
    subject?: string
  ): Promise<SendMessageResult> {
    const normalizedPhone = this.normalizePhone(phone);
    
    console.log('\n📱 [WhatsApp SIMULADO]');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📞 Para: ${normalizedPhone}`);
    if (subject) {
      console.log(`📌 Asunto: ${subject}`);
    }
    console.log(`💬 Mensaje:`);
    console.log(message);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Envía un mensaje de WhatsApp
   */
  async sendMessage(
    phone: string,
    message: string,
    subject?: string
  ): Promise<SendMessageResult> {
    // Validar formato de teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return {
        success: false,
        error: 'Número de teléfono inválido (debe tener al menos 10 dígitos)',
      };
    }

    try {
      switch (this.config.provider) {
        case 'EVOLUTION':
          return await this.sendViaEvolution(phone, message, subject);
        
        case 'TWILIO':
          return await this.sendViaTwilio(phone, message, subject);
        
        case 'SIMULATION':
        default:
          return await this.sendViaSimulation(phone, message, subject);
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar mensaje WhatsApp',
      };
    }
  }
}

export const whatsappService = new WhatsAppService();

