/**
 * Script para configurar Evolution API
 * Crea una instancia de WhatsApp y obtiene las credenciales
 */

const EVOLUTION_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '6F0D9A02AD66-4FB4-8574-985400928FF9';
const INSTANCE_NAME = 'crm-whatsapp-instance';

async function setupEvolution() {
  try {
    console.log('🚀 Configurando Evolution API...\n');

    // 1. Crear instancia
    console.log('📱 Creando instancia de WhatsApp...');
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        token: EVOLUTION_API_KEY,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      if (errorText.includes('already exists')) {
        console.log('✅ La instancia ya existe\n');
      } else {
        throw new Error(`Error creando instancia: ${errorText}`);
      }
    } else {
      const createData = await createResponse.json();
      console.log('✅ Instancia creada:', createData);
    }

    // 2. Obtener QR Code
    console.log('\n📲 Obteniendo QR Code para conectar WhatsApp...');
    const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (qrResponse.ok) {
      const qrData: any = await qrResponse.json();
      if (qrData.qrcode) {
        console.log('\n📱 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('URL del QR:', (qrData.qrcode as any).base64 ? 'Base64 generado' : (qrData.qrcode as any).code);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('💡 Puedes ver el QR en: http://localhost:8080/instance/connect/' + INSTANCE_NAME);
        console.log('💡 O usar el panel web en: http://localhost:8080\n');
      } else {
        console.log('✅ WhatsApp ya está conectado\n');
      }
    }

    // 3. Verificar estado
    console.log('🔍 Verificando estado de la instancia...');
    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (statusResponse.ok) {
      const instances: any = await statusResponse.json();
      const instance = instances.find((inst: any) => inst.instance.instanceName === INSTANCE_NAME);
      if (instance) {
        console.log('✅ Estado:', instance.instance.status);
        console.log('✅ Instance ID:', INSTANCE_NAME);
        console.log('\n📝 Configura estas variables de entorno en el backend:');
        console.log(`WHATSAPP_PROVIDER=EVOLUTION`);
        console.log(`WHATSAPP_API_URL=${EVOLUTION_API_URL}`);
        console.log(`EVOLUTION_INSTANCE_ID=${INSTANCE_NAME}`);
        console.log(`EVOLUTION_TOKEN=${EVOLUTION_API_KEY}`);
        console.log(`EVOLUTION_API_KEY=${EVOLUTION_API_KEY}\n`);
      }
    }

    console.log('🎉 Configuración completada!\n');
  } catch (error: any) {
    console.error('❌ Error configurando Evolution API:', error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   1. Evolution API esté corriendo en', EVOLUTION_API_URL);
    console.error('   2. La API key sea correcta');
    console.error('   3. El contenedor de Evolution esté accesible\n');
  }
}

setupEvolution();

