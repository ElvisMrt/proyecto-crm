import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Factura Emitida',
    type: 'INVOICE',
    subject: 'Factura {{number}}',
    message: `¡Hola {{clientName}}! 👋

Hemos emitido tu factura:

📄 *Factura:* {{number}}
📋 *NCF:* {{ncf}}
📅 *Fecha:* {{date}}
💰 *Total:* {{total}}

*Detalle de productos:*
{{items}}

💳 *Saldo pendiente:* {{balance}}

Gracias por tu compra. Si tienes alguna pregunta, no dudes en contactarnos.

¡Que tengas un excelente día! 😊`,
    isActive: true,
  },
  {
    name: 'Cotización Enviada',
    type: 'QUOTE',
    subject: 'Cotización {{number}}',
    message: `¡Hola {{clientName}}! 👋

Te enviamos la cotización que solicitaste:

📄 *Cotización:* {{number}}
📅 *Fecha:* {{date}}
⏰ *Válida hasta:* {{validUntil}}
💰 *Total:* {{total}}

*Detalle de productos:*
{{items}}

Esta cotización es válida hasta la fecha indicada. Si tienes alguna pregunta o deseas realizar el pedido, contáctanos.

¡Estamos a tu disposición! 😊`,
    isActive: true,
  },
  {
    name: 'Pago Recibido',
    type: 'PAYMENT',
    subject: 'Pago recibido',
    message: `¡Hola {{clientName}}! 👋

Confirmamos que hemos recibido tu pago:

💰 *Monto:* {{amount}}
📄 *Factura:* {{invoiceNumber}}
📅 *Fecha de pago:* {{date}}

¡Gracias por tu pago puntual! Tu cuenta está al día.

Si tienes alguna pregunta, no dudes en contactarnos.

¡Que tengas un excelente día! 😊`,
    isActive: true,
  },
  {
    name: 'Recordatorio de Pago',
    type: 'REMINDER',
    subject: 'Recordatorio de pago pendiente',
    message: `¡Hola {{clientName}}! 👋

Te recordamos que tienes un pago pendiente:

📄 *Factura:* {{invoiceNumber}}
💰 *Monto:* {{amount}}
📅 *Fecha de vencimiento:* {{dueDate}}

Por favor, realiza el pago a la brevedad posible para mantener tu cuenta al día.

Si ya realizaste el pago, por favor ignora este mensaje.

¡Gracias por tu atención! 😊`,
    isActive: true,
  },
  {
    name: 'Recordatorio Urgente',
    type: 'REMINDER',
    subject: '⚠️ Pago vencido - Acción requerida',
    message: `¡Hola {{clientName}}! 👋

⚠️ *IMPORTANTE:* Tienes un pago vencido:

📄 *Factura:* {{invoiceNumber}}
💰 *Monto:* {{amount}}
📅 *Fecha de vencimiento:* {{dueDate}}
🔴 *Días de atraso:* {{daysOverdue}}

Por favor, contacta con nosotros para coordinar el pago y evitar inconvenientes.

Estamos aquí para ayudarte. ¡Contáctanos pronto! 📞`,
    isActive: true,
  },
  {
    name: 'Mensaje Personalizado',
    type: 'CUSTOM',
    subject: null,
    message: `¡Hola {{clientName}}! 👋

{{message}}

Si tienes alguna pregunta, no dudes en contactarnos.

¡Que tengas un excelente día! 😊`,
    isActive: true,
  },
];

async function createTemplates() {
  try {
    console.log('🚀 Creando templates de WhatsApp...\n');

    for (const template of templates) {
      // Verificar si el template ya existe
      const existing = await prisma.whatsAppTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`⚠️  Template "${template.name}" ya existe, actualizando...`);
        await prisma.whatsAppTemplate.update({
          where: { name: template.name },
          data: template,
        });
        console.log(`✅ Template "${template.name}" actualizado\n`);
      } else {
        await prisma.whatsAppTemplate.create({
          data: template,
        });
        console.log(`✅ Template "${template.name}" creado\n`);
      }
    }

    console.log('🎉 ¡Todos los templates han sido creados exitosamente!');
  } catch (error) {
    console.error('❌ Error creando templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTemplates();
