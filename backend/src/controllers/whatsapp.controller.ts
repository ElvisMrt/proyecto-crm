import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';
import { z } from 'zod';
import { whatsappService } from '../services/whatsapp.service';


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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
    const value = variables[key] != null ? String(variables[key]) : '';
    rendered = rendered.replace(regex, value);
  });
  
  // Limpiar cualquier variable que quede sin reemplazar
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
  
  console.log('[renderTemplate] Template original:', template.substring(0, 100) + '...');
  console.log('[renderTemplate] Variables disponibles:', Object.keys(variables));
  console.log('[renderTemplate] Template renderizado:', rendered.substring(0, 100) + '...');
  
  return rendered;
};

// Función auxiliar: Obtener template por tipo
export const getTemplateByType = async (type: string, prismaClient?: any): Promise<any | null> => {
  try {
    const prisma = prismaClient || getTenantPrisma(process.env.DATABASE_URL!);
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

// Función wrapper para mantener compatibilidad
export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  subject?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  return await whatsappService.sendMessage(phone, message, subject);
};

// Obtener estado de la instancia de Evolution
export const getInstanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const instanceId = process.env.EVOLUTION_INSTANCE_ID || 'crm-whatsapp-instance';
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://evolution:8080';
    const apiKey = process.env.EVOLUTION_TOKEN || process.env.EVOLUTION_API_KEY;

    console.log(`[getInstanceStatus] Configuración:`);
    console.log(`  API URL: ${apiUrl}`);
    console.log(`  Instance ID: ${instanceId}`);
    console.log(`  API Key: ${apiKey ? 'Configurado' : 'NO CONFIGURADO'}`);

    if (!apiKey) {
      return res.status(500).json({
        error: {
          code: 'CONFIG_ERROR',
          message: 'Evolution API key no configurada',
        },
      });
    }

    // Obtener instancias con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[getInstanceStatus] ⏱️ Timeout al conectar a Evolution API`);
      controller.abort();
    }, 10000);
    
    let response;
    try {
      console.log(`[getInstanceStatus] Intentando conectar a: ${apiUrl}/instance/fetchInstances`);
      response = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[getInstanceStatus] Error: ${response.status} ${response.statusText}`);
        throw new Error(`Evolution API error: ${response.status}`);
      }

      const instances = await response.json();
    const instance = Array.isArray(instances) 
      ? instances.find((inst: any) => inst.name === instanceId || inst.instanceName === instanceId)
      : instances;

    if (!instance) {
      return res.json({
        exists: false,
        connected: false,
        status: 'NOT_FOUND',
      });
    }

    const status = instance.connectionStatus || instance.status || 'close';
    const isConnected = status === 'open' || status === 'connected';

      res.json({
        exists: true,
        connected: isConnected,
        status: status,
        instanceName: instance.name || instance.instanceName,
        number: instance.number || instance.ownerJid || null,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`[getInstanceStatus] ❌ Timeout: Evolution API no responde en ${apiUrl}`);
        return res.status(500).json({
          error: {
            code: 'EVOLUTION_API_TIMEOUT',
            message: `Timeout al conectar con Evolution API en ${apiUrl}. Verifica que el servicio esté corriendo.`,
          },
        });
      }
      if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        console.error(`[getInstanceStatus] ❌ No se puede conectar a Evolution API: ${apiUrl}`);
        return res.status(500).json({
          error: {
            code: 'EVOLUTION_API_UNREACHABLE',
            message: `No se puede conectar a Evolution API en ${apiUrl}. Verifica que el servicio esté corriendo.`,
          },
        });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[getInstanceStatus] ❌ Error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error obteniendo estado de la instancia',
      },
    });
  }
};

// Crear instancia de Evolution
export const createInstance = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const instanceId = process.env.EVOLUTION_INSTANCE_ID || 'crm-whatsapp-instance';
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://evolution:8080';
    const apiKey = process.env.EVOLUTION_TOKEN || process.env.EVOLUTION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: {
          code: 'CONFIG_ERROR',
          message: 'Evolution API key no configurada',
        },
      });
    }

    // Verificar si la instancia ya existe
    const checkResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    });

    let instanceExists = false;
    let instanceStatus: string | null = null;
    if (checkResponse.ok) {
      const instancesData: any = await checkResponse.json();
      // Evolution API puede devolver un objeto o un array
      let instances: any[] = [];
      if (Array.isArray(instancesData)) {
        instances = instancesData;
      } else if (instancesData && typeof instancesData === 'object') {
        // Si es un objeto, puede ser una instancia única o un objeto con instancias
        if (instancesData.name || instancesData.instanceName) {
          instances = [instancesData];
        } else if (Array.isArray(instancesData.instances)) {
          instances = instancesData.instances;
        }
      }
      const existingInstance = instances.find(
        (inst: any) => inst.name === instanceId || inst.instanceName === instanceId
      );
      if (existingInstance) {
        instanceExists = true;
        instanceStatus = existingInstance.connectionStatus || existingInstance.status || null;
        // Si está conectada, no hay QR disponible
        if (instanceStatus === 'open' || instanceStatus === 'connected') {
          return res.json({
            success: true,
            message: 'La instancia ya está conectada. No se requiere QR code.',
            qrCode: null,
            connected: true,
          });
        }
      }
    }

    // Si la instancia no existe, crearla
    if (!instanceExists) {
      const createResponse = await fetch(`${apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          instanceName: instanceId,
          token: apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        // Si el error es que ya existe, continuar para obtener QR
        if (errorText.includes('already exists') || errorText.includes('already in use')) {
          instanceExists = true;
        } else {
          throw new Error(`Evolution API error: ${createResponse.status} - ${errorText}`);
        }
      } else {
        // Si se creó exitosamente, esperar un momento para que se genere el QR
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Intentar obtener QR code - esperar un poco más para que se genere
    let qrCode = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!qrCode && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos entre intentos
      
      const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });

      if (qrResponse.ok) {
        const qrData: any = await qrResponse.json();
        // El QR puede venir en diferentes formatos
        let rawQR: string | null = null;
        if (qrData.qrcode) {
          // Si qrcode es un objeto con base64 o code
          if (qrData.qrcode.base64) {
            rawQR = qrData.qrcode.base64;
          } else if (qrData.qrcode.code) {
            rawQR = qrData.qrcode.code;
          } else if (typeof qrData.qrcode === 'string') {
            // Si qrcode es directamente un string (base64)
            rawQR = qrData.qrcode;
          }
        } else if (qrData.base64) {
          rawQR = qrData.base64;
        } else if (qrData.code) {
          rawQR = qrData.code;
        } else if (qrData.count === 0) {
          // Si count es 0, el QR aún no está disponible, continuar intentando
          console.log(`QR no disponible aún, intento ${attempts + 1}/${maxAttempts}`);
        }
        
        // Limpiar el QR: remover el prefijo data: si existe, dejar solo el base64 puro
        if (rawQR) {
          qrCode = rawQR.replace(/^data:image\/[^;]+;base64,/, '');
        }
      }
      attempts++;
    }

    // Si no hay QR y la instancia existe, intentar eliminar y recrear
    if (!qrCode && instanceExists) {
      try {
        // Eliminar instancia existente
        await fetch(`${apiUrl}/instance/delete/${instanceId}`, {
          method: 'DELETE',
          headers: {
            'apikey': apiKey,
          },
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recrear instancia
        const recreateResponse = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
            'apikey': apiKey,
      },
      body: JSON.stringify({
            instanceName: instanceId,
            token: apiKey,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
      }),
    });
    
        if (recreateResponse.ok) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Intentar obtener QR nuevamente con múltiples intentos
          let qrAttempts = 0;
          while (!qrCode && qrAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const qrResponse2 = await fetch(`${apiUrl}/instance/connect/${instanceId}`, {
              method: 'GET',
              headers: {
                'apikey': apiKey,
              },
            });

            if (qrResponse2.ok) {
              const qrData2: any = await qrResponse2.json();
              let rawQR2: string | null = null;
              if (qrData2.qrcode) {
                if (qrData2.qrcode.base64) {
                  rawQR2 = qrData2.qrcode.base64;
                } else if (qrData2.qrcode.code) {
                  rawQR2 = qrData2.qrcode.code;
                } else if (typeof qrData2.qrcode === 'string') {
                  rawQR2 = qrData2.qrcode;
                }
              } else if (qrData2.base64) {
                rawQR2 = qrData2.base64;
              } else if (qrData2.code) {
                rawQR2 = qrData2.code;
              }
              
              // Limpiar el QR: remover el prefijo data: si existe
              if (rawQR2) {
                qrCode = rawQR2.replace(/^data:image\/[^;]+;base64,/, '');
              }
            }
            qrAttempts++;
          }
        }
      } catch (deleteError) {
        console.error('Error deleting/recreating instance:', deleteError);
      }
    }

    // Log para depuración
    console.log('QR Code result:', {
      hasQR: !!qrCode,
      qrLength: qrCode ? qrCode.length : 0,
      qrPreview: qrCode ? qrCode.substring(0, 50) + '...' : null,
    });

    res.json({
      success: true,
      message: instanceExists ? 'La instancia ya existe. QR code obtenido.' : 'Instancia creada exitosamente',
      qrCode: qrCode,
      connected: instanceStatus ? (instanceStatus === 'open' || instanceStatus === 'connected') : false,
    });
  } catch (error: any) {
    console.error('Create instance error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error creando instancia',
      },
    });
  }
};

