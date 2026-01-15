// Utility functions for sending WhatsApp messages using templates

import { whatsappApi } from '../services/api';

/**
 * Envía un mensaje WhatsApp usando un template
 */
export const sendWhatsAppWithTemplate = async (
  phone: string,
  templateType: 'INVOICE' | 'QUOTE' | 'PAYMENT' | 'REMINDER' | 'CUSTOM',
  variables: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!phone) {
      return {
        success: false,
        error: 'Número de teléfono no proporcionado',
      };
    }

    // Limpiar el número de teléfono
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        error: 'Número de teléfono inválido',
      };
    }

    // Asegurar que las variables sean strings
    const cleanVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      cleanVariables[key] = String(value || '');
    }

    const requestData = {
      phone: cleanPhone,
      templateType,
      variables: cleanVariables,
    };
    
    console.log('=== Sending WhatsApp message ===');
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    console.log('Phone:', cleanPhone, 'Type:', typeof cleanPhone);
    console.log('TemplateType:', templateType, 'Type:', typeof templateType);
    console.log('Variables:', cleanVariables, 'Type:', typeof cleanVariables);
    console.log('Variables keys:', Object.keys(cleanVariables));

    const response = await whatsappApi.sendMessage(requestData);
    console.log('✅ WhatsApp message sent successfully:', response);
    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseStatusText: error.response?.statusText,
    });
    
    // Extraer mensaje de error más detallado
    let errorMessage = 'Error al enviar mensaje WhatsApp';
    if (error.response?.data?.error) {
      if (error.response.data.error.details) {
        errorMessage = `Error de validación: ${JSON.stringify(error.response.data.error.details)}`;
      } else if (error.response.data.error.message) {
        errorMessage = error.response.data.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Envía un mensaje WhatsApp personalizado (sin template)
 */
export const sendWhatsAppCustom = async (
  phone: string,
  message: string,
  subject?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!phone) {
      return {
        success: false,
        error: 'Número de teléfono no proporcionado',
      };
    }

    const response = await whatsappApi.sendMessage({
      phone,
      message,
      subject,
    });

    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Error al enviar mensaje WhatsApp',
    };
  }
};

/**
 * Envía factura por WhatsApp usando template
 */
export const sendInvoiceWhatsApp = async (invoice: any): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!invoice.client?.phone) {
    return {
      success: false,
      error: 'El cliente no tiene número de teléfono registrado',
    };
  }

  // Validar que el teléfono tenga al menos 10 dígitos
  const phoneDigits = invoice.client.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return {
      success: false,
      error: 'El número de teléfono del cliente no es válido',
    };
  }

  // Preparar variables para el template
  const itemsText = invoice.items?.map((item: any, index: number) => {
    const productName = item.product?.name || item.description;
    const quantity = Number(item.quantity).toFixed(2);
    const price = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.price));
    const subtotal = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.subtotal));
    return `${index + 1}. ${productName} - ${quantity} x ${price} = ${subtotal}`;
  }).join('\n') || '';

  const variables: Record<string, string> = {
    number: String(invoice.number || 'N/A'),
    ncf: String(invoice.ncf || 'N/A'),
    clientName: String(invoice.client?.name || 'Cliente'),
    total: new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(invoice.total || 0)),
    date: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : new Date().toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    items: String(itemsText || ''),
    balance: invoice.balance ? new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(invoice.balance)) : '0.00',
  };
  
  // Asegurar que todas las variables sean strings válidos
  Object.keys(variables).forEach(key => {
    if (variables[key] === null || variables[key] === undefined) {
      variables[key] = '';
    }
  });

  return sendWhatsAppWithTemplate(invoice.client.phone, 'INVOICE', variables);
};

/**
 * Envía cotización por WhatsApp usando template
 */
export const sendQuoteWhatsApp = async (quote: any): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!quote.client?.phone) {
    return {
      success: false,
      error: 'El cliente no tiene número de teléfono registrado',
    };
  }

  // Preparar variables para el template
  const itemsText = quote.items?.map((item: any, index: number) => {
    const productName = item.product?.name || item.description;
    const quantity = Number(item.quantity).toFixed(2);
    const price = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.price));
    const subtotal = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.subtotal));
    return `${index + 1}. ${productName} - ${quantity} x ${price} = ${subtotal}`;
  }).join('\n') || '';

  const variables = {
    number: quote.number,
    clientName: quote.client?.name || 'Cliente',
    total: new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(quote.total)),
    date: new Date(quote.createdAt).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    validUntil: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : 'N/A',
    items: itemsText,
  };

  return sendWhatsAppWithTemplate(quote.client.phone, 'QUOTE', variables);
};

