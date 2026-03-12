import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const LOAN_DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'loan-documents');

if (!fs.existsSync(LOAN_DOCUMENTS_DIR)) {
  fs.mkdirSync(LOAN_DOCUMENTS_DIR, { recursive: true });
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(value);

const formatDateTime = (value: Date | string) =>
  new Date(value).toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const wrapText = (value: string, maxChars: number) => {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
};

const pdfText = (x: number, y: number, text: string, size = 12, font = 'F1', rgb = '0 0 0') =>
  `BT /${font} ${size} Tf ${rgb} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;

const pdfFilledRect = (x: number, y: number, width: number, height: number, rgb = '0 0 0') =>
  `${rgb} rg ${x} ${y} ${width} ${height} re f`;

const buildBadge = (x: number, y: number, size: number, label: string) => {
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return [
    pdfFilledRect(x, y, size, size, '0.047 0.325 0.612'),
    pdfText(x + 10, y + (size / 2) - 6, initials || 'CRM', 20, 'F2', '1 1 1'),
  ];
};

const buildPdf = (commands: string[]) => {
  const pageHeight = 792;
  const stream = commands.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
};

const writePdf = (fileName: string, commands: string[]) => {
  const filePath = path.join(LOAN_DOCUMENTS_DIR, fileName);
  fs.writeFileSync(filePath, buildPdf(commands));
  return {
    fileName,
    filePath,
    fileUrl: `/uploads/loan-documents/${fileName}`,
  };
};

const buildCompanyBlock = (company: {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  rnc?: string | null;
}) => {
  const lines = [
    company.name || 'Mi Empresa',
    ...(company.rnc ? [`RNC: ${company.rnc}`] : []),
    ...(company.phone ? [`Tel: ${company.phone}`] : []),
    ...(company.email ? [`Email: ${company.email}`] : []),
    ...(company.address ? wrapText(company.address, 40) : []),
  ];

  return lines;
};

export const generateLoanPaymentReceiptPdf = (data: {
  company: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    rnc?: string | null;
    logo?: string | null;
  };
  loanNumber: string;
  clientName: string;
  branchName?: string | null;
  receiptNumber: string;
  paymentDate: Date | string;
  method: string;
  reference?: string | null;
  previousBalance: number;
  paymentAmount: number;
  newBalance: number;
  principalAmount: number;
  interestAmount: number;
  lateFeeAmount: number;
  feeAmount: number;
  installmentNo: number;
  userName: string;
}) => {
  const safeReceipt = data.receiptNumber.replace(/[^A-Za-z0-9_-]/g, '_');
  const fileName = `loan-payment-${safeReceipt}.pdf`;
  const companyLines = buildCompanyBlock(data.company);
  const commands = [
    pdfFilledRect(0, 712, 612, 80, '0.047 0.325 0.612'),
    ...buildBadge(42, 728, 42, data.company.name),
    pdfText(100, 752, data.company.name || 'Mi Empresa', 20, 'F2', '1 1 1'),
    pdfText(100, 732, 'Comprobante de pago de prestamo', 11, 'F1', '0.92 0.96 1'),
    pdfText(420, 752, `Recibo ${data.receiptNumber}`, 11, 'F2', '1 1 1'),
    pdfText(420, 734, formatDateTime(data.paymentDate), 10, 'F1', '0.92 0.96 1'),
    pdfText(42, 688, 'Datos de la empresa', 11, 'F2', '0.11 0.17 0.25'),
  ];

  companyLines.forEach((line, index) => {
    commands.push(pdfText(42, 668 - (index * 14), line, index === 0 ? 12 : 10, index === 0 ? 'F2' : 'F1', '0.2 0.24 0.31'));
  });

  commands.push(
    pdfFilledRect(340, 620, 230, 70, '0.965 0.976 1'),
    pdfText(356, 670, 'Cliente / Operacion', 11, 'F2', '0.11 0.17 0.25'),
    pdfText(356, 650, data.clientName, 12, 'F2', '0.2 0.24 0.31'),
    pdfText(356, 634, `Prestamo: ${data.loanNumber}`, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(356, 618, `Sucursal: ${data.branchName || 'Principal'}`, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(42, 590, 'Aplicacion del pago', 11, 'F2', '0.11 0.17 0.25'),
    pdfFilledRect(42, 548, 528, 30, '0.949 0.953 0.965'),
    pdfText(54, 559, `Cuota #${data.installmentNo}`, 10, 'F2', '0.2 0.24 0.31'),
    pdfText(140, 559, `Metodo: ${data.method}`, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(270, 559, `Referencia: ${data.reference || 'N/A'}`, 10, 'F1', '0.2 0.24 0.31'),
  );

  const rows = [
    ['Saldo anterior', formatCurrency(data.previousBalance)],
    ['Monto pagado', formatCurrency(data.paymentAmount)],
    ['Capital aplicado', formatCurrency(data.principalAmount)],
    ['Interes aplicado', formatCurrency(data.interestAmount)],
    ['Mora aplicada', formatCurrency(data.lateFeeAmount)],
    ['Cargos aplicados', formatCurrency(data.feeAmount)],
    ['Saldo actual', formatCurrency(data.newBalance)],
  ];

  rows.forEach((row, index) => {
    const y = 520 - (index * 28);
    commands.push(
      pdfText(54, y, row[0], 10, index === rows.length - 1 ? 'F2' : 'F1', '0.2 0.24 0.31'),
      pdfText(430, y, row[1], 10, index === rows.length - 1 ? 'F2' : 'F1', '0.047 0.325 0.612')
    );
  });

  commands.push(
    pdfFilledRect(42, 290, 528, 1, '0.85 0.87 0.9'),
    pdfText(42, 268, 'Procesado por', 10, 'F2', '0.11 0.17 0.25'),
    pdfText(42, 252, data.userName, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(42, 220, 'Este comprobante fue generado automaticamente por el CRM.', 9, 'F1', '0.45 0.49 0.55')
  );

  return writePdf(fileName, commands);
};

export const generateLoanDisbursementReceiptPdf = (data: {
  company: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    rnc?: string | null;
    logo?: string | null;
  };
  loanNumber: string;
  clientName: string;
  branchName?: string | null;
  disbursementDate: Date | string;
  method: string;
  reference?: string | null;
  amount: number;
  userName: string;
}) => {
  const timestamp = Date.now();
  const fileName = `loan-disbursement-${data.loanNumber.replace(/[^A-Za-z0-9_-]/g, '_')}-${timestamp}.pdf`;
  const companyLines = buildCompanyBlock(data.company);
  const commands = [
    pdfFilledRect(0, 712, 612, 80, '0.061 0.475 0.333'),
    ...buildBadge(42, 728, 42, data.company.name),
    pdfText(100, 752, data.company.name || 'Mi Empresa', 20, 'F2', '1 1 1'),
    pdfText(100, 732, 'Comprobante de desembolso', 11, 'F1', '0.92 1 0.96'),
    pdfText(420, 752, data.loanNumber, 11, 'F2', '1 1 1'),
    pdfText(420, 734, formatDateTime(data.disbursementDate), 10, 'F1', '0.92 1 0.96'),
    pdfText(42, 688, 'Datos de la empresa', 11, 'F2', '0.11 0.17 0.25'),
  ];

  companyLines.forEach((line, index) => {
    commands.push(pdfText(42, 668 - (index * 14), line, index === 0 ? 12 : 10, index === 0 ? 'F2' : 'F1', '0.2 0.24 0.31'));
  });

  commands.push(
    pdfFilledRect(340, 620, 230, 70, '0.93 0.98 0.95'),
    pdfText(356, 670, 'Cliente / Operacion', 11, 'F2', '0.11 0.17 0.25'),
    pdfText(356, 650, data.clientName, 12, 'F2', '0.2 0.24 0.31'),
    pdfText(356, 634, `Prestamo: ${data.loanNumber}`, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(356, 618, `Sucursal: ${data.branchName || 'Principal'}`, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(42, 590, 'Detalle del desembolso', 11, 'F2', '0.11 0.17 0.25'),
  );

  const rows = [
    ['Metodo', data.method],
    ['Referencia', data.reference || 'N/A'],
    ['Monto desembolsado', formatCurrency(data.amount)],
  ];

  rows.forEach((row, index) => {
    const y = 540 - (index * 34);
    commands.push(
      pdfFilledRect(42, y - 10, 528, 24, index % 2 === 0 ? '0.965 0.976 1' : '0.949 0.953 0.965'),
      pdfText(54, y, row[0], 10, 'F2', '0.2 0.24 0.31'),
      pdfText(390, y, row[1], 10, 'F1', '0.047 0.325 0.612')
    );
  });

  commands.push(
    pdfFilledRect(42, 390, 528, 1, '0.85 0.87 0.9'),
    pdfText(42, 366, 'Procesado por', 10, 'F2', '0.11 0.17 0.25'),
    pdfText(42, 350, data.userName, 10, 'F1', '0.2 0.24 0.31'),
    pdfText(42, 318, 'Documento de respaldo del desembolso realizado.', 9, 'F1', '0.45 0.49 0.55')
  );

  return writePdf(fileName, commands);
};
