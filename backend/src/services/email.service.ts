import nodemailer from 'nodemailer';

// Configuración SMTP — Hostinger con info@neypier.com
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true por defecto (465 = SSL)
  auth: {
    user: process.env.SMTP_USER || 'info@neypier.com',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM_NAME = process.env.SMTP_FROM_NAME || 'CRM Neypier';
const FROM_EMAIL = process.env.SMTP_USER || 'info@neypier.com';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;
const CRM_DOMAIN = process.env.CRM_DOMAIN || 'neypier.com';

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
    from: FROM,
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
    from: FROM,
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
          <tr><td><strong>URL:</strong></td><td>https://${subdomain}.${CRM_DOMAIN}</td></tr>
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
      from: FROM,
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
      from: FROM,
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
      from: FROM,
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
      from: FROM,
      to,
      subject: `Cuenta Suspendida - ${tenantName}`,
      html: htmlContent,
    });
    console.log(`✅ Email de suspensión enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de suspensión:', error);
  }
};

// ============================================
// Reset de Contraseña
// ============================================
export const sendPasswordResetEmail = async (data: {
  to: string;
  name: string;
  resetToken: string;
  tenantSlug: string;
}): Promise<void> => {
  const { to, name, resetToken, tenantSlug } = data;
  const resetUrl = `https://${tenantSlug}.${CRM_DOMAIN}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Recuperar Contraseña</h1>
      </div>
      <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151;">Hola <strong>${name}</strong>,</p>
        <p style="color: #6b7280;">Recibimos una solicitud para restablecer la contraseña de tu cuenta CRM.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #1e40af; color: white; padding: 14px 36px;
                    text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Restablecer Contraseña
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 13px;">O copia este enlace en tu navegador:</p>
        <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #374151;">
          ${resetUrl}
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            ⚠️ Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.
          </p>
        </div>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
        Enviado desde info@neypier.com · CRM Neypier
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: '🔐 Restablecer contraseña - CRM Neypier',
    html: htmlContent,
  });
  console.log(`✅ Email de reset password enviado a ${to}`);
};

