import nodemailer from 'nodemailer';

// Configuración del transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Verificar configuración SMTP
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error);
    return false;
  }
};

// Enviar notificación de nueva cita al admin
export const sendNewAppointmentNotification = async (data: {
  to: string;
  appointment: {
    clientName: string;
    clientEmail?: string | null;
    clientPhone: string;
    appointmentDate: Date;
    notes?: string | null;
    branchName?: string | null;
  };
}): Promise<void> => {
  const { to, appointment } = data;

  const dateStr = new Date(appointment.appointmentDate).toLocaleString('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        🔔 Nueva Cita Agendada
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Detalles del Cliente</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Nombre:</strong></td>
            <td style="padding: 8px 0;">${appointment.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px 0;">${appointment.clientPhone}</td>
          </tr>
          ${appointment.clientEmail ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
            <td style="padding: 8px 0;">${appointment.clientEmail}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0; color: #1e40af;">📅 Información de la Cita</h3>
        <p style="font-size: 18px; margin: 10px 0;"><strong>${dateStr}</strong></p>
        ${appointment.branchName ? `<p style="color: #6b7280; margin: 5px 0;">📍 Sucursal: ${appointment.branchName}</p>` : ''}
      </div>

      ${appointment.notes ? `
      <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #854d0e;">📝 Notas del Cliente:</h4>
        <p style="color: #854d0e; margin: 0;">${appointment.notes}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0 0 15px 0; color: #6b7280;">
          Ingresa al CRM para gestionar esta cita:
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/appointments" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 6px; font-weight: 600;">
          Ver en CRM
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Esta notificación fue generada automáticamente por el CRM.
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
    to,
    subject: `🔔 Nueva Cita: ${appointment.clientName} - ${dateStr}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de notificación enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};

// Enviar email de confirmación al cliente
export const sendClientConfirmation = async (data: {
  to: string;
  appointment: {
    clientName: string;
    appointmentDate: Date;
    branchName?: string | null;
  };
}): Promise<void> => {
  const { to, appointment } = data;

  const dateStr = new Date(appointment.appointmentDate).toLocaleString('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; text-align: center;">
        ✅ Cita Confirmada
      </h2>
      
      <p style="font-size: 16px; color: #374151;">
        Hola <strong>${appointment.clientName}</strong>,
      </p>
      
      <p style="color: #6b7280;">
        Tu cita ha sido agendada exitosamente. Aquí están los detalles:
      </p>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="font-size: 20px; margin: 0; color: #1e40af;"><strong>${dateStr}</strong></p>
        ${appointment.branchName ? `<p style="color: #6b7280; margin: 10px 0 0 0;">📍 ${appointment.branchName}</p>` : ''}
      </div>

      <p style="color: #6b7280; text-align: center;">
        Te contactaremos para confirmar los detalles.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Si necesitas cancelar o modificar tu cita, por favor contáctanos.<br>
        Este es un email automático, no respondas a esta dirección.
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
    to,
    subject: '✅ Tu cita ha sido confirmada',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmación enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    throw error;
  }
};

// ============================================
// SaaS Email Notifications
// ============================================

// Email de bienvenida al crear un tenant
export const sendSaaSWelcomeEmail = async (data: {
  to: string;
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<void> => {
  const { to, tenantName, subdomain, adminEmail, adminPassword } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; text-align: center;">
        ¡Bienvenido a ${tenantName}!
      </h2>
      
      <p style="font-size: 16px; color: #374151;">
        Tu cuenta CRM ha sido creada exitosamente.
      </p>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Datos de acceso:</h3>
        <table style="width: 100%;">
          <tr><td><strong>URL:</strong></td><td>https://${subdomain}.tudominio.com</td></tr>
          <tr><td><strong>Email:</strong></td><td>${adminEmail}</td></tr>
          <tr><td><strong>Contraseña:</strong></td><td>${adminPassword}</td></tr>
        </table>
      </div>

      <p style="color: #dc2626;">
        <strong>Importante:</strong> Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Este es un correo automático. No respondas a este mensaje.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
      to,
      subject: `¡Bienvenido a ${tenantName}! Tu CRM está listo`,
      html: htmlContent,
    });
    console.log(`✅ Email de bienvenida SaaS enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
  }
};

// Email de factura generada
export const sendSaaSInvoiceEmail = async (data: {
  to: string;
  tenantName: string;
  amount: number;
  period: string;
  invoiceId: string;
}): Promise<void> => {
  const { to, tenantName, amount, period, invoiceId } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Nueva Factura - ${tenantName}</h2>
      <p>Se ha generado una nueva factura para tu suscripción.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr><td><strong>Monto:</strong></td><td>$${amount.toFixed(2)} DOP</td></tr>
          <tr><td><strong>Período:</strong></td><td>${period}</td></tr>
          <tr><td><strong>Factura #:</strong></td><td>${invoiceId.slice(0, 8)}</td></tr>
        </table>
      </div>

      <p style="color: #dc2626;">
        Por favor realiza el pago antes de la fecha de vencimiento para evitar suspensiones.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Si tienes preguntas, contacta a soporte@tusitio.com
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
      to,
      subject: `Nueva Factura - $${amount.toFixed(2)} DOP`,
      html: htmlContent,
    });
    console.log(`✅ Email de factura enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de factura:', error);
  }
};

// Email de confirmación de pago
export const sendSaaSPaymentConfirmation = async (data: {
  to: string;
  tenantName: string;
  amount: number;
  invoiceId: string;
}): Promise<void> => {
  const { to, tenantName, amount, invoiceId } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a; text-align: center;">¡Pago Confirmado!</h2>
      <p>Hemos recibido tu pago exitosamente.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
        <table style="width: 100%;">
          <tr><td><strong>Monto:</strong></td><td>$${amount.toFixed(2)} DOP</td></tr>
          <tr><td><strong>Factura #:</strong></td><td>${invoiceId.slice(0, 8)}</td></tr>
          <tr><td><strong>Estado:</strong></td><td style="color: #16a34a;">PAGADO</td></tr>
        </table>
      </div>

      <p>Gracias por tu pago. Tu suscripción está activa.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Este es un correo automático de confirmación.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
      to,
      subject: `Pago Confirmado - $${amount.toFixed(2)} DOP`,
      html: htmlContent,
    });
    console.log(`✅ Email de confirmación de pago enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
  }
};

// Email de suspensión por falta de pago
export const sendSaaSSuspensionEmail = async (data: {
  to: string;
  tenantName: string;
  reason: string;
}): Promise<void> => {
  const { to, tenantName, reason } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Cuenta Suspendida</h2>
      <p>Tu cuenta <strong>${tenantName}</strong> ha sido suspendida.</p>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${reason}</p>
      </div>

      <p>Para reactivar tu cuenta, por favor contacta a soporte:</p>
      <ul>
        <li>Email: soporte@tusitio.com</li>
        <li>Teléfono: 809-555-0100</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Este es un correo automático. Responde a este mensaje para contactar soporte.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'CRM <noreply@crm.local>',
      to,
      subject: `Cuenta Suspendida - ${tenantName}`,
      html: htmlContent,
    });
    console.log(`✅ Email de suspensión enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de suspensión:', error);
  }
};
