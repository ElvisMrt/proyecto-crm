// Utility functions for credit note printing and PDF generation

const generateCreditNoteHTML = (creditNote: any) => {
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
  <title>Nota de Crédito ${creditNote.number}</title>
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
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      margin: 0;
      font-size: 28px;
      color: #dc2626;
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
      color: #dc2626;
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
      background-color: #dc2626;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px 5px;
    }
    .button:hover {
      background-color: #b91c1c;
    }
    .reason-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin-bottom: 20px;
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
      <h1>NOTA DE CRÉDITO</h1>
      <p>Número: ${creditNote.number}</p>
      ${creditNote.ncf ? `<p>NCF: ${creditNote.ncf}</p>` : ''}
    </div>
    <div class="header-right">
      <h2>${formatCurrency(Number(creditNote.total))}</h2>
      <p>Fecha: ${formatDate(creditNote.issueDate)}</p>
    </div>
  </div>

  ${creditNote.invoice ? `
  <div class="section">
    <div class="section-title">Factura Relacionada</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Número de Factura</div>
        <div class="info-value">${creditNote.invoice.number}</div>
      </div>
      ${creditNote.invoice.ncf ? `
      <div class="info-item">
        <div class="info-label">NCF</div>
        <div class="info-value">${creditNote.invoice.ncf}</div>
      </div>
      ` : ''}
      ${creditNote.invoice.client ? `
      <div class="info-item">
        <div class="info-label">Cliente</div>
        <div class="info-value">${creditNote.invoice.client.name}</div>
      </div>
      ${creditNote.invoice.client.identification ? `
      <div class="info-item">
        <div class="info-label">Identificación</div>
        <div class="info-value">${creditNote.invoice.client.identification}</div>
      </div>
      ` : ''}
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="reason-box">
    <div class="section-title">Motivo de la Nota de Crédito</div>
    <p>${creditNote.reason}</p>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${creditNote.items?.map((item: any) => `
          <tr>
            <td>${item.product?.name || item.description}</td>
            <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
            <td class="text-right">${formatCurrency(Number(item.price))}</td>
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
        <td class="text-right">${formatCurrency(Number(creditNote.subtotal))}</td>
      </tr>
      ${Number(creditNote.tax || 0) > 0 ? `
      <tr>
        <td>ITBIS (18%):</td>
        <td class="text-right">${formatCurrency(Number(creditNote.tax))}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Total:</td>
        <td class="text-right">${formatCurrency(Number(creditNote.total))}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>Nota de Crédito generada automáticamente por el sistema CRM</p>
    <p>Este documento anula total o parcialmente la factura asociada</p>
  </div>
</body>
</html>
  `;
};

export const printCreditNote = (creditNote: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generateCreditNoteHTML(creditNote);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const downloadCreditNotePDF = (creditNote: any) => {
  const htmlContent = generateCreditNoteHTML(creditNote);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `NotaCredito-${creditNote.number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// WhatsApp function disabled - WhatsApp module removed
// export const sendCreditNoteWhatsApp = (creditNote: any) => {
//   const invoice = creditNote.invoice;
//   const client = invoice?.client;
//   
//   if (!client?.phone) {
//     return;
//   }
//
//   const message = `Hola! Te enviamos nuestra nota de crédito:\n\n` +
//     `*Nota de Crédito ${creditNote.number}*\n` +
//     `Factura: ${invoice?.number || 'N/A'}\n` +
//     `Fecha: ${new Date(creditNote.issueDate).toLocaleDateString('es-DO')}\n` +
//     `Motivo: ${creditNote.reason}\n` +
//     `Total: RD$ ${Number(creditNote.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n\n` +
//     `Para más detalles, revisa el documento adjunto.`;
//   
//   const encodedMessage = encodeURIComponent(message);
//   const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
//   window.open(whatsappUrl, '_blank');
// };


