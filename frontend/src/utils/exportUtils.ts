// Utility functions for exporting reports to Excel and PDF

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency helper
const formatCurrency = (amount: number | null | undefined): string => {
  if (!amount) return 'RD$ 0';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Export data to Excel
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Reporte'
) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export data to PDF using jsPDF
 */
export const exportToPDF = (
  data: any[],
  columns: Array<{ header: string; dataKey: string; width?: number }>,
  filename: string,
  title: string = 'Reporte',
  summary?: Record<string, any>
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, 14, 30);

  let startY = 40;

  // Add summary if provided
  if (summary) {
    doc.setFontSize(12);
    doc.text('Resumen', 14, startY);
    startY += 10;
    doc.setFontSize(10);
    Object.entries(summary).forEach(([key, value]) => {
      const formattedValue = typeof value === 'number'
        ? new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2,
          }).format(value)
        : String(value);
      doc.text(`${key}: ${formattedValue}`, 14, startY);
      startY += 7;
    });
    startY += 5;
  }

  // Prepare data for autoTable
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.dataKey];
      if (typeof value === 'number') {
        return col.header.toLowerCase().includes('total') ||
          col.header.toLowerCase().includes('monto') ||
          col.header.toLowerCase().includes('precio') ||
          col.header.toLowerCase().includes('cantidad')
          ? new Intl.NumberFormat('es-DO', {
              style: 'currency',
              currency: 'DOP',
              minimumFractionDigits: 2,
            }).format(value)
          : value.toLocaleString('es-DO');
      }
      if (value instanceof Date) {
        return new Date(value).toLocaleDateString('es-DO');
      }
      return String(value || '');
    })
  );

  const headers = columns.map((col) => col.header);

  // Add table using autoTable
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Format data for export (flatten nested objects)
 */
export const formatDataForExport = (data: any[]): any[] => {
  return data.map((item) => {
    const flat: any = {};
    Object.keys(item).forEach((key) => {
      const value = item[key];
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        // Flatten nested objects
        Object.keys(value).forEach((nestedKey) => {
          flat[`${key}_${nestedKey}`] = value[nestedKey];
        });
      } else {
        flat[key] = value;
      }
    });
    return flat;
  });
};

/**
 * Export Account Status to PDF
 */
