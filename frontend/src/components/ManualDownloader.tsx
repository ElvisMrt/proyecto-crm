import { useState } from 'react';
import jsPDF from 'jspdf';
import { HiDownload, HiBookOpen, HiCheckCircle } from 'react-icons/hi';

interface ManualDownloaderProps {
  variant?: 'button' | 'menu' | 'icon';
}

const ManualDownloader = ({ variant = 'button' }: ManualDownloaderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Colores del tema
      const primaryColor = '#2563eb'; // blue-600
      const secondaryColor = '#7c3aed'; // violet-600
      const accentColor = '#059669'; // emerald-600
      const textColor = '#1f2937'; // gray-800
      const lightGray = '#f3f4f6'; // gray-100
      
      let yPosition = 0;
      
      // Helper para agregar página con header
      const addPage = (pageNum: number) => {
        if (pageNum > 1) {
          doc.addPage();
        }
        yPosition = margin;
        
        // Header con gradiente simulado
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 12, 'F');
        
        // Logo text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CRM Sistema de Gestión', margin, 8);
        
        // Página number
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${pageNum}`, pageWidth - margin - 15, 8);
        
        yPosition = 25;
      };
      
      let currentPage = 1;
      addPage(currentPage);
      
      // ===== PORTADA =====
      // Fondo decorativo superior
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      // Círculos decorativos
      doc.setFillColor(59, 130, 246);
      doc.circle(pageWidth - 40, 40, 25, 'F');
      doc.setFillColor(124, 58, 237);
      doc.circle(pageWidth - 25, 60, 15, 'F');
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('MANUAL DE USUARIO', margin, 50);
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema CRM + Facturación', margin, 65);
      
      yPosition = 100;
      
      // Logo/Icono simulado
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(margin, yPosition, 40, 40, 8, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM', margin + 8, yPosition + 25);
      
      yPosition += 55;
      
      // Info de versión
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Versión 1.0.0 | Febrero 2026', margin, yPosition);
      
      yPosition += 20;
      
      // Descripción
      doc.setTextColor(textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const description = 'Este manual contiene toda la información necesaria para utilizar eficientemente el Sistema de Gestión Empresarial CRM, diseñado específicamente para MIPYMES en República Dominicana.';
      const splitDesc = doc.splitTextToSize(description, contentWidth);
      doc.text(splitDesc, margin, yPosition);
      
      // ===== ÍNDICE =====
      currentPage++;
      addPage(currentPage);
      
      // Título de sección
      doc.setFillColor(primaryColor);
      doc.roundedRect(margin, yPosition - 5, contentWidth, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ÍNDICE DE CONTENIDO', margin + 5, yPosition + 3);
      
      yPosition += 20;
      
      const sections = [
        { num: '1', title: 'Introducción al Sistema', page: '3' },
        { num: '2', title: 'Primeros Pasos', page: '4' },
        { num: '3', title: 'Roles y Permisos', page: '5' },
        { num: '4', title: 'Dashboard', page: '6' },
        { num: '5', title: 'Flujo Completo del Sistema', page: '7' },
        { num: '6', title: 'Módulo de Ventas', page: '8' },
        { num: '7', title: 'Módulo de Caja', page: '11' },
        { num: '8', title: 'Módulo de Cuentas por Cobrar', page: '13' },
        { num: '9', title: 'Módulo de Inventario', page: '15' },
        { num: '10', title: 'Módulo de Clientes', page: '17' },
        { num: '11', title: 'Módulo CRM', page: '18' },
        { num: '12', title: 'Configuración', page: '19' },
        { num: '13', title: 'Solución de Problemas', page: '20' },
        { num: '14', title: 'Preguntas Frecuentes', page: '21' },
      ];
      
      sections.forEach((section, index) => {
        // Alternar colores de fondo
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, yPosition - 4, contentWidth, 8, 2, 2, 'F');
        }
        
        // Número de sección (badge)
        doc.setFillColor(primaryColor);
        doc.roundedRect(margin + 2, yPosition - 3, 8, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(section.num, margin + 4, yPosition + 1);
        
        // Título
        doc.setTextColor(textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(section.title, margin + 15, yPosition + 1);
        
        // Página (alineado a derecha)
        doc.setTextColor(156, 163, 175);
        doc.text(section.page, pageWidth - margin - 10, yPosition + 1);
        
        // Línea punteada
        doc.setDrawColor(229, 231, 235);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin + 50, yPosition + 1, pageWidth - margin - 15, yPosition + 1);
        doc.setLineDashPattern([], 0);
        
        yPosition += 12;
      });
      
      // ===== CONTENIDO =====
      const addContentSection = (title: string, content: string[], color: string = primaryColor) => {
        currentPage++;
        addPage(currentPage);
        
        // Header de sección
        doc.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
        doc.roundedRect(margin, yPosition - 5, contentWidth, 14, 4, 4, 'F');
        
        // Icono simulado
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 8, yPosition + 2, 4, 'F');
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 18, yPosition + 4);
        
        yPosition += 20;
        
        // Contenido
        doc.setTextColor(textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        content.forEach((paragraph) => {
          if (yPosition > pageHeight - margin - 20) {
            currentPage++;
            addPage(currentPage);
          }
          
          if (paragraph.startsWith('## ')) {
            // Subtítulo
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(primaryColor);
            doc.text(paragraph.replace('## ', ''), margin, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(textColor);
          } else if (paragraph.startsWith('- ')) {
            // Bullet point
            doc.setFillColor(primaryColor);
            doc.circle(margin + 2, yPosition - 1.5, 1.5, 'F');
            const text = paragraph.replace('- ', '');
            const splitText = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(splitText, margin + 8, yPosition);
            yPosition += 6 * splitText.length;
          } else if (paragraph.startsWith('| ')) {
            // Tabla simple
            doc.setFillColor(lightGray);
            doc.roundedRect(margin, yPosition - 3, contentWidth, 6, 1, 1, 'F');
            doc.text(paragraph.replace('| ', ''), margin + 5, yPosition + 1);
            yPosition += 10;
          } else {
            // Texto normal
            const splitText = doc.splitTextToSize(paragraph, contentWidth);
            doc.text(splitText, margin, yPosition);
            yPosition += 5 * splitText.length + 3;
          }
        });
        
        return yPosition;
      };
      
      // Sección 1: Introducción
      addContentSection('1. INTRODUCCIÓN AL SISTEMA', [
        'El Sistema CRM + Facturación es una plataforma integral diseñada para Micro, Pequeñas y Medianas Empresas (MIPYMES) en República Dominicana.',
        '',
        '## Módulos Principales',
        '- Ventas: Facturación, cotizaciones, punto de venta (POS)',
        '- Caja: Control diario de efectivo, apertura y cierre',
        '- Cuentas por Cobrar: Gestión de créditos y cobros pendientes',
        '- Inventario: Control de productos, stock y movimientos',
        '- Clientes: Base de datos de clientes y seguimiento',
        '- CRM: Tareas comerciales y recordatorios',
        '- Reportes: Análisis y estadísticas del negocio',
        '',
        'El sistema está orientado a cumplir con la normativa fiscal de República Dominicana, incluyendo la gestión de NCF (Números de Comprobante Fiscal).',
      ]);
      
      // Sección 2: Primeros Pasos
      addContentSection('2. PRIMEROS PASOS', [
        'Para comenzar a utilizar el sistema, necesita sus credenciales de acceso.',
        '',
        '## Credenciales de Acceso (Desarrollo)',
        '| Administrador: admin@crm.com / admin123',
        '| Supervisor: supervisor@crm.com / admin123',
        '| Cajero: cajero@crm.com / admin123',
        '',
        '## Primer Inicio de Sesión',
        '- Abra el navegador e ingrese la URL del sistema',
        '- Ingrese su correo electrónico y contraseña',
        '- Haga clic en "Iniciar Sesión"',
        '- Será redirigido al Dashboard principal',
        '',
        'IMPORTANTE: Cambie su contraseña después del primer inicio de sesión.',
      ]);
      
      // Sección 3: Roles y Permisos
      addContentSection('3. ROLES Y PERMISOS', [
        'El sistema tiene 4 roles principales con diferentes niveles de acceso.',
        '',
        '## Administrador',
        '- Acceso completo a todos los módulos',
        '- Gestión de usuarios y sucursales',
        '- Configuración del sistema',
        '- Anulación de facturas',
        '- Reportes administrativos',
        '',
        '## Supervisor',
        '- Acceso a ventas y reportes',
        '- Supervisión de caja',
        '- Gestión de inventario',
        '- Cuentas por cobrar',
        '- NO puede anular facturas',
        '',
        '## Cajero',
        '- Punto de Venta (POS)',
        '- Apertura y cierre de caja',
        '- Ventas rápidas',
        '- Consulta de precios',
        '- NO puede ver costos',
      ], secondaryColor);
      
      // Sección 4: Dashboard
      addContentSection('4. DASHBOARD', [
        'El Dashboard es la pantalla principal que muestra el estado actual del negocio en tiempo real.',
        '',
        '## KPIs Principales',
        '- Ventas del Día: Total vendido hoy',
        '- Ventas del Mes: Acumulado mensual',
        '- Cuentas por Cobrar: Total pendiente',
        '- Stock Bajo: Productos con stock crítico',
        '',
        '## Alertas Importantes',
        '- CRÍTICAS (Rojo): Facturas vencidas, stock agotado, caja no cuadrada',
        '- ADVERTENCIAS (Amarillo): Tareas atrasadas, cotizaciones pendientes',
        '',
        '## Acciones Rápidas',
        'Desde el Dashboard puede crear facturas rápidas, abrir caja, ver deudores e inventario.',
      ], accentColor);
      
      // Sección 5: Flujo Completo
      addContentSection('5. FLUJO COMPLETO DEL SISTEMA', [
        '## Venta al Contado (Flujo más común)',
        '',
        'Paso 1 - Apertura de Caja:',
        'Caja > Abrir Caja > Ingrese monto inicial > Confirmar',
        '',
        'Paso 2 - Crear Venta:',
        'Ventas > Punto de Venta (POS) > Agregar productos > Seleccionar cliente > Cobrar',
        '',
        'Paso 3 - Cobro:',
        'Ingrese monto recibido > Seleccione método de pago > Imprimir ticket',
        '',
        'Paso 4 - Cierre de Caja:',
        'Caja > Cerrar Caja > Cuente efectivo > Ingrese arqueo > Confirmar',
        '',
        '## Venta a Crédito',
        'Antes de vender a crédito, verifique el límite de crédito del cliente en su ficha. El sistema controla automáticamente los límites.',
      ]);
      
      // Sección 6: Ventas
      addContentSection('6. MÓDULO DE VENTAS', [
        '## Punto de Venta (POS)',
        'El POS está diseñado para ventas rápidas y atención al cliente.',
        '',
        'Teclas Rápidas:',
        '- F2: Buscar producto',
        '- F4: Buscar cliente',
        '- F9: Cobrar',
        '- ESC: Cancelar',
        '',
        '## Tipos de Factura',
        '- Fiscal (NCF): Ventas formales con DGII',
        '- No Fiscal: Ventas internas',
        '- Proforma: Cotizaciones formales',
        '',
        '## Anulación de Facturas',
        '⚠️ IMPORTANTE: Solo Administradores pueden anular.',
        'La anulación restaura stock, elimina cuentas por cobrar y genera auditoría.',
      ]);
      
      // Sección 7: Caja
      addContentSection('7. MÓDULO DE CAJA', [
        '## Conceptos Importantes',
        'Una caja es un período de operación diaria con:',
        '- Apertura: Monto inicial en efectivo',
        '- Movimientos: Ingresos y egresos',
        '- Cierre: Arqueo físico vs. sistema',
        '',
        '## Estados de Caja',
        '- Cerrada: No se pueden hacer ventas',
        '- Abierta: Operando normalmente',
        '- Por Cerrar: Pendiente de arqueo',
        '',
        '## Diferencias de Caja',
        '- Diferencia = 0: Cuadre perfecto',
        '- Diferencia > 0: Sobrante (registrar)',
        '- Diferencia < 0: Faltante (registrar)',
      ]);
      
      // Sección 8: Cuentas por Cobrar
      addContentSection('8. MÓDULO DE CUENTAS POR COBRAR', [
        '## Conceptos Clave',
        '- Límite de Crédito: Monto máximo que puede adeudar un cliente',
        '- Balance: Total que debe el cliente actualmente',
        '- Mora: Días de retraso en el pago',
        '',
        '## Registrar Pago',
        '1. Cuentas por Cobrar > Registrar Pago',
        '2. Seleccionar Cliente y Factura(s)',
        '3. Ingrese Monto (puede ser parcial)',
        '4. Seleccione Método de Pago',
        '5. Ingrese Referencia si aplica',
        '6. Confirmar',
        '',
        'El sistema permite pagos parciales. La factura queda con "Balance Pendiente" hasta saldar completamente.',
      ]);
      
      // Sección 9: Inventario
      addContentSection('9. MÓDULO DE INVENTARIO', [
        '## Control de Stock',
        'El sistema actualiza automáticamente el stock con cada venta y anulación.',
        '',
        '## Tipos de Producto',
        '- Físico: Producto tangible con control de stock',
        '- Servicio: Servicios prestados (sin stock)',
        '- Combo: Grupo de productos',
        '',
        '## Ajustes de Inventario',
        'Use ajustes cuando:',
        '- Conteo físico difiere del sistema',
        '- Productos dañados o vencidos',
        '- Robo o pérdida',
        '- Corrección de errores',
        '',
        '⚠️ Los ajustes quedan registrados en auditoría.',
      ]);
      
      // Sección 10: Clientes
      addContentSection('10. MÓDULO DE CLIENTES', [
        '## Ficha del Cliente',
        'Contiene toda la información relevante:',
        '- Datos generales y contacto',
        '- Límite de crédito y balance actual',
        '- Historial de compras y pagos',
        '- Estadísticas de compra',
        '',
        '## Tipos de Cliente',
        '- Contado: Sin crédito, pago inmediato',
        '- Crédito: Con límite aprobado',
        '- VIP: Alto volumen de compras',
      ]);
      
      // Sección 11: CRM
      addContentSection('11. MÓDULO CRM', [
        '## Tareas y Seguimiento',
        'Cree tareas para organizar su trabajo comercial:',
        '',
        'Tipos de Tarea:',
        '- Llamada',
        '- Visita',
        '- Reunión',
        '- Seguimiento',
        '- Cobro',
        '',
        '## Estados de Tarea',
        '- Pendiente: Por realizar',
        '- En Progreso: Iniciada',
        '- Completada: Finalizada',
        '- Cancelada: No se realizará',
        '',
        'El sistema muestra alertas para tareas vencidas y recordatorios programados.',
      ]);
      
      // Sección 12: Configuración
      addContentSection('12. CONFIGURACIÓN DEL SISTEMA', [
        '## NCF (Números de Comprobante Fiscal)',
        '',
        'Tipos de NCF:',
        '- 01 - Crédito Fiscal: Para empresas con crédito',
        '- 02 - Consumo: Ventas al detalle',
        '- 03 - Gastos Menores: Hasta RD$ 50,000',
        '- 04 - Regímenes Especiales',
        '- 15 - Proveedores Informales',
        '',
        '⚠️ Las secuencias NCF deben coincidir con las autorizadas por DGII.',
        '',
        '## Sucursales',
        'Para empresas con múltiples ubicaciones, configure sucursales independientes con sus propias cajas y reportes.',
      ]);
      
      // Sección 13: Solución de Problemas
      addContentSection('13. SOLUCIÓN DE PROBLEMAS', [
        '## No Puede Iniciar Sesión',
        '- "Usuario no existe": Verifique mayúsculas/minúsculas',
        '- "Contraseña incorrecta": Use recuperación o contacte admin',
        '- "Cuenta inactiva": Contacte al administrador',
        '',
        '## Errores en Ventas',
        '- "No hay caja abierta": Abra caja primero',
        '- "Stock insuficiente": Verifique inventario',
        '- "Cliente requerido": Factura fiscal necesita cliente',
        '- "NCF agotado": Configure nueva secuencia',
        '',
        '## Problemas de Caja',
        '- "Diferencia de caja": Revise conteo físico',
        '- "No puede cerrar caja de otro": Contacte supervisor',
      ]);
      
      // Sección 14: FAQ
      addContentSection('14. PREGUNTAS FRECUENTES', [
        '## ¿Puedo usar el sistema desde mi celular?',
        'Sí, el sistema es responsive y funciona en dispositivos móviles.',
        '',
        '## ¿Se guarda automáticamente?',
        'Sí, todas las operaciones se guardan inmediatamente.',
        '',
        '## ¿Puedo anular una factura de ayer?',
        'Sí, pero solo un Administrador puede hacerlo y se requiere motivo.',
        '',
        '## ¿Debo cerrar caja todos los días?',
        'Sí, es recomendable cerrar caja al finalizar el turno.',
        '',
        '## ¿El stock se actualiza automáticamente?',
        'Sí, cada venta reduce stock y las anulaciones lo restauran.',
        '',
        '## ¿Puedo tener stock negativo?',
        'Por defecto no. El sistema valida stock disponible antes de vender.',
      ]);
      
      // ===== PÁGINA FINAL =====
      currentPage++;
      addPage(currentPage);
      
      // Fondo decorativo
      doc.setFillColor(37, 99, 235);
      doc.rect(0, pageHeight - 60, pageWidth, 60, 'F');
      
      // Círculos decorativos
      doc.setFillColor(59, 130, 246);
      doc.circle(30, pageHeight - 30, 20, 'F');
      doc.setFillColor(124, 58, 237);
      doc.circle(60, pageHeight - 45, 12, 'F');
      
      // Texto de agradecimiento
      doc.setTextColor(textColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('¡Gracias por usar nuestro sistema!', margin, yPosition);
      
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const thanksText = 'Este manual fue generado automáticamente desde el sistema CRM. Para más información o soporte técnico, contacte a su administrador.';
      const splitThanks = doc.splitTextToSize(thanksText, contentWidth);
      doc.text(splitThanks, margin, yPosition);
      
      // Info en el footer azul
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('CRM Sistema de Gestión Empresarial | v1.0.0', margin, pageHeight - 20);
      doc.text('© 2026 Todos los derechos reservados', margin, pageHeight - 12);
      
      // Guardar PDF
      doc.save('Manual-de-Usuario-CRM.pdf');
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render según variante
  if (variant === 'menu') {
    return (
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span>Generando PDF...</span>
          </>
        ) : (
          <>
            <HiBookOpen className="h-4 w-4 text-blue-500" />
            <span>Descargar Manual</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Descargar Manual de Usuario"
      >
        {isGenerating ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        ) : (
          <HiBookOpen className="h-5 w-5" />
        )}
      </button>
    );
  }

  // Botón por defecto (full)
  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Generando PDF...</span>
        </>
      ) : (
        <>
          <HiDownload className="h-4 w-4" />
          <span>Descargar Manual</span>
          <HiCheckCircle className="h-4 w-4 opacity-75" />
        </>
      )}
    </button>
  );
};

export default ManualDownloader;
