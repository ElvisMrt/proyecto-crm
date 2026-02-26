import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiSearch,
  HiOfficeBuilding,
  HiShoppingCart,
  HiCash,
  HiPencil,
  HiTrash,
  HiDocumentText,
  HiCurrencyDollar,
  HiChevronDown,
  HiChevronUp,
  HiDotsVertical,
  HiTruck,
  HiCreditCard,
  HiMail,
  HiPhone,
  HiLocationMarker,
} from 'react-icons/hi';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { MinimalStatCard } from '../components/MinimalStatCard';

interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  isActive: boolean;
  financials: {
    totalPurchased: number;
    totalPaid: number;
    totalBalance: number;
    overdueInvoices: number;
  };
}

interface Purchase {
  id: string;
  code: string;
  purchaseDate: string;
  deliveryDate: string | null;
  total: number;
  status: string;
}

interface Invoice {
  id: string;
  code: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  notes?: string;
  purchaseId?: string | null;
}

export default function SuppliersWithPurchases() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<Invoice[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  
  const [supplierFormData, setSupplierFormData] = useState({
    code: '',
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    subtotal: '',
    notes: '',
    status: 'PENDING',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    supplierId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
    invoiceAllocations: [] as { invoiceId: string; amount: number }[],
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalPurchased: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers');
      const data = response.data?.data || [];
      setSuppliers(data);
      
      const totalPurchased = data.reduce((sum: number, s: Supplier) => sum + (s.financials?.totalPurchased || 0), 0);
      const totalBalance = data.reduce((sum: number, s: Supplier) => sum + (s.financials?.totalBalance || 0), 0);
      
      setStats({
        total: data.length,
        active: data.filter((s: Supplier) => s.isActive).length,
        totalPurchased,
        totalBalance,
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierPurchases = async (supplierId: string) => {
    try {
      setLoadingPurchases(true);
      const response = await api.get(`/purchases?supplierId=${supplierId}`);
      setSupplierPurchases(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      showToast('Error al cargar compras', 'error');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchSupplierInvoices = async (supplierId: string) => {
    try {
      setLoadingInvoices(true);
      const response = await api.get(`/supplier-invoices?supplierId=${supplierId}&status=PENDING,PARTIAL`);
      setSupplierInvoices(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showToast('Error al cargar facturas', 'error');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleExpandSupplier = async (supplierId: string) => {
    if (expandedSupplierId === supplierId) {
      setExpandedSupplierId(null);
      setSupplierPurchases([]);
      setSupplierInvoices([]);
    } else {
      setExpandedSupplierId(supplierId);
      await Promise.all([
        fetchSupplierPurchases(supplierId),
        fetchSupplierInvoices(supplierId)
      ]);
    }
  };

  const handleOpenPaymentModal = async (supplierId: string, supplierName: string) => {
    setSelectedSupplierId(supplierId);
    setSelectedSupplierName(supplierName);
    await fetchSupplierInvoices(supplierId);
    setPaymentFormData({
      supplierId,
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
      invoiceAllocations: [],
    });
    setShowPaymentModal(true);
  };

  const handleInvoiceAllocationChange = (invoiceId: string, amount: number) => {
    const allocations = [...paymentFormData.invoiceAllocations];
    const existingIndex = allocations.findIndex(a => a.invoiceId === invoiceId);
    
    if (amount > 0) {
      if (existingIndex >= 0) {
        allocations[existingIndex].amount = amount;
      } else {
        allocations.push({ invoiceId, amount });
      }
    } else {
      if (existingIndex >= 0) {
        allocations.splice(existingIndex, 1);
      }
    }
    
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    setPaymentFormData({ ...paymentFormData, invoiceAllocations: allocations, amount: totalAllocated });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentFormData.amount <= 0) {
      showToast('El monto del pago debe ser mayor a 0', 'error');
      return;
    }

    if (paymentFormData.invoiceAllocations.length === 0) {
      showToast('Debes seleccionar al menos una factura para aplicar el pago', 'error');
      return;
    }

    const totalAllocated = paymentFormData.invoiceAllocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated !== paymentFormData.amount) {
      showToast('El total asignado debe coincidir con el monto del pago', 'error');
      return;
    }

    try {
      await api.post('/supplier-payments', paymentFormData);
      showToast('Pago registrado exitosamente', 'success');
      setShowPaymentModal(false);
      fetchSuppliers();
      if (expandedSupplierId) {
        await fetchSupplierInvoices(expandedSupplierId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al registrar pago';
      showToast(errorMessage, 'error');
    }
  };

  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      code: '',
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      isActive: true,
    });
    setShowSupplierModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      code: supplier.code,
      name: supplier.name,
      taxId: supplier.taxId,
      email: supplier.email,
      phone: supplier.phone,
      address: (supplier as any).address || '',
      isActive: supplier.isActive,
    });
    setShowSupplierModal(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, supplierFormData);
        showToast('Proveedor actualizado exitosamente', 'success');
      } else {
        await api.post('/suppliers', supplierFormData);
        showToast('Proveedor creado exitosamente', 'success');
      }
      setShowSupplierModal(false);
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al guardar proveedor';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    
    try {
      await api.delete(`/suppliers/${id}`);
      showToast('Proveedor eliminado exitosamente', 'success');
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar proveedor';
      showToast(errorMessage, 'error');
    }
  };

  const handleCreatePurchase = (supplierId: string) => {
    setEditingPurchase(null);
    setPurchaseFormData({
      supplierId,
      purchaseDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      subtotal: '',
      notes: '',
      status: 'PENDING',
    });
    setShowPurchaseModal(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setPurchaseFormData({
      supplierId: purchase.id,
      purchaseDate: purchase.purchaseDate.split('T')[0],
      deliveryDate: purchase.deliveryDate ? purchase.deliveryDate.split('T')[0] : '',
      subtotal: purchase.total.toString(),
      notes: '',
      status: purchase.status,
    });
    setShowPurchaseModal(true);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta compra?')) return;
    
    try {
      await api.delete(`/purchases/${purchaseId}`);
      showToast('Compra eliminada exitosamente', 'success');
      if (expandedSupplierId) {
        await Promise.all([
          fetchSupplierPurchases(expandedSupplierId),
          fetchSupplierInvoices(expandedSupplierId)
        ]);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar compra';
      showToast(errorMessage, 'error');
    }
  };

  const handleGenerateInvoice = async (purchaseId: string, purchaseCode: string) => {
    if (!confirm(`¿Generar factura para la compra ${purchaseCode}?`)) return;
    
    try {
      const response = await api.post(`/purchases/${purchaseId}/generate-invoice`);
      const message = response.data?.message || 'Factura generada exitosamente';
      showToast(message, 'success');
      if (expandedSupplierId) {
        await Promise.all([
          fetchSupplierPurchases(expandedSupplierId),
          fetchSupplierInvoices(expandedSupplierId)
        ]);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al generar factura';
      showToast(errorMessage, 'error');
    }
  };

  const handleChangeStatus = async (purchaseId: string, newStatus: string) => {
    try {
      await api.put(`/purchases/${purchaseId}`, { status: newStatus });
      showToast('Estado actualizado exitosamente', 'success');
      if (expandedSupplierId) {
        await fetchSupplierPurchases(expandedSupplierId);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al actualizar estado';
      showToast(errorMessage, 'error');
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceCode: string) => {
    if (!confirm(`¿Estás seguro de eliminar la factura ${invoiceCode}? Esta acción no se puede deshacer.`)) return;
    
    try {
      await api.delete(`/supplier-invoices/${invoiceId}`);
      showToast('Factura eliminada exitosamente', 'success');
      
      if (expandedSupplierId) {
        await fetchSupplierInvoices(expandedSupplierId);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar factura';
      showToast(errorMessage, 'error');
    }
  };

  const handleExportInvoicePDF = (invoice: Invoice) => {
    // Importar jsPDF dinámicamente
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default();
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Título
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('FACTURA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Código y número de factura
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(invoice.code, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Fechas
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha Emisión: ${formatDate(invoice.invoiceDate)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Fecha Vencimiento: ${formatDate(invoice.dueDate)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Estado: ${invoice.status === 'PENDING' ? 'Pendiente' : invoice.status === 'PAID' ? 'Pagada' : invoice.status}`, margin, yPosition);
      yPosition += 15;
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Detalles financieros
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen Financiero', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const financialData = [
        ['Subtotal:', formatCurrency(invoice.subtotal || 0)],
        ['Impuestos:', formatCurrency(invoice.tax || 0)],
        ['Descuentos:', formatCurrency(invoice.discount || 0)],
        ['Total:', formatCurrency(invoice.total)],
        ['Pagado:', formatCurrency(invoice.paid)],
        ['Saldo Pendiente:', formatCurrency(invoice.balance)]
      ];
      
      financialData.forEach(([label, value]) => {
        doc.text(label, margin, yPosition);
        doc.text(value, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 7;
      });
      
      yPosition += 10;
      
      // Línea separadora
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Notas
      if (invoice.notes) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Notas', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
        splitNotes.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      }
      
      // Pie de página
      yPosition = 280;
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-DO')} a las ${new Date().toLocaleTimeString('es-DO')}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Descargar PDF
      doc.save(`factura_${invoice.code}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast(`PDF de factura ${invoice.code} generado exitosamente`, 'success');
    }).catch((error) => {
      console.error('Error al generar PDF:', error);
      showToast('Error al generar PDF. Asegúrate de tener conexión a internet.', 'error');
    });
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingInvoice) return;
    
    try {
      const invoiceData = {
        invoiceDate: editingInvoice.invoiceDate,
        dueDate: editingInvoice.dueDate,
        status: editingInvoice.status,
        subtotal: editingInvoice.subtotal || 0,
        tax: editingInvoice.tax || 0,
        discount: editingInvoice.discount || 0,
        total: editingInvoice.total,
        notes: editingInvoice.notes || ''
      };
      
      await api.put(`/supplier-invoices/${editingInvoice.id}`, invoiceData);
      showToast('Factura actualizada exitosamente', 'success');
      
      setShowInvoiceModal(false);
      setEditingInvoice(null);
      
      if (expandedSupplierId) {
        await fetchSupplierInvoices(expandedSupplierId);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al actualizar factura';
      showToast(errorMessage, 'error');
    }
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = Number(purchaseFormData.subtotal) || 0;
      
      if (editingPurchase) {
        await api.put(`/purchases/${editingPurchase.id}`, { ...purchaseFormData, total });
        showToast('Compra actualizada exitosamente', 'success');
      } else {
        const response = await api.post('/purchases', { ...purchaseFormData, total });
        const message = response.data?.message || 'Compra y factura creadas exitosamente';
        showToast(message, 'success');
      }
      
      setShowPurchaseModal(false);
      setEditingPurchase(null);
      
      if (expandedSupplierId) {
        await Promise.all([
          fetchSupplierPurchases(expandedSupplierId),
          fetchSupplierInvoices(expandedSupplierId)
        ]);
      }
      fetchSuppliers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || (editingPurchase ? 'Error al actualizar compra' : 'Error al crear compra');
      showToast(errorMessage, 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExportSuppliers = () => {
    // Crear contenido CSV
    const headers = ['Código', 'Nombre', 'RNC/Cédula', 'Email', 'Teléfono', 'Dirección', 'Estado', 'Total Comprado', 'Saldo Pendiente'];
    const csvContent = [
      headers.join(','),
      ...filteredSuppliers.map(supplier => [
        `"${supplier.code}"`,
        `"${supplier.name}"`,
        `"${supplier.taxId}"`,
        `"${supplier.email}"`,
        `"${supplier.phone}"`,
        `"${(supplier as any).address || ''}"`,
        `"${supplier.isActive ? 'Activo' : 'Inactivo'}"`,
        `"${formatCurrency(supplier.financials.totalPurchased)}"`,
        `"${formatCurrency(supplier.financials.totalBalance)}"`
      ].join(','))
    ].join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Lista de proveedores exportada exitosamente', 'success');
  };

  const handleExportSuppliersPDF = () => {
    // Importar jsPDF dinámicamente
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default();
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Título
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Lista de Proveedores', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Fecha de generación
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total: ${filteredSuppliers.length} proveedores`, margin, yPosition);
      yPosition += 15;
      
      // Tabla de proveedores
      const headers = ['Código', 'Nombre', 'RNC/Cédula', 'Email', 'Teléfono', 'Estado', 'Total', 'Saldo'];
      const colWidths = [25, 50, 30, 40, 25, 20, 25, 25];
      
      // Encabezados de tabla
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      let xPos = margin;
      headers.forEach((header, index) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 8;
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      // Datos de proveedores
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      filteredSuppliers.forEach((supplier, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
          
          // Repetir encabezados en nueva página
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          xPos = margin;
          headers.forEach((header, index) => {
            doc.text(header, xPos, yPosition);
            xPos += colWidths[index];
          });
          yPosition += 8;
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
          
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
        }
        
        // Fila de datos
        xPos = margin;
        const rowData = [
          supplier.code,
          supplier.name.length > 25 ? supplier.name.substring(0, 25) + '...' : supplier.name,
          supplier.taxId || '',
          supplier.email?.length > 20 ? (supplier.email.substring(0, 20) + '...') : (supplier.email || ''),
          supplier.phone || '',
          supplier.isActive ? 'Activo' : 'Inactivo',
          formatCurrency(supplier.financials.totalPurchased),
          formatCurrency(supplier.financials.totalBalance)
        ];
        
        rowData.forEach((data, index) => {
          doc.text(data, xPos, yPosition);
          xPos += colWidths[index];
        });
        
        yPosition += 6;
        
        // Línea separadora entre filas
        if (index < filteredSuppliers.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 3;
        }
      });
      
      // Pie de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
      }
      
      // Descargar PDF
      doc.save(`proveedores_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF de proveedores generado exitosamente', 'success');
    }).catch((error) => {
      console.error('Error al generar PDF:', error);
      showToast('Error al generar PDF. Asegúrate de tener conexión a internet.', 'error');
    });
  };

  const handleExportPurchases = (supplierId: string, supplierName: string) => {
    const purchases = supplierPurchases;
    
    if (purchases.length === 0) {
      showToast('No hay compras para exportar', 'warning');
      return;
    }

    // Crear contenido CSV
    const headers = ['Código Compra', 'Fecha Compra', 'Fecha Entrega', 'Total', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...purchases.map(purchase => [
        `"${purchase.code}"`,
        `"${formatDate(purchase.purchaseDate)}"`,
        `"${purchase.deliveryDate ? formatDate(purchase.deliveryDate) : 'N/A'}"`,
        `"${formatCurrency(purchase.total)}"`,
        `"${purchase.status}"`
      ].join(','))
    ].join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Compras de ${supplierName} exportadas exitosamente`, 'success');
  };

  const handleExportPurchasesPDF = (supplierId: string, supplierName: string) => {
    const purchases = supplierPurchases;
    
    if (purchases.length === 0) {
      showToast('No hay compras para exportar', 'warning');
      return;
    }

    // Importar jsPDF dinámicamente
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default();
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`Compras de ${supplierName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Fecha de generación
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total: ${purchases.length} compras`, margin, yPosition);
      yPosition += 15;
      
      // Tabla de compras
      const headers = ['Código', 'Fecha Compra', 'Fecha Entrega', 'Total', 'Estado'];
      const colWidths = [30, 35, 35, 30, 25];
      
      // Encabezados de tabla
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      let xPos = margin;
      headers.forEach((header, index) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 8;
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      // Datos de compras
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      purchases.forEach((purchase, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
          
          // Repetir encabezados en nueva página
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          xPos = margin;
          headers.forEach((header, index) => {
            doc.text(header, xPos, yPosition);
            xPos += colWidths[index];
          });
          yPosition += 8;
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
          
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
        }
        
        // Fila de datos
        xPos = margin;
        const rowData = [
          purchase.code,
          formatDate(purchase.purchaseDate),
          purchase.deliveryDate ? formatDate(purchase.deliveryDate) : 'N/A',
          formatCurrency(purchase.total),
          purchase.status
        ];
        
        rowData.forEach((data, index) => {
          doc.text(data, xPos, yPosition);
          xPos += colWidths[index];
        });
        
        yPosition += 6;
        
        // Línea separadora entre filas
        if (index < purchases.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 3;
        }
      });
      
      // Pie de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
      }
      
      // Descargar PDF
      doc.save(`compras_${supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast(`PDF de compras de ${supplierName} generado exitosamente`, 'success');
    }).catch((error) => {
      console.error('Error al generar PDF:', error);
      showToast('Error al generar PDF. Asegúrate de tener conexión a internet.', 'error');
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      RECEIVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Recibida' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header Minimalista */}
      <nav className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleCreateSupplier}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <HiPlus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
        <button
          onClick={handleExportSuppliers}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          <HiDocumentText className="w-5 h-5" />
          Exportar CSV
        </button>
        <button
          onClick={handleExportSuppliersPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <HiDocumentText className="w-5 h-5" />
          Exportar PDF
        </button>
      </nav>

      {/* Suppliers List */}
      <div className="space-y-2">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all">
            {/* Supplier Header - Minimalista */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Nombre y saldo - Compacto */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{supplier.name}</h3>
                      {!supplier.isActive && (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{supplier.phone}</p>
                  </div>
                  
                  {/* Saldo destacado solo si hay deuda */}
                  {supplier.financials.totalBalance > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Saldo</p>
                      <p className="text-base font-bold text-red-600">
                        {formatCurrency(supplier.financials.totalBalance)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones visibles */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedSupplierId(expandedSupplierId === supplier.id ? null : supplier.id)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title={expandedSupplierId === supplier.id ? "Colapsar" : "Expandir"}
                  >
                    {expandedSupplierId === supplier.id ? (
                      <HiChevronUp className="w-5 h-5" />
                    ) : (
                      <HiChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleCreatePurchase(supplier.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Nueva Compra"
                  >
                    <HiShoppingCart className="w-5 h-5" />
                  </button>

                  {supplier.financials.totalBalance > 0 && (
                    <button
                      onClick={() => handleOpenPaymentModal(supplier.id, supplier.name)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Pagar"
                    >
                      <HiCash className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEditSupplier(supplier)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <HiPencil className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Section */}
            {expandedSupplierId === supplier.id && (
              <div className="border-t border-gray-200 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Facturas Pendientes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <HiDocumentText className="w-4 h-4" />
                      Facturas Pendientes
                    </h4>
                    
                    {loadingInvoices ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : supplierInvoices.length > 0 ? (
                      <div className="space-y-2">
                        {supplierInvoices.map((invoice) => (
                          <div key={invoice.id} className="bg-white rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{invoice.code}</span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {invoice.status === 'PENDING' ? 'Pendiente' : 'Parcial'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Emisión: {formatDate(invoice.invoiceDate)} • Vence: {formatDate(invoice.dueDate)}
                                </p>
                                <div className="mt-2 flex items-center gap-3 text-xs">
                                  <span className="text-gray-600">Total: {formatCurrency(invoice.total)}</span>
                                  <span className="text-gray-600">Pagado: {formatCurrency(invoice.paid)}</span>
                                  <span className="font-semibold text-red-600">Saldo: {formatCurrency(invoice.balance)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar factura"
                                >
                                  <HiPencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleExportInvoicePDF(invoice)}
                                  className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="Descargar PDF"
                                >
                                  <HiDocumentText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id, invoice.code)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar factura"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => handleOpenPaymentModal(supplier.id, supplier.name)}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <HiCash className="w-4 h-4" />
                          Registrar Pago
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
                        <HiDocumentText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No hay facturas pendientes</p>
                      </div>
                    )}
                  </div>

                  {/* Compras */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <HiShoppingCart className="w-4 h-4" />
                        Compras del Proveedor
                      </h4>
                      <button
                        onClick={() => handleExportPurchases(supplier.id, supplier.name)}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                        title="Exportar compras a CSV"
                      >
                        <HiDocumentText className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportPurchasesPDF(supplier.id, supplier.name)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        title="Exportar compras a PDF"
                      >
                        <HiDocumentText className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                    
                    {loadingPurchases ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : supplierPurchases.length > 0 ? (
                      <div className="space-y-2">
                        {supplierPurchases.slice(0, 5).map((purchase) => (
                          <div key={purchase.id} className="bg-white rounded-lg p-3 hover:shadow-sm transition-shadow border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{purchase.code}</span>
                                  <select
                                    value={purchase.status}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleChangeStatus(purchase.id, e.target.value);
                                    }}
                                    className={`px-2 py-0.5 text-xs font-medium rounded border-0 cursor-pointer ${
                                      purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="RECEIVED">Recibida</option>
                                    <option value="CANCELLED">Cancelada</option>
                                  </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(purchase.purchaseDate)}
                                  {purchase.deliveryDate && ` • Entrega: ${formatDate(purchase.deliveryDate)}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 mr-2">{formatCurrency(purchase.total)}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPurchase(purchase);
                                  }}
                                  className="px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar compra"
                                >
                                  <HiPencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePurchase(purchase.id);
                                  }}
                                  className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar compra"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
                        <HiShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No hay compras registradas</p>
                        <button
                          onClick={() => handleCreatePurchase(supplier.id)}
                          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Crear primera compra
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <HiOfficeBuilding className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search ? 'No se encontraron resultados' : 'No hay proveedores registrados'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer proveedor'}
            </p>
            {!search && (
              <button
                onClick={handleCreateSupplier}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <HiPlus className="w-5 h-5" />
                Crear Proveedor
              </button>
            )}
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
            </div>
            <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.code}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RNC/Cédula *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.taxId}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  rows={2}
                  placeholder="Calle, número, sector, ciudad..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={supplierFormData.isActive}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Proveedor activo</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSupplier ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Registrar Pago - {selectedSupplierName}</h2>
            </div>
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago *</label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
                  <select
                    required
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CHECK">Cheque</option>
                    <option value="CARD">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  type="text"
                  value={paymentFormData.reference}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                  placeholder="Número de cheque, transferencia, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Selecciona las facturas a pagar</h3>
                  <span className="text-xs text-gray-500">Puedes pagar completo o hacer abonos parciales</span>
                </div>
                {loadingInvoices ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : supplierInvoices.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {supplierInvoices.map((invoice) => {
                      const allocation = paymentFormData.invoiceAllocations.find(a => a.invoiceId === invoice.id);
                      const allocatedAmount = allocation?.amount || 0;
                      const isSelected = allocatedAmount > 0;
                      
                      return (
                        <div key={invoice.id} className={`border-2 rounded-lg p-4 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                          {/* Header de la factura */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 text-base">{invoice.code}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {invoice.status === 'PENDING' ? 'Pendiente' : 'Parcial'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Vence: {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                          </div>

                          {/* Información financiera */}
                          <div className="grid grid-cols-3 gap-3 mb-3 p-2 bg-gray-50 rounded">
                            <div>
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pagado</p>
                              <p className="text-sm font-semibold text-green-600">{formatCurrency(invoice.paid)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Saldo</p>
                              <p className="text-sm font-bold text-red-600">{formatCurrency(invoice.balance)}</p>
                            </div>
                          </div>

                          {/* Input de pago */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">¿Cuánto deseas pagar?</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={invoice.balance}
                                  value={allocatedAmount || ''}
                                  onChange={(e) => handleInvoiceAllocationChange(invoice.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className={`w-full pl-7 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium ${
                                    isSelected ? 'border-blue-500 bg-white' : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleInvoiceAllocationChange(invoice.id, invoice.balance)}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
                              >
                                💰 Pagar Todo
                              </button>
                            </div>
                            {allocatedAmount > 0 && allocatedAmount < invoice.balance && (
                              <p className="text-xs text-blue-600 font-medium">
                                ✓ Abono de {formatCurrency(allocatedAmount)} • Quedará {formatCurrency(invoice.balance - allocatedAmount)}
                              </p>
                            )}
                            {allocatedAmount === invoice.balance && allocatedAmount > 0 && (
                              <p className="text-xs text-green-600 font-medium">
                                ✓ Pago completo • Esta factura quedará saldada
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <HiDocumentText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium">No hay facturas pendientes</p>
                    <p className="text-xs mt-1">Este proveedor no tiene deudas pendientes</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total del Pago:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(paymentFormData.amount)}
                  </span>
                </div>
                {paymentFormData.invoiceAllocations.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Aplicado a {paymentFormData.invoiceAllocations.length} factura(s)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={paymentFormData.amount <= 0 || paymentFormData.invoiceAllocations.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editingPurchase ? 'Editar Compra' : 'Nueva Compra'}</h2>
            </div>
            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra *</label>
                  <input
                    type="date"
                    required
                    value={purchaseFormData.purchaseDate}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={purchaseFormData.deliveryDate}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={purchaseFormData.subtotal}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, subtotal: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  required
                  value={purchaseFormData.status}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="RECEIVED">Recibida</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPurchase ? 'Actualizar Compra' : 'Crear Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
              </h2>
            </div>
            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={editingInvoice?.code || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión *</label>
                  <input
                    type="date"
                    required
                    value={editingInvoice?.invoiceDate?.split('T')[0] || ''}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, invoiceDate: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    required
                    value={editingInvoice?.dueDate?.split('T')[0] || ''}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, dueDate: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    required
                    value={editingInvoice?.status || 'PENDING'}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, status: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="PARTIAL">Parcial</option>
                    <option value="PAID">Pagada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editingInvoice?.subtotal || ''}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, subtotal: parseFloat(e.target.value) || 0} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impuestos</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice?.tax || ''}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, tax: parseFloat(e.target.value) || 0} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuentos</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice?.discount || ''}
                    onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, discount: parseFloat(e.target.value) || 0} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={editingInvoice?.total || ''}
                  onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, total: parseFloat(e.target.value) || 0} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={editingInvoice?.notes || ''}
                  onChange={(e) => setEditingInvoice(editingInvoice ? {...editingInvoice, notes: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales sobre la factura..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingInvoice ? 'Actualizar Factura' : 'Crear Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
