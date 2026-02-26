const axios = require('axios');

async function testCreatePurchase() {
  try {
    console.log('🧪 Testing Purchase Creation via API...\n');

    const purchaseData = {
      supplierId: '4d70459b-6f39-4bb4-90e6-5eaf0922206d',
      purchaseDate: new Date().toISOString().split('T')[0],
      total: 1500,
      notes: 'Compra de prueba automática',
      status: 'PENDING'
    };

    console.log('📤 POST http://localhost:3001/api/v1/purchases');
    console.log('📦 Data:', JSON.stringify(purchaseData, null, 2));
    console.log('🔑 Headers: x-tenant-subdomain: demo\n');

    const response = await axios.post(
      'http://localhost:3001/api/v1/purchases',
      purchaseData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-subdomain': 'demo'
        }
      }
    );

    console.log('✅ SUCCESS! Purchase created:\n');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n🎯 Purchase Code:', response.data.data?.code);
    console.log('💰 Total:', response.data.data?.total);
    console.log('📊 Status:', response.data.data?.status);

  } catch (error) {
    console.error('\n❌ ERROR creating purchase:\n');
    console.error('Status:', error.response?.status);
    console.error('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.error?.details) {
      console.error('\n📋 Details:', error.response.data.error.details);
    }
    
    if (error.response?.data?.error?.prismaCode) {
      console.error('🔴 Prisma Code:', error.response.data.error.prismaCode);
    }
  }
}

testCreatePurchase();