// Obtener QR code de la instancia
export const getQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const instanceId = process.env.EVOLUTION_INSTANCE_ID || 'crm-whatsapp-instance';
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://evolution:8080';
    const apiKey = process.env.EVOLUTION_TOKEN || process.env.EVOLUTION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: {
          code: 'CONFIG_ERROR',
          message: 'Evolution API key no configurada',
        },
      });
    }

    // Conectar instancia y obtener QR (usar PUT para conectar)
    const response = await fetch(`${apiUrl}/instance/connect/${instanceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        qrcode: true,
      }),
    });

    let qrCode = null;
    if (response.ok) {
      const data: any = await response.json();
      // El QR puede venir en diferentes formatos
      let rawQR: string | null = null;
      if (data.qrcode) {
        rawQR = data.qrcode.base64 || data.qrcode.code || null;
      } else if (data.base64) {
        rawQR = data.base64;
      } else if (data.code) {
        rawQR = data.code;
      }
      
      // Limpiar el QR: remover el prefijo data: si existe
      if (rawQR) {
        qrCode = rawQR.replace(/^data:image\/[^;]+;base64,/, '');
      }
    } else {
      // Si PUT falla, intentar con GET
      const responseGet = await fetch(`${apiUrl}/instance/connect/${instanceId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });
      if (responseGet.ok) {
        const dataGet: any = await responseGet.json();
        let rawQRGet: string | null = null;
        if (dataGet.qrcode) {
          rawQRGet = dataGet.qrcode.base64 || dataGet.qrcode.code || null;
        }
        
        // Limpiar el QR: remover el prefijo data: si existe
        if (rawQRGet) {
          qrCode = rawQRGet.replace(/^data:image\/[^;]+;base64,/, '');
        }
      } else {
        throw new Error(`Evolution API error: ${responseGet.status}`);
      }
    }

    if (!qrCode) {
      return res.json({
        qrCode: null,
        message: 'No hay QR code disponible. La instancia puede estar conectada.',
      });
    }

    res.json({
      qrCode: qrCode,
      message: 'QR code obtenido exitosamente',
    });
  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error obteniendo QR code',
      },
    });
  }
};