/**
 * Envía nota de crédito por WhatsApp usando template
 */
export const sendCreditNoteWhatsApp = async (creditNote: any): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const invoice = creditNote.invoice;
  const client = invoice?.client;
  
  if (!client?.phone) {
    return {
      success: false,
      error: 'El cliente no tiene número de teléfono registrado',
    };
  }

  // Preparar variables para el template
  const itemsText = creditNote.items?.map((item: any, index: number) => {
    const productName = item.product?.name || item.description;
    const quantity = Number(item.quantity).toFixed(2);
    const price = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.price));
    const subtotal = new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(item.subtotal));
    return `${index + 1}. ${productName} - ${quantity} x ${price} = ${subtotal}`;
  }).join('\n') || '';

  const variables = {
    number: creditNote.number,
    ncf: creditNote.ncf || 'N/A',
    invoiceNumber: invoice?.number || 'N/A',
    clientName: client?.name || 'Cliente',
    total: new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(creditNote.total)),
    date: new Date(creditNote.issueDate).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    reason: creditNote.reason,
    items: itemsText,
  };

  // Usar template CUSTOM para notas de crédito (o crear tipo CREDIT_NOTE)
  return sendWhatsAppWithTemplate(client.phone, 'CUSTOM', variables);
};

/**
 * Envía estado de cuenta por WhatsApp
 */
export const sendAccountStatusWhatsApp = async (
  client: { name: string; phone?: string; identification?: string },
  accountStatus: {
    summary: {
      totalReceivable: number;
      totalOverdue: number;
      totalPaid: number;
      invoiceCount: number;
    };
    invoices: Array<{
      number: string;
      ncf: string | null;
      issueDate: string;
      dueDate: string | null;
      total: number;
      paid: number;
      balance: number;
      daysOverdue: number;
    }>;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!client.phone) {
    return {
      success: false,
      error: 'El cliente no tiene número de teléfono registrado',
    };
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Construir mensaje del estado de cuenta
  let message = `📊 *Estado de Cuenta*\n\n`;
  message += `Cliente: ${client.name}\n`;
  if (client.identification) {
    message += `Identificación: ${client.identification}\n`;
  }
  message += `\n📈 *Resumen:*\n`;
  message += `Total por Cobrar: ${formatCurrency(accountStatus.summary.totalReceivable)}\n`;
  message += `Total Vencido: ${formatCurrency(accountStatus.summary.totalOverdue)}\n`;
  message += `Total Pagado: ${formatCurrency(accountStatus.summary.totalPaid)}\n`;
  message += `Número de Facturas: ${accountStatus.summary.invoiceCount}\n`;

  if (accountStatus.invoices && accountStatus.invoices.length > 0) {
    message += `\n📋 *Facturas Pendientes:*\n\n`;
    accountStatus.invoices.slice(0, 10).forEach((invoice, index) => {
      message += `${index + 1}. Factura ${invoice.number}\n`;
      if (invoice.ncf) {
        message += `   NCF: ${invoice.ncf}\n`;
      }
      message += `   Fecha: ${formatDate(invoice.issueDate)}\n`;
      message += `   Vencimiento: ${formatDate(invoice.dueDate)}\n`;
      message += `   Total: ${formatCurrency(invoice.total)}\n`;
      message += `   Pagado: ${formatCurrency(invoice.paid)}\n`;
      message += `   Saldo: ${formatCurrency(invoice.balance)}\n`;
      if (invoice.daysOverdue > 0) {
        message += `   ⚠️ Vencida hace ${invoice.daysOverdue} días\n`;
      }
      message += `\n`;
    });

    if (accountStatus.invoices.length > 10) {
      message += `... y ${accountStatus.invoices.length - 10} factura(s) más\n`;
    }
  }

  message += `\nFecha de emisión: ${new Date().toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}\n`;

  message += `\nPor favor, revise su estado de cuenta y contacte con nosotros si tiene alguna pregunta.`;

  return sendWhatsAppCustom(client.phone, message, 'Estado de Cuenta');
};


