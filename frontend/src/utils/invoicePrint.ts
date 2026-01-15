// Utility functions for invoice printing and PDF generation
import { settingsApi } from '../services/api';

let cachedCompany: any = null;

const getCompanyData = async (forceRefresh = false) => {
  if (cachedCompany && !forceRefresh) return cachedCompany;
  try {
    const company = await settingsApi.getCompany();
    cachedCompany = company;
    return company;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CREDIT: 'Crédito',
    MIXED: 'Mixto',
  };
  return labels[method] || method;
};

export const printInvoice = async (invoice: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const company = await getCompanyData(true); // Force refresh to get latest logo
  console.log('Company data for invoice:', { hasLogo: !!company?.logo, companyName: company?.name });
  const htmlContent = generateInvoiceHTML(invoice, company);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const downloadInvoicePDF = async (invoice: any) => {
  const company = await getCompanyData(true); // Force refresh to get latest logo
  const htmlContent = generateInvoiceHTML(invoice, company);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Factura-${invoice.number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Thermal ticket printer function
const generateThermalTicketHTML = (invoice: any, company: any = null) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${invoice.number}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
      @page { 
        size: 80mm auto; 
        margin: 0;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10mm 5mm;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .ticket-header {
      text-align: center;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .ticket-header h1 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .ticket-header p {
      font-size: 10px;
      margin: 2px 0;
    }
    .ticket-info {
      margin-bottom: 8px;
      font-size: 11px;
    }
    .ticket-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .ticket-info-label {
      font-weight: bold;
    }
    .ticket-items {
      padding: 8px 0;
      margin: 8px 0;
    }
    .ticket-item {
      margin-bottom: 6px;
      font-size: 11px;
    }
    .ticket-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .ticket-item-name {
      font-weight: bold;
      flex: 1;
    }
    .ticket-item-price {
      text-align: right;
    }
    .ticket-item-details {
      font-size: 10px;
      color: #666;
      margin-left: 4px;
    }
    .ticket-totals {
      margin-top: 8px;
      font-size: 11px;
    }
    .ticket-total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .ticket-total-row.final {
      padding-top: 4px;
      margin-top: 4px;
      font-weight: bold;
      font-size: 13px;
    }
    .ticket-footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      font-size: 10px;
    }
    .button {
      background-color: #2563eb;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
      font-size: 12px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 10px;">
    <button class="button" onclick="window.print()">Imprimir Ticket</button>
    <button class="button" onclick="window.close()">Cerrar</button>
  </div>

  <div class="ticket-header">
    ${company?.logo ? `<img src="${company.logo}" alt="Logo" style="max-width: 50mm; max-height: 20mm; margin-bottom: 4px;" onerror="this.style.display='none';" />` : ''}
    <h1>${company?.name || 'Mi Empresa'}</h1>
    ${company?.rnc ? `<p>RNC: ${company.rnc}</p>` : ''}
    ${company?.address ? `<p>${company.address}</p>` : ''}
    ${company?.phone ? `<p>Tel: ${company.phone}</p>` : ''}
    ${company?.email ? `<p>${company.email}</p>` : ''}
  </div>

  <div class="ticket-info">
    <div class="ticket-info-row">
      <span class="ticket-info-label">FACTURA:</span>
      <span>${invoice.number}</span>
    </div>
    ${invoice.ncf ? `
    <div class="ticket-info-row">
      <span class="ticket-info-label">NCF:</span>
      <span>${invoice.ncf}</span>
    </div>
    ` : ''}
    <div class="ticket-info-row">
      <span class="ticket-info-label">FECHA:</span>
      <span>${formatDate(invoice.issueDate)}</span>
    </div>
    ${invoice.client ? `
    <div class="ticket-info-row">
      <span class="ticket-info-label">CLIENTE:</span>
      <span>${invoice.client.name}</span>
    </div>
    ${invoice.client.identification ? `
    <div class="ticket-info-row">
      <span class="ticket-info-label">RNC/CED:</span>
      <span>${invoice.client.identification}</span>
    </div>
    ` : ''}
    ` : ''}
    <div class="ticket-info-row">
      <span class="ticket-info-label">METODO PAGO:</span>
      <span>${getPaymentMethodLabel(invoice.paymentMethod)}</span>
    </div>
  </div>

  <div class="ticket-divider">━━━━━━━━━━━━━━━━━━━━</div>

  <div class="ticket-items">
    ${invoice.items?.map((item: any) => `
      <div class="ticket-item">
        <div class="ticket-item-header">
          <span class="ticket-item-name">${item.product?.name || item.description}</span>
          <span class="ticket-item-price">${formatCurrency(Number(item.subtotal))}</span>
        </div>
        <div class="ticket-item-details">
          ${Number(item.quantity)} x ${formatCurrency(Number(item.price))}
          ${Number(item.discount) > 0 ? ` | Desc: ${formatCurrency(Number(item.discount))}` : ''}
        </div>
      </div>
    `).join('') || ''}
  </div>

  <div class="ticket-totals">
    <div class="ticket-total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(Number(invoice.subtotal) + Number(invoice.discount || 0))}</span>
    </div>
    ${Number(invoice.discount || 0) > 0 ? `
    <div class="ticket-total-row">
      <span>Descuento:</span>
      <span>-${formatCurrency(Number(invoice.discount))}</span>
    </div>
    ` : ''}
    <div class="ticket-total-row">
      <span>Subtotal Neto:</span>
      <span>${formatCurrency(Number(invoice.subtotal))}</span>
    </div>
    ${Number(invoice.tax || 0) > 0 ? `
    <div class="ticket-total-row">
      <span>ITBIS (18%):</span>
      <span>${formatCurrency(Number(invoice.tax))}</span>
    </div>
    ` : ''}
    <div class="ticket-total-row final">
      <span>TOTAL:</span>
      <span>${formatCurrency(Number(invoice.total))}</span>
    </div>
    ${invoice.balance !== undefined && Number(invoice.balance) > 0 ? `
    <div class="ticket-total-row">
      <span>Balance Pendiente:</span>
      <span>${formatCurrency(Number(invoice.balance))}</span>
    </div>
    ` : ''}
  </div>

  <div class="ticket-footer">
    <p>Gracias por su compra!</p>
    <p>${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${invoice.observations ? `<p style="margin-top: 8px; font-size: 9px;">${invoice.observations}</p>` : ''}
  </div>
</body>
</html>
  `;
};

export const printThermalTicket = async (invoice: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const company = await getCompanyData(true);
  const htmlContent = generateThermalTicketHTML(invoice, company);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const printReceipt = (payment: any, invoice: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generateReceiptHTML(payment, invoice);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const generateReceiptHTML = (payment: any, invoice: any) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recibo de Pago - ${payment.id}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 14px;
      margin-top: 3px;
    }
    .total-box {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .total-line.final {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      background-color: #2563eb;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px 5px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button class="button" onclick="window.print()">Imprimir</button>
    <button class="button" onclick="window.close()">Cerrar</button>
  </div>

  <div class="header">
    <h1>RECIBO DE PAGO</h1>
    <p>Número: REC-${payment.id.substring(0, 8).toUpperCase()}</p>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Fecha de Pago</div>
        <div class="info-value">${formatDate(payment.paymentDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Método de Pago</div>
        <div class="info-value">${getPaymentMethodLabel(payment.method)}</div>
      </div>
      ${payment.reference ? `
      <div class="info-item">
        <div class="info-label">Referencia</div>
        <div class="info-value">${payment.reference}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Registrado por</div>
        <div class="info-value">${payment.user?.name || 'N/A'}</div>
      </div>
    </div>
  </div>

  ${invoice ? `
  <div class="section">
    <div class="section-title">Factura Relacionada</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Número de Factura</div>
        <div class="info-value">${invoice.number}</div>
      </div>
      ${invoice.ncf ? `
      <div class="info-item">
        <div class="info-label">NCF</div>
        <div class="info-value">${invoice.ncf}</div>
      </div>
      ` : ''}
      ${invoice.client ? `
      <div class="info-item">
        <div class="info-label">Cliente</div>
        <div class="info-value">${invoice.client.name}</div>
      </div>
      ${invoice.client.identification ? `
      <div class="info-item">
        <div class="info-label">Identificación</div>
        <div class="info-value">${invoice.client.identification}</div>
      </div>
      ` : ''}
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="total-box">
    <div class="total-line">
      <span>Monto Pagado:</span>
      <span>${formatCurrency(Number(payment.amount))}</span>
    </div>
    ${invoice && invoice.balance !== undefined ? `
    <div class="total-line">
      <span>Balance Anterior:</span>
      <span>${formatCurrency(Number(invoice.balance) + Number(payment.amount))}</span>
    </div>
    <div class="total-line">
      <span>Balance Actual:</span>
      <span>${formatCurrency(Number(invoice.balance))}</span>
    </div>
    ` : ''}
  </div>

  ${payment.observations ? `
  <div class="section">
    <div class="section-title">Observaciones</div>
    <p>${payment.observations}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Este es un recibo generado automáticamente por el sistema CRM</p>
    <p>Fecha de generación: ${formatDate(new Date().toISOString())}</p>
  </div>
</body>
</html>
  `;
};

const generateInvoiceHTML = (invoice: any, company: any = null) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.number}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      @page { margin: 1cm; }
    }
    * {
      box-sizing: border-box;
    }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 30px;
      color: #1f2937;
      background: #fff;
      line-height: 1.6;
    }
    .company-header {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 3px solid #2563eb;
    }
    .company-logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      border-radius: 8px;
      background: #fff;
      padding: 8px;
      flex-shrink: 0;
    }
    .company-info {
      flex: 1;
    }
    .company-info h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 700;
      color: #1e40af;
      letter-spacing: -0.5px;
    }
    .company-info p {
      margin: 3px 0;
      color: #6b7280;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border-left: 4px solid #2563eb;
    }
    .header-left h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -1px;
    }
    .header-left p {
      margin: 4px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .header-right {
      text-align: right;
    }
    .header-right h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: -0.5px;
    }
    .header-right p {
      margin: 4px 0;
      color: #6b7280;
      font-size: 13px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 16px;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      background: #fff;
    }
    thead {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      color: #fff;
    }
    th {
      text-align: left;
      padding: 12px 14px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th.text-right {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #e5e7eb;
      transition: background 0.2s;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    td {
      padding: 12px 14px;
      font-size: 13px;
      color: #374151;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-table tr:last-child td {
      border-top: 3px solid #1e40af;
      border-bottom: none;
      padding-top: 12px;
      font-weight: 700;
      font-size: 18px;
      color: #1e40af;
      background: #eff6ff;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .button {
      background-color: #2563eb;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px 5px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button class="button" onclick="window.print()">Imprimir</button>
    <button class="button" onclick="window.close()">Cerrar</button>
  </div>

  ${company ? `
  <div class="company-header">
    ${company.logo && company.logo.trim() ? `
      <img 
        src="${company.logo}" 
        alt="${company.name || 'Logo'}" 
        class="company-logo" 
        style="width: 100px; height: 100px; max-width: 100px; max-height: 100px; object-fit: contain; border-radius: 8px; background: #fff; padding: 8px; flex-shrink: 0; display: block;" 
        onerror="console.error('Error loading logo'); this.style.display='none';" 
        onload="console.log('Logo loaded successfully');"
      />
    ` : ''}
    <div class="company-info">
      <h2>${company.name || 'Mi Empresa'}</h2>
      ${company.rnc ? `<p><strong>RNC:</strong> ${company.rnc}</p>` : ''}
      ${company.address ? `<p>${company.address}</p>` : ''}
      ${company.phone ? `<p><strong>Teléfono:</strong> ${company.phone}</p>` : ''}
      ${company.email ? `<p><strong>Email:</strong> ${company.email}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <div class="header">
    <div class="header-left">
      <h1>FACTURA</h1>
      <p>Número: ${invoice.number}</p>
      ${invoice.ncf ? `<p>NCF: ${invoice.ncf}</p>` : ''}
    </div>
    <div class="header-right">
      <h2>${formatCurrency(Number(invoice.total))}</h2>
      <p>Fecha: ${formatDate(invoice.issueDate)}</p>
    </div>
  </div>

  ${invoice.client ? `
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nombre</div>
        <div class="info-value">${invoice.client.name}</div>
      </div>
      ${invoice.client.identification ? `
      <div class="info-item">
        <div class="info-label">Identificación</div>
        <div class="info-value">${invoice.client.identification}</div>
      </div>
      ` : ''}
      ${invoice.client.email ? `
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${invoice.client.email}</div>
      </div>
      ` : ''}
      ${invoice.client.phone ? `
      <div class="info-item">
        <div class="info-label">Teléfono</div>
        <div class="info-value">${invoice.client.phone}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Descuento</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items?.map((item: any) => `
          <tr>
            <td>${item.product?.name || item.description}</td>
            <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
            <td class="text-right">${formatCurrency(Number(item.price))}</td>
            <td class="text-right">${formatCurrency(Number(item.discount))}</td>
            <td class="text-right">${formatCurrency(Number(item.subtotal))}</td>
          </tr>
        `).join('') || ''}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${formatCurrency(Number(invoice.subtotal) + Number(invoice.discount || 0))}</td>
      </tr>
      ${Number(invoice.discount || 0) > 0 ? `
      <tr>
        <td>Descuento:</td>
        <td class="text-right">-${formatCurrency(Number(invoice.discount))}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Subtotal Neto:</td>
        <td class="text-right">${formatCurrency(Number(invoice.subtotal))}</td>
      </tr>
      ${Number(invoice.tax || 0) > 0 ? `
      <tr>
        <td>ITBIS (18%):</td>
        <td class="text-right">${formatCurrency(Number(invoice.tax))}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Total:</td>
        <td class="text-right">${formatCurrency(Number(invoice.total))}</td>
      </tr>
      ${invoice.balance !== undefined && Number(invoice.balance) > 0 ? `
      <tr>
        <td>Balance Pendiente:</td>
        <td class="text-right">${formatCurrency(Number(invoice.balance))}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  ${invoice.observations ? `
  <div class="section">
    <div class="section-title">Observaciones</div>
    <p>${invoice.observations}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Factura generada automáticamente por el sistema CRM</p>
    <p>Método de Pago: ${getPaymentMethodLabel(invoice.paymentMethod)}</p>
  </div>
</body>
</html>
  `;
};


