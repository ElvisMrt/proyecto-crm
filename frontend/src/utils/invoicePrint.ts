// Utility functions for invoice printing and PDF generation

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

export const printInvoice = (invoice: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generateInvoiceHTML(invoice);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const downloadInvoicePDF = (invoice: any) => {
  const htmlContent = generateInvoiceHTML(invoice);
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
    body {
      font-family: Arial, sans-serif;
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

const generateInvoiceHTML = (invoice: any) => {
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
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button class="button" onclick="window.print()">Imprimir</button>
    <button class="button" onclick="window.close()">Cerrar</button>
  </div>

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
      ${invoice.type === 'FISCAL' ? `
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