// Endpoint para enviar mensaje usando template
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    // Schema simplificado - sin transformaciones complejas
    const sendMessageSchema = z.object({
      phone: z.string().min(1, 'El número de teléfono es requerido'),
      templateId: z.string().uuid().optional().nullable(),
      templateType: z.enum(['INVOICE', 'QUOTE', 'PAYMENT', 'REMINDER', 'CUSTOM']).optional().nullable(),
      message: z.string().optional().nullable(),
      subject: z.string().optional().nullable(),
      variables: z.any().optional().nullable(), // Acepta cualquier tipo para variables
    }).passthrough(); // Permite campos adicionales sin error

    console.log('=== WhatsApp Send Message Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Phone value:', req.body?.phone, 'Type:', typeof req.body?.phone);
    console.log('TemplateType value:', req.body?.templateType, 'Type:', typeof req.body?.templateType);
    console.log('Variables value:', req.body?.variables, 'Type:', typeof req.body?.variables);
    console.log('Raw request body:', req.body);
    
    // Validar que req.body existe y tiene los campos necesarios
    if (!req.body) {
      console.error('❌ req.body is null or undefined');
      return res.status(400).json({
        error: {
          code: 'MISSING_BODY',
          message: 'El cuerpo de la petición está vacío',
        },
      });
    }
    
    if (!req.body.phone) {
      console.error('❌ phone is missing in request body');
      return res.status(400).json({
        error: {
          code: 'MISSING_PHONE',
          message: 'El número de teléfono es requerido',
        },
      });
    }

    let data;
    try {
      // Intentar parsear con el schema
      const parseResult = sendMessageSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        console.error('❌ Validation error details:', JSON.stringify(parseResult.error.errors, null, 2));
        console.error('Failed input:', JSON.stringify(req.body, null, 2));
        console.error('Error issues:', parseResult.error.issues);
        
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Error de validación en los datos enviados',
            details: parseResult.error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
              received: err.input,
              code: err.code,
            })),
          },
        });
      }
      
      data = parseResult.data;
      console.log('✅ Validation successful');
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } catch (validationError: any) {
      console.error('❌ Unexpected validation error:', validationError);
      console.error('Error stack:', validationError.stack);
      return res.status(500).json({
        error: {
          code: 'VALIDATION_EXCEPTION',
          message: 'Error inesperado durante la validación',
          details: validationError.message,
        },
      });
    }

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
        template = await getTemplateByType(data.templateType, prisma);
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.controller.ts:753',message:'sending WhatsApp message',data:{phone:data.phone,messageLength:message.length,hasSubject:!!subject},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Enviar mensaje
    console.log('[WhatsApp Controller] Llamando a sendWhatsAppMessage...');
    console.log('[WhatsApp Controller] Parámetros:', { phone: data.phone, messageLength: message.length, hasSubject: !!subject });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.controller.ts:857',message:'about to call sendWhatsAppMessage',data:{phone:data.phone,messageLength:message.length,hasSubject:!!subject},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    const result = await sendWhatsAppMessage(data.phone, message, subject);
    
    console.log('[WhatsApp Controller] Resultado de sendWhatsAppMessage:', JSON.stringify(result, null, 2));
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.controller.ts:863',message:'WhatsApp message result',data:{success:result.success,messageId:result.messageId,error:result.error,errorType:typeof result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    if (!result.success) {
      console.error('[WhatsApp Controller] ❌ Error al enviar mensaje:', result.error);
      console.error('[WhatsApp Controller] Error completo:', JSON.stringify(result, null, 2));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43b96eb6-9b87-4fa0-8226-73f51dc2add4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsapp.controller.ts:870',message:'returning 400 error',data:{errorCode:'SEND_FAILED',errorMessage:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      return res.status(400).json({
        error: {
          code: 'SEND_FAILED',
          message: result.error || 'Error al enviar mensaje WhatsApp',
          details: result.error, // Incluir detalles del error
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


