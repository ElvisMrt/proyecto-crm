import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema para crear template
const createTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['INVOICE', 'QUOTE', 'PAYMENT', 'REMINDER', 'CUSTOM']),
  subject: z.string().optional(),
  message: z.string().min(1),
});

// Schema para actualizar template
const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['INVOICE', 'QUOTE', 'PAYMENT', 'REMINDER', 'CUSTOM']).optional(),
  subject: z.string().optional().nullable(),
  message: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Obtener todos los templates
export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: templates,
    });
  } catch (error) {
    console.error('Get WhatsApp templates error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching WhatsApp templates',
      },
    });
  }
};

// Obtener un template por ID
export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    res.json(template);
  } catch (error) {
    console.error('Get WhatsApp template error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching WhatsApp template',
      },
    });
  }
};

// Crear nuevo template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createTemplateSchema.parse(req.body);

    const template = await prisma.whatsAppTemplate.create({
      data,
    });

    res.status(201).json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_NAME',
          message: 'Ya existe un template con este nombre',
        },
      });
    }

    console.error('Create WhatsApp template error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating WhatsApp template',
      },
    });
  }
};

// Actualizar template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        ...data,
        subject: data.subject === null ? null : data.subject,
      },
    });

    res.json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    console.error('Update WhatsApp template error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating WhatsApp template',
      },
    });
  }
};

// Eliminar template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;

    await prisma.whatsAppTemplate.delete({
      where: { id },
    });

    res.json({
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    console.error('Delete WhatsApp template error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting WhatsApp template',
      },
    });
  }
};

// Función auxiliar: Renderizar template con variables
export const renderTemplate = (template: string, variables: Record<string, any>): string => {
  let rendered = template;
  
  // Reemplazar variables {{variableName}}
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, variables[key] || '');
  });
  
  return rendered;
};

// Función auxiliar: Obtener template por tipo
export const getTemplateByType = async (type: string): Promise<any | null> => {
  try {
    const template = await prisma.whatsAppTemplate.findFirst({
      where: {
        type,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return template;
  } catch (error) {
    console.error('Get template by type error:', error);
    return null;
  }
};

// Enviar mensaje WhatsApp (simulado - en producción usar API real)
export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  subject?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Validar formato de teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return {
        success: false,
        error: 'Número de teléfono inválido',
      };
    }

    // En producción, aquí se integraría con:
    // - WhatsApp Business API
    // - Twilio WhatsApp API
    // - Otro proveedor de WhatsApp
    
    // Por ahora, simulamos el envío
    console.log(`[WhatsApp Simulado] Enviando mensaje a ${cleanPhone}:`);
    if (subject) {
      console.log(`Asunto: ${subject}`);
    }
    console.log(`Mensaje: ${message}`);
    
    // En producción, descomentar y usar:
    /*
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    
    const response = await fetch(`${whatsappApiUrl}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: cleanPhone,
        message: message,
        subject: subject,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error al enviar mensaje WhatsApp');
    }
    
    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
    */
    
    // Simulación exitosa
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error: any) {
    console.error('Send WhatsApp message error:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar mensaje WhatsApp',
    };
  }
};

// Endpoint para enviar mensaje usando template
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const sendMessageSchema = z.object({
      phone: z.string().min(1),
      templateId: z.string().uuid().optional(),
      templateType: z.enum(['INVOICE', 'QUOTE', 'PAYMENT', 'REMINDER', 'CUSTOM']).optional(),
      message: z.string().min(1).optional(),
      variables: z.record(z.any()).optional(),
    });

    const data = sendMessageSchema.parse(req.body);

    let message = data.message;
    let subject: string | undefined;

    // Si se proporciona templateId o templateType, usar template
    if (data.templateId || data.templateType) {
      let template;
      
      if (data.templateId) {
        template = await prisma.whatsAppTemplate.findUnique({
          where: { id: data.templateId },
        });
      } else if (data.templateType) {
        template = await getTemplateByType(data.templateType);
      }

      if (!template || !template.isActive) {
        return res.status(404).json({
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template no encontrado o inactivo',
          },
        });
      }

      // Renderizar template con variables
      message = renderTemplate(template.message, data.variables || {});
      subject = template.subject || undefined;
    }

    if (!message) {
      return res.status(400).json({
        error: {
          code: 'MISSING_MESSAGE',
          message: 'Debe proporcionar un mensaje o un template',
        },
      });
    }

    // Enviar mensaje
    const result = await sendWhatsAppMessage(data.phone, message, subject);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'SEND_FAILED',
          message: result.error || 'Error al enviar mensaje WhatsApp',
        },
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Mensaje enviado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Send message error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error sending WhatsApp message',
      },
    });
  }
};