// Email de bienvenida al crear un tenant (con dominio real)
export const sendTenantWelcomeEmail = async (data: {
  to: string;
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<void> => {
  const { to, tenantName, subdomain, adminEmail, adminPassword } = data;
  const crmUrl = `https://${subdomain}.${CRM_DOMAIN}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">¡Bienvenido a ${tenantName}!</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">Tu CRM está listo para usar</p>
      </div>
      <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151;">Hola,</p>
        <p style="color: #6b7280;">Tu cuenta en el sistema CRM ha sido creada exitosamente. Aquí están tus datos de acceso:</p>

        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;"><strong>URL:</strong></td>
                <td style="padding: 6px 0;"><a href="${crmUrl}" style="color: #1e40af;">${crmUrl}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Email:</strong></td>
                <td style="padding: 6px 0;">${adminEmail}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;"><strong>Contraseña:</strong></td>
                <td style="padding: 6px 0; font-family: monospace; font-size: 16px;">${adminPassword}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${crmUrl}"
             style="display: inline-block; background: #1e40af; color: white; padding: 14px 36px;
                    text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Ingresar al CRM
          </a>
        </div>

        <p style="color: #dc2626; font-size: 13px;">
          <strong>Importante:</strong> Por seguridad, cambia tu contraseña después del primer inicio de sesión.
        </p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
        Enviado desde info@neypier.com · CRM Neypier
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `¡Tu CRM ${tenantName} está listo! Datos de acceso`,
    html: htmlContent,
  });
  console.log(`✅ Email de bienvenida tenant enviado a ${to}`);
};

// Enviar mensaje de contacto desde el website de Neypier
export const sendWebsiteContact = async (data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<void> => {
  const { name, email, phone, subject, message } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px 28px;">
        <h2 style="margin: 0; color: white; font-size: 20px;">✉️ Nuevo mensaje desde neypier.com</h2>
      </div>
      <div style="padding: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 10px 0; color: #6b7280; width: 110px; vertical-align: top;"><strong>Nombre:</strong></td>
            <td style="padding: 10px 0; color: #111827;">${name}</td>
          </tr>
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; vertical-align: top;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; color: #111827;"><a href="mailto:${email}" style="color: #0ea5e9;">${email}</a></td>
          </tr>
          ${phone ? `
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; vertical-align: top;"><strong>Teléfono:</strong></td>
            <td style="padding: 10px 0; color: #111827;">${phone}</td>
          </tr>` : ''}
          ${subject ? `
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; vertical-align: top;"><strong>Asunto:</strong></td>
            <td style="padding: 10px 0; color: #111827;">${subject}</td>
          </tr>` : ''}
          <tr style="border-top: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; vertical-align: top;"><strong>Mensaje:</strong></td>
            <td style="padding: 10px 0; color: #111827; white-space: pre-line;">${message}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f9fafb; padding: 14px 28px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          Mensaje recibido desde <a href="https://neypier.com" style="color: #0ea5e9;">neypier.com</a> · ${new Date().toLocaleString('es-DO')}
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: 'info@neypier.com',
    replyTo: `${name} <${email}>`,
    subject: `Contacto web: ${subject || name}`,
    html: htmlContent,
  });
  console.log(`✅ Mensaje de contacto web enviado desde ${email}`);
};

// Enviar cotización desde el website de Neypier
export const sendWebsiteQuote = async (data: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  products: { name: string; quantity: number; price: number }[];
  total: number;
}): Promise<void> => {
  const { name, email, phone, notes, products, total } = data;

  const productRows = products.map(p => `
    <tr style="border-top: 1px solid #f3f4f6;">
      <td style="padding: 8px 12px; color: #111827;">${p.name}</td>
      <td style="padding: 8px 12px; text-align: center; color: #374151;">${p.quantity}</td>
      <td style="padding: 8px 12px; text-align: right; color: #374151;">$${p.price.toFixed(2)}</td>
      <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #0ea5e9;">$${(p.price * p.quantity).toFixed(2)}</td>
    </tr>`).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px 28px;">
        <h2 style="margin: 0; color: white; font-size: 20px;">🛒 Nueva Solicitud de Cotización</h2>
      </div>
      <div style="padding: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 110px;"><strong>Cliente:</strong></td>
            <td style="padding: 8px 0; color: #111827;">${name}</td>
          </tr>
          ${email ? `<tr><td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0ea5e9;">${email}</a></td></tr>` : ''}
          ${phone ? `<tr><td style="padding: 8px 0; color: #6b7280;"><strong>Teléfono:</strong></td><td style="padding: 8px 0; color: #111827;">${phone}</td></tr>` : ''}
        </table>

        <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Productos Solicitados</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px 12px; text-align: left; color: #6b7280;">Producto</th>
              <th style="padding: 10px 12px; text-align: center; color: #6b7280;">Cant.</th>
              <th style="padding: 10px 12px; text-align: right; color: #6b7280;">Precio</th>
              <th style="padding: 10px 12px; text-align: right; color: #6b7280;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
          <tfoot>
            <tr style="background: #eff6ff; border-top: 2px solid #0ea5e9;">
              <td colspan="3" style="padding: 12px; font-weight: 700; color: #0284c7; text-align: right;">TOTAL:</td>
              <td style="padding: 12px; font-weight: 700; color: #0284c7; text-align: right; font-size: 16px;">$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        ${notes ? `
        <div style="margin-top: 20px; background: #fefce8; padding: 14px; border-radius: 6px; border-left: 4px solid #eab308;">
          <strong style="color: #854d0e;">Notas:</strong>
          <p style="margin: 6px 0 0 0; color: #854d0e;">${notes}</p>
        </div>` : ''}
      </div>
      <div style="background: #f9fafb; padding: 14px 28px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          Cotización recibida desde <a href="https://neypier.com" style="color: #0ea5e9;">neypier.com</a> · ${new Date().toLocaleString('es-DO')}
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: 'info@neypier.com',
    replyTo: email ? `${name} <${email}>` : undefined,
    subject: `Cotizacion web: ${name} - $${total.toFixed(2)}`,
    html: htmlContent,
  });
  console.log(`✅ Cotización web enviada de ${name} - $${total.toFixed(2)}`);
};
