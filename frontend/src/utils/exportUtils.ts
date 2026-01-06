// Utility functions for exporting reports to Excel and PDF

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

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

  // Add table
  (doc as any).autoTable({
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

