// Utility functions for quote printing and PDF generation

const generateQuoteHTML = (quote: any) => {
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
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      margin: 0;
      font-size: 28px;
    }
    .header-left p {
      margin: 5px 0;
      color: #666;
    }
    .header-right {
      text-align: right;
    }
    .header-right h2 {
      margin: 0;
      font-size: 24px;
      color: #2563eb;
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
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #f5f5f5;
    }
    th {
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #ddd;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table tr:last-child {
      border-top: 2px solid #333;
      font-weight: bold;
      font-size: 18px;
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

export const printQuote = (quote: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generateQuoteHTML(quote);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const downloadQuotePDF = (quote: any) => {
  const htmlContent = generateQuoteHTML(quote);
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

export const sendQuoteWhatsApp = (quote: any) => {
  const message = `Hola! Te enviamos nuestra cotización:\n\n` +
    `*Cotización ${quote.number}*\n` +
    `Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-DO')}\n` +
    `${quote.validUntil ? `Válida hasta: ${new Date(quote.validUntil).toLocaleDateString('es-DO')}\n` : ''}` +
    `Total: RD$ ${Number(quote.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n\n` +
    `Para más detalles, revisa el documento adjunto.`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${quote.client?.phone?.replace(/\D/g, '') || ''}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};


