// Utility functions for quote printing and PDF generation
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

const generateQuoteHTML = (quote: any, company: any = null) => {
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
  <title>Cotización ${quote.number}</title>
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
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-OPEN { background-color: #dbeafe; color: #1e40af; }
    .status-ACCEPTED { background-color: #d1fae5; color: #065f46; }
    .status-REJECTED { background-color: #fee2e2; color: #991b1b; }
    .status-CONVERTED { background-color: #e9d5ff; color: #6b21a8; }
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
      <h1>COTIZACIÓN</h1>
      <p>Número: ${quote.number}</p>
      <p>Estado: <span class="status-badge status-${quote.status}">${quote.status === 'OPEN' ? 'Abierta' : quote.status === 'ACCEPTED' ? 'Aceptada' : quote.status === 'REJECTED' ? 'Rechazada' : 'Convertida'}</span></p>
    </div>
    <div class="header-right">
      <h2>${formatCurrency(Number(quote.total))}</h2>
      <p>Fecha: ${formatDate(quote.createdAt)}</p>
      ${quote.validUntil ? `<p>Válida hasta: ${formatDate(quote.validUntil)}</p>` : ''}
    </div>
  </div>

  ${quote.client ? `
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nombre</div>
        <div class="info-value">${quote.client.name}</div>
      </div>
      ${quote.client.identification ? `
      <div class="info-item">
        <div class="info-label">Identificación</div>
        <div class="info-value">${quote.client.identification}</div>
      </div>
      ` : ''}
      ${quote.client.email ? `
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${quote.client.email}</div>
      </div>
      ` : ''}
      ${quote.client.phone ? `
      <div class="info-item">
        <div class="info-label">Teléfono</div>
        <div class="info-value">${quote.client.phone}</div>
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
        ${quote.items?.map((item: any) => `
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
        <td class="text-right">${formatCurrency(Number(quote.subtotal) + Number(quote.discount || 0))}</td>
      </tr>
      ${Number(quote.discount || 0) > 0 ? `
      <tr>
        <td>Descuento:</td>
        <td class="text-right">-${formatCurrency(Number(quote.discount))}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Subtotal Neto:</td>
        <td class="text-right">${formatCurrency(Number(quote.subtotal))}</td>
      </tr>
      ${Number(quote.tax || 0) > 0 ? `
      <tr>
        <td>ITBIS (18%):</td>
        <td class="text-right">${formatCurrency(Number(quote.tax))}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Total:</td>
        <td class="text-right">${formatCurrency(Number(quote.total))}</td>
      </tr>
    </table>
  </div>

  ${quote.observations ? `
  <div class="section">
    <div class="section-title">Observaciones</div>
    <p>${quote.observations}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Cotización generada automáticamente por el sistema CRM</p>
    <p>Esta cotización no representa una factura y no tiene validez fiscal</p>
  </div>
</body>
</html>
  `;
};

export const printQuote = async (quote: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const company = await getCompanyData(true); // Force refresh to get latest logo
  console.log('Company data for quote:', { hasLogo: !!company?.logo, companyName: company?.name });
  const htmlContent = generateQuoteHTML(quote, company);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const downloadQuotePDF = async (quote: any) => {
  const company = await getCompanyData(true); // Force refresh to get latest logo
  const htmlContent = generateQuoteHTML(quote, company);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Cotizacion-${quote.number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// WhatsApp function disabled - WhatsApp module removed
// export const sendQuoteWhatsApp = (quote: any) => {
//   const message = `Hola! Te enviamos nuestra cotización:\n\n` +
//     `*Cotización ${quote.number}*\n` +
//     `Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-DO')}\n` +
//     `${quote.validUntil ? `Válida hasta: ${new Date(quote.validUntil).toLocaleDateString('es-DO')}\n` : ''}` +
//     `Total: RD$ ${Number(quote.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n\n` +
//     `Para más detalles, revisa el documento adjunto.`;
//   
//   const encodedMessage = encodeURIComponent(message);
//   const whatsappUrl = `https://wa.me/${quote.client?.phone?.replace(/\D/g, '') || ''}?text=${encodedMessage}`;
//   window.open(whatsappUrl, '_blank');
// };