export const exportAccountStatusToPDF = (
  client: { name: string; identification: string; email?: string; phone?: string; address?: string },
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
      status: string;
    }>;
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = margin;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Estado de Cuenta', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Client Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Cliente', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${client.name}`, margin, yPos);
  yPos += 6;
  doc.text(`Identificación: ${client.identification}`, margin, yPos);
  yPos += 6;
  if (client.email) {
    doc.text(`Email: ${client.email}`, margin, yPos);
    yPos += 6;
  }
  if (client.phone) {
    doc.text(`Teléfono: ${client.phone}`, margin, yPos);
    yPos += 6;
  }
  if (client.address) {
    doc.text(`Dirección: ${client.address}`, margin, yPos);
    yPos += 6;
  }
  yPos += 5;

  // Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total por Cobrar: ${formatCurrency(accountStatus.summary.totalReceivable)}`, margin, yPos);
  yPos += 6;
  doc.text(`Total Vencido: ${formatCurrency(accountStatus.summary.totalOverdue)}`, margin, yPos);
  yPos += 6;
  doc.text(`Total Pagado: ${formatCurrency(accountStatus.summary.totalPaid)}`, margin, yPos);
  yPos += 6;
  doc.text(`Número de Facturas: ${accountStatus.summary.invoiceCount}`, margin, yPos);
  yPos += 10;

  // Invoices Table
  if (accountStatus.invoices && accountStatus.invoices.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Facturas', margin, yPos);
    yPos += 8;

    // Prepare table data
    const tableData = accountStatus.invoices.map((invoice) => [
      invoice.number || '-',
      invoice.ncf || '-',
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      formatCurrency(invoice.total),
      formatCurrency(invoice.paid),
      formatCurrency(invoice.balance),
      invoice.daysOverdue > 0 ? `${invoice.daysOverdue} días` : '-',
      invoice.status === 'PAID' ? 'Pagada' : invoice.daysOverdue > 0 ? 'Vencida' : 'Pendiente',
    ]);

    autoTable(doc, {
      head: [['Factura', 'NCF', 'Fecha Emisión', 'Fecha Vencimiento', 'Total', 'Pagado', 'Saldo', 'Días Vencido', 'Estado']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      },
      margin: { left: margin, right: margin },
    });
  } else {
    doc.setFontSize(10);
    doc.text('No hay facturas registradas', margin, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `Estado_Cuenta_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * Export clients list to Excel
 */
export const exportClientsToExcel = (clients: any[]) => {
  const data = clients.map((client) => ({
    'Nombre / Razón Social': client.name,
    'Documento': client.identification,
    'Tipo': client.creditLimit && client.creditLimit > 0 ? 'Crédito' : 'Contado',
    'Límite de Crédito': client.creditLimit ? formatCurrency(client.creditLimit) : '-',
    'Días de Crédito': client.creditDays || 30,
    'Teléfono': client.phone || '-',
    'Email': client.email || '-',
    'Dirección': client.address || '-',
    'Estado': client.isActive ? 'Activo' : 'Inactivo',
    'Facturas': client.invoiceCount || 0,
    'Pagos': client.paymentCount || 0,
    'Fecha de Registro': new Date(client.createdAt).toLocaleDateString('es-DO'),
  }));

  exportToExcel(data, `Listado_Clientes_${new Date().toISOString().split('T')[0]}`, 'Clientes');
};

/**
 * Export clients list to PDF
 */
export const exportClientsToPDF = (clients: any[]) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.text('Listado de Clientes', margin, yPos);
  yPos += 10;

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, margin, yPos);
  yPos += 10;

  // Summary
  const activeCount = clients.filter((c) => c.isActive).length;
  const inactiveCount = clients.length - activeCount;
  const creditCount = clients.filter((c) => c.creditLimit && c.creditLimit > 0).length;
  const cashCount = clients.length - creditCount;

  doc.setFontSize(10);
  doc.text(`Total de Clientes: ${clients.length}`, margin, yPos);
  doc.text(`Activos: ${activeCount} | Inactivos: ${inactiveCount}`, margin + 60, yPos);
  doc.text(`Crédito: ${creditCount} | Contado: ${cashCount}`, margin + 120, yPos);
  yPos += 15;

  // Table data
  const tableData = clients.map((client) => [
    client.name,
    client.identification,
    client.creditLimit && client.creditLimit > 0 ? 'Crédito' : 'Contado',
    client.creditLimit ? formatCurrency(client.creditLimit) : '-',
    client.phone || '-',
    client.email || '-',
    client.isActive ? 'Activo' : 'Inactivo',
    client.invoiceCount || 0,
  ]);

  autoTable(doc, {
    head: [['Nombre', 'Documento', 'Tipo', 'Límite Crédito', 'Teléfono', 'Email', 'Estado', 'Facturas']],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `Listado_Clientes_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * Export tasks list to Excel
 */
export const exportTasksToExcel = (tasks: any[]) => {
  const data = tasks.map((task) => ({
    'Título': task.title,
    'Descripción': task.description || '-',
    'Cliente': task.client?.name || '-',
    'Estado': task.status === 'COMPLETED' ? 'Completada' : task.isOverdue ? 'Vencida' : 'Pendiente',
    'Prioridad': task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja',
    'Fecha Límite': task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-DO') : '-',
    'Asignado a': task.user?.name || '-',
    'Días Vencidos': task.daysOverdue || 0,
    'Fecha de Creación': new Date(task.createdAt).toLocaleDateString('es-DO'),
  }));

  exportToExcel(data, `Listado_Tareas_${new Date().toISOString().split('T')[0]}`, 'Tareas');
};

/**
 * Export tasks list to PDF
 */
export const exportTasksToPDF = (tasks: any[]) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.text('Listado de Tareas', margin, yPos);
  yPos += 10;

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, margin, yPos);
  yPos += 10;

  // Summary
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter((t) => t.isOverdue).length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'HIGH').length;

  doc.setFontSize(10);
  doc.text(`Total de Tareas: ${tasks.length}`, margin, yPos);
  doc.text(`Pendientes: ${pendingCount} | Completadas: ${completedCount}`, margin + 60, yPos);
  doc.text(`Vencidas: ${overdueCount} | Alta Prioridad: ${highPriorityCount}`, margin + 120, yPos);
  yPos += 15;

  // Table data
  const tableData = tasks.map((task) => [
    task.title.substring(0, 30),
    task.client?.name || '-',
    task.status === 'COMPLETED' ? 'Completada' : task.isOverdue ? 'Vencida' : 'Pendiente',
    task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja',
    task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-DO') : '-',
    task.user?.name || '-',
    task.daysOverdue || 0,
  ]);

  autoTable(doc, {
    head: [['Título', 'Cliente', 'Estado', 'Prioridad', 'Fecha Límite', 'Asignado a', 'Días Vencidos']],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 35 },
      6: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `Listado_Tareas_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

