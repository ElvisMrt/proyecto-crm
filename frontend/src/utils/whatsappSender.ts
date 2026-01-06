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

    const response = await whatsappApi.sendMessage({
      phone,
      templateType,
      variables,
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

  const variables = {
    number: invoice.number,
    ncf: invoice.ncf || 'N/A',
    clientName: invoice.client?.name || 'Cliente',
    total: new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(invoice.total)),
    date: new Date(invoice.issueDate).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    items: itemsText,
    balance: invoice.balance ? new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(Number(invoice.balance)) : '0.00',
  };

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


