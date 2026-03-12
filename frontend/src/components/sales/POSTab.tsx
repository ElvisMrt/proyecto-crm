import { useState, useEffect, useMemo, useCallback } from 'react';
import { salesApi, inventoryApi, clientsApi, cashApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { HiSearch } from 'react-icons/hi';
import { printInvoice, printThermalTicket } from '../../utils/invoicePrint';
import { useNFCSearch } from '../../hooks/useNFC';
// WhatsApp module disabled
// import { sendInvoiceWhatsApp } from '../../utils/whatsappSender';

interface Product {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  stock?: number;
  minStock?: number;
  imageUrl?: string;
  controlsStock?: boolean;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

const POSTab = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Check if user can edit prices (Administrator or Supervisor)
  const canEditPrice = user?.role === 'ADMINISTRATOR' || user?.role === 'SUPERVISOR';
  // Check if user can delete sales (Administrator only)
  const canDeleteSale = user?.role === 'ADMINISTRATOR';
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [includeTax, setIncludeTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashStatus, setCashStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [saleResult, setSaleResult] = useState<any>(null); // Store sale result for success screen

  // NFC Support for product search
  const { isSupported: nfcSupported, isReading: nfcReading } = useNFCSearch(
    (code) => {
      setSearch(code);
      // Auto-add product if exact match
      const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());
      if (product) {
        addToCart(product);
        showToast(`Producto agregado: ${product.name}`, 'success');
      }
    },
    true
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProducts();
    fetchClients();
    checkCashStatus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Nueva venta (limpiar carrito)
      if (e.key === 'F1') {
        e.preventDefault();
        setCart([]);
        setSelectedClient('');
        setIncludeTax(false);
        showToast('Carrito limpiado', 'info');
      }
      // F2: Focus en búsqueda
      else if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar producto"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Enter: Si hay productos en carrito, procesar venta. Si no, agregar producto seleccionado
      else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }
      // Esc: Limpiar búsqueda o cancelar
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSearch('');
        const searchInput = document.querySelector('input[placeholder*="Buscar producto"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ isActive: true, limit: 200 });
      // Fetch stock information for each product
      const productsWithStock = await Promise.all(
        (response.data || []).map(async (product: any) => {
          // Solo procesar productos que controlan stock
          if (!product.controlsStock) {
            return {
              ...product,
              stock: 0,
              minStock: 0,
              controlsStock: false,
            };
          }
          
          try {
            const stockResponse = await inventoryApi.getStock({ 
              productId: product.id,
              limit: 1 
            });
            const stocks = stockResponse.data || [];
            const totalStock = stocks.reduce((sum: number, stock: any) => 
              sum + Math.max(0, Number(stock.quantity || 0)), 0 // No mostrar stock negativo
            );
            return {
              ...product,
              stock: Math.max(0, totalStock), // Asegurar que no sea negativo
              minStock: product.minStock || 0,
            };
          } catch (error) {
            return {
              ...product,
              stock: 0,
              minStock: product.minStock || 0,
            };
          }
        })
      );
      setProducts(productsWithStock);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 100, isActive: true });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const checkCashStatus = async () => {
    try {
      const response = await cashApi.getCurrentCash();
      setCashStatus(response);
    } catch (error) {
      console.error('Error checking cash status:', error);
      setCashStatus(null);
    }
  };

  const addToCart = useCallback((product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price - item.discount,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          price: Number(product.salePrice),
          discount: 0,
          subtotal: Number(product.salePrice),
        },
      ]);
    }
  }, [cart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId));
      return;
    }
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.price - item.discount }
          : item
      )
    );
  }, [cart]);

  const updateDiscount = useCallback((productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, discount: Math.max(0, discount), subtotal: item.quantity * item.price - Math.max(0, discount) }
          : item
      )
    );
  }, [cart]);

  
  const calculateTotal = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return Math.max(0, subtotal - generalDiscount);
  }, [cart, generalDiscount]);

  const calculateTotalDiscount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  }, [cart]);

  const calculateTax = useCallback(() => {
    if (!includeTax) return 0;
    // ITBIS se calcula sobre el subtotal después del descuento general
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const subtotalAfterDiscount = Math.max(0, subtotal - generalDiscount);
    return subtotalAfterDiscount * 0.18;
  }, [includeTax, cart, generalDiscount]);

  const calculateFinalTotal = useCallback(() => {
    return calculateTotal() + calculateTax();
  }, [calculateTotal, calculateTax]);

  // Memoize calculated values for performance
  const totalDiscount = useMemo(() => calculateTotalDiscount(), [calculateTotalDiscount]);
  const tax = useMemo(() => calculateTax(), [calculateTax]);
  const finalTotal = useMemo(() => calculateFinalTotal(), [calculateFinalTotal]);

  // Update amountReceived when total changes (for cash payments)
  useEffect(() => {
    if (paymentMethod === 'CASH') {
      // Solo actualizar si está en 0 o es menor al total
      if (amountReceived === 0 || amountReceived < finalTotal) {
        setAmountReceived(finalTotal);
      }
    } else {
      // Limpiar amountReceived si no es efectivo
      setAmountReceived(0);
    }
  }, [finalTotal, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && !cashStatus) {
      showToast('La caja debe estar abierta para realizar ventas en efectivo', 'error');
      return;
    }

    // Validar amountReceived para pagos en efectivo
    if (paymentMethod === 'CASH') {
      // Asegurar que amountReceived sea al menos igual al total
      const validAmountReceived = amountReceived >= finalTotal ? amountReceived : finalTotal;
      
      if (validAmountReceived < finalTotal) {
        showToast('El monto recibido debe ser mayor o igual al total', 'error');
        return;
      }
    }

    try {
      setLoading(true);

      const requestData: any = {
        type: 'NON_FISCAL', // POS siempre es no fiscal, ITBIS se maneja con includeTax
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          description: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        discount: generalDiscount,
        includeTax: includeTax, // Incluir ITBIS opcional
      };

      // Solo incluir clientId si hay un cliente seleccionado
      if (selectedClient) {
        requestData.clientId = selectedClient;
      }

      // Include amountReceived for cash payments - siempre enviar si es CASH
      if (paymentMethod === 'CASH') {
        const validAmountReceived = amountReceived >= finalTotal ? amountReceived : finalTotal;
        requestData.amountReceived = validAmountReceived;
      }

      const response = await salesApi.createPOSSale(requestData);

      // If response has invoice property, it's the new format with full invoice
      if (response.invoice) {
        setSaleResult(response);
        showToast('Venta realizada exitosamente', 'success');
        
        // Ya no imprimimos automáticamente, el usuario elige el tipo de impresión
      } else {
        // Fallback for old format
        showToast('Venta realizada exitosamente', 'success');
        setCart([]);
        setSelectedClient('');
        setIncludeTax(false);
        setAmountReceived(0);
        checkCashStatus();
      }
    } catch (error: any) {
      console.error('Error creating POS sale:', error);
      showToast(error.response?.data?.error?.message || 'Error al procesar la venta', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Memoize filtered products for performance
  const filteredProducts = useMemo(() => {
    if (!searchDebounced.trim()) {
      // Show most frequently used products first (could be enhanced with actual usage tracking)
      return products.slice(0, 50); // Limit initial display
    }
    const searchLower = searchDebounced.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower)
    );
  }, [products, searchDebounced]);

  const handleNewSale = () => {
    setSaleResult(null);
    setCart([]);
    setSelectedClient('');
    setIncludeTax(false);
    setAmountReceived(0);
    setGeneralDiscount(0);
    setPaymentMethod('CASH');
    checkCashStatus();
  };

  const handleVoidSale = async () => {
    if (!saleResult?.invoice) return;

    // Confirmación antes de anular
    const confirmVoid = window.confirm(
      `¿Estás seguro que quieres anular esta venta?\n\n` +
      `Factura: ${saleResult.invoice.number}\n` +
      `Monto: RD$ ${Number(saleResult.invoice.total).toLocaleString()}\n\n` +
      `Esta acción:\n` +
      `• Generará una nota de crédito\n` +
      `• Devolverá los productos al inventario\n` +
      `• Anulará el NCF correspondiente\n\n` +
      `¿Continuar?`
    );

    if (!confirmVoid) return;

    try {
      setLoading(true);
      
      // Crear nota de crédito para anular la venta
      const creditNoteData = {
        invoiceId: saleResult.invoice.id,
        reason: 'Venta anulada por error',
        items: saleResult.invoice.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          reason: 'Devolución por anulación'
        }))
      };

      await salesApi.createCreditNote(creditNoteData);
      
      showToast('Venta anulada correctamente. Se ha generado una nota de crédito.', 'success');
      
      // Reiniciar para nueva venta
      handleNewSale();
      
    } catch (error: any) {
      console.error('Error voiding sale:', error);
      showToast(error.response?.data?.error?.message || 'Error al anular la venta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!saleResult?.invoice) return;

    // Confirmación de eliminación (solo admin)
    const confirmDelete = window.confirm(
      `⚠️ ADVERTENCIA: Eliminación permanente\n\n` +
      `¿Estás seguro que quieres ELIMINAR permanentemente esta venta?\n\n` +
      `Factura: ${saleResult.invoice.number}\n` +
      `Monto: RD$ ${Number(saleResult.invoice.total).toLocaleString()}\n` +
      `NCF: ${saleResult.invoice.ncf || 'N/A'}\n\n` +
      `Esta acción:\n` +
      `❌ ELIMINARÁ la venta permanentemente\n` +
      `❌ NO genera nota de crédito\n` +
      `❌ NO devuelve inventario automáticamente\n` +
      `❌ NO anula NCF (debe hacerse manualmente)\n` +
      `❌ NO deja registro auditado\n\n` +
      `Esta acción es IRREVERSIBLE y solo para emergencias.\n\n` +
      `¿Continuar con la eliminación?`
    );

    if (!confirmDelete) return;

    // Confirmación adicional
    const finalConfirm = window.confirm(
      `ÚLTIMA ADVERTENCIA:\n\n` +
      `Estás a punto de eliminar permanentemente:\n` +
      `• Factura ${saleResult.invoice.number}\n` +
      `• Monto: RD$ ${Number(saleResult.invoice.total).toLocaleString()}\n\n` +
      `Esta acción no se puede deshacer.\n\n` +
      `Escribe "ELIMINAR" para confirmar:`
    );

    if (!finalConfirm) return;

    try {
      setLoading(true);
      
      // Eliminar la venta directamente (solo admin)
      await salesApi.deleteInvoice(saleResult.invoice.id);
      
      showToast('Venta eliminada permanentemente. Nota: Debe ajustar inventario y NCF manualmente.', 'warning');
      
      // Reiniciar para nueva venta
      handleNewSale();
      
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      showToast(error.response?.data?.error?.message || 'Error al eliminar la venta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (type: 'invoice' | 'thermal') => {
    if (saleResult?.invoice) {
      if (type === 'thermal') {
        printThermalTicket(saleResult.invoice);
      } else {
        printInvoice(saleResult.invoice);
      }
    }
  };

  // WhatsApp function disabled
  // const handleSendWhatsApp = async () => {
  //   if (saleResult?.invoice) {
  //     try {
  //       if (!saleResult.invoice.client?.phone) {
  //         showToast('El cliente no tiene número de teléfono registrado', 'error');
  //         return;
  //       }
  //       await sendInvoiceWhatsApp(saleResult.invoice);
  //       showToast('Factura enviada por WhatsApp', 'success');
  //     } catch (error) {
  //       console.error('Error sending WhatsApp:', error);
  //       showToast('Error al enviar por WhatsApp', 'error');
  //     }
  //   }
  // };

  // Success screen after sale
  if (saleResult?.invoice) {
    const invoice = saleResult.invoice;
    const change = saleResult.change || 0;
    const amountReceived = saleResult.amountReceived || invoice.total;

    return (
      <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#000000] mb-2">¡Venta Realizada Exitosamente!</h2>
          <p className="text-[#1f2937]">Factura: {invoice.number}</p>
          {invoice.ncf && <p className="text-[#1f2937]">NCF: {invoice.ncf}</p>}
        </div>

        <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-medium text-[#1f2937]">Total:</span>
              <span className="font-bold text-[#000000]">
                RD$ {Number(invoice.total).toLocaleString()}
              </span>
            </div>
            {invoice.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-[#1f2937]">Monto Recibido:</span>
                  <span className="font-bold text-[#000000]">
                    RD$ {Number(amountReceived).toLocaleString()}
                  </span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-xl border-t pt-3 mt-3">
                    <span className="font-bold text-[#000000]">Vuelto:</span>
                    <span className="font-bold text-emerald-700">
                      RD$ {change.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handlePrint('invoice')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Factura
          </button>
          <button
            onClick={() => handlePrint('thermal')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Ticket Térmico
          </button>
          {/* WhatsApp button disabled */}
          {/* {invoice.client?.phone && (
            <button
              onClick={handleSendWhatsApp}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Enviar por WhatsApp
            </button>
          )} */}
          <button
            onClick={handleVoidSale}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
            title="Anular esta venta (genera nota de crédito)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Anular Venta
          </button>
          {canDeleteSale && (
            <button
              onClick={handleDeleteSale}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              title="Eliminar venta permanentemente (solo administrador)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Eliminar Venta
            </button>
          )}
          <button
            onClick={handleNewSale}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-200 px-6 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* NFC - Info */}
      <div className="flex gap-2">
        {nfcSupported && (
          <div className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            nfcReading 
              ? 'bg-slate-900 border-slate-900 text-white' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              nfcReading ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'
            }`}></span>
            NFC {nfcReading ? 'Activo' : 'Inactivo'}
          </div>
        )}
      </div>

      {/* Estado de Caja */}
      {paymentMethod === 'CASH' && (
        <div className={`rounded-[24px] border p-5 shadow-sm ${cashStatus ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/80'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-950">
                Estado de Caja: {cashStatus ? 'Abierta' : 'Cerrada'}
              </p>
              {cashStatus && (
                <p className="mt-1 text-xs text-slate-500">
                  Sucursal: {cashStatus.branch?.name || '-'} | 
                  Inicial: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(cashStatus.initialAmount || 0))}
                </p>
              )}
            </div>
            {!cashStatus && (
              <button
                onClick={() => window.location.href = '/cash'}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Abrir Caja
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productos */}
        <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Catálogo</p>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Productos</h2>
            </div>
            <p className="hidden text-xs text-slate-400 md:block">Búsqueda rápida por código o nombre</p>
          </div>
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar producto por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => {
            // Determinar color según disponibilidad - Solo para productos que controlan stock
            const stock = product.stock || 0;
            const minStock = product.minStock || 0;
            let borderColor = 'border-slate-200';
            let bgColor = 'bg-white';
            let availabilityColor = '';
            let dotColor = 'bg-slate-300';
            
            if (product.controlsStock) {
              if (stock === 0) {
                borderColor = 'border-slate-300';
                bgColor = 'bg-slate-100';
                availabilityColor = 'text-slate-500';
                dotColor = 'bg-slate-400';
              } else if (stock <= minStock) {
                borderColor = 'border-amber-200';
                bgColor = 'bg-amber-50';
                availabilityColor = 'text-amber-700';
                dotColor = 'bg-amber-400';
              } else {
                borderColor = 'border-emerald-200';
                bgColor = 'bg-emerald-50/60';
                availabilityColor = 'text-emerald-700';
                dotColor = 'bg-emerald-400';
              }
            }
            
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`relative flex flex-col rounded-[22px] border ${borderColor} ${bgColor} p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {/* Indicador de disponibilidad - Solo para productos que controlan stock */}
                {product.controlsStock && (
                  <div className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${dotColor}`}></div>
                )}
                
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-24 object-cover rounded mb-2 border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="mb-2 flex h-24 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="text-sm font-semibold text-slate-950">{product.code}</div>
                <div className="mt-1 line-clamp-2 text-xs text-slate-500">{product.name}</div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  RD$ {Number(product.salePrice).toLocaleString()}
                </div>
                {/* Indicador de stock - Solo para productos que controlan stock */}
                {product.controlsStock && (
                  <div className={`mt-1 text-xs font-semibold ${availabilityColor}`}>
                    {stock === 0 ? 'Sin stock' : stock <= minStock ? `Stock bajo (${stock})` : `Disponible (${stock})`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        </div>

        {/* Carrito */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Pedido</p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Carrito</h2>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">
            Cliente <span className="text-gray-500 text-xs font-normal">(Opcional)</span>
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
          >
            <option value="">Seleccionar cliente (opcional)</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.identification ? `- ${client.identification}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
              className="w-4 h-4 text-[#1D79C4] border-gray-300 rounded focus:ring-[#1D79C4]"
            />
            <span className="text-xs font-semibold text-[#1f2937]">
              Incluir ITBIS (18%)
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">
            Descuento General
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={generalDiscount || ''}
            onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
            placeholder="0.00"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Método de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              if (e.target.value !== 'CASH') {
                setAmountReceived(0);
              } else {
                setAmountReceived(finalTotal);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
          >
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="MIXED">Mixto</option>
          </select>
        </div>

        {paymentMethod === 'CASH' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">
              Monto Recibido <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={finalTotal}
              step="0.01"
              value={amountReceived || finalTotal}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                setAmountReceived(value >= finalTotal ? value : finalTotal);
              }}
              onFocus={(e) => {
                if (!amountReceived || amountReceived < finalTotal) {
                  e.target.value = finalTotal.toString();
                  setAmountReceived(finalTotal);
                }
                e.target.select(); // Seleccionar todo el texto para facilitar edición
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
              placeholder={finalTotal.toLocaleString()}
              required
            />
            {amountReceived > 0 && amountReceived < finalTotal && (
              <p className="mt-1 text-xs text-rose-700">
                El monto recibido debe ser mayor o igual al total (RD$ {finalTotal.toLocaleString()})
              </p>
            )}
            {amountReceived >= finalTotal && amountReceived > finalTotal && (
              <p className="mt-1 text-xs text-emerald-700">
                Vuelto: RD$ {(amountReceived - finalTotal).toLocaleString()}
              </p>
            )}
            {amountReceived === finalTotal && (
              <p className="text-xs text-gray-500 mt-1">
                Monto exacto, sin vuelto
              </p>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Carrito vacío</p>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="p-2 bg-gray-50 rounded mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1">
                      {item.product.imageUrl ? (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#000000]">{item.product.name}</div>
                        <div className="text-xs text-[#1f2937]">
                          {canEditPrice ? (
                            <span className="text-[#1D79C4]">Precio editable</span>
                          ) : (
                            <>RD$ {item.price.toLocaleString()} c/u</>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.productId, 0)}
                      className="text-lg font-bold text-rose-600 transition hover:text-rose-800"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Cantidad</label>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 text-sm border border-gray-300 rounded text-center"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Descuento</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm font-bold text-[#1D79C4] w-full text-right">
                        RD$ {item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#1f2937]">Subtotal:</span>
            <span className="font-semibold text-[#000000]">RD$ {(cart.reduce((sum, item) => sum + item.subtotal, 0)).toLocaleString()}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-rose-700">
              <span>Descuentos por ítem:</span>
              <span>-RD$ {totalDiscount.toLocaleString()}</span>
            </div>
          )}
          {generalDiscount > 0 && (
            <div className="flex justify-between text-sm text-rose-700">
              <span>Descuento General:</span>
              <span>-RD$ {generalDiscount.toLocaleString()}</span>
            </div>
          )}
          {includeTax && (
            <div className="flex justify-between text-sm">
              <span className="text-[#1f2937]">ITBIS (18%):</span>
              <span className="font-semibold text-[#000000]">RD$ {tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span className="text-[#000000]">Total:</span>
            <span className="text-[#000000]">RD$ {finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={
            loading ||
            cart.length === 0 ||
            (paymentMethod === 'CASH' && !cashStatus) ||
            (paymentMethod === 'CASH' && (!amountReceived || amountReceived < finalTotal))
          }
          className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Procesar Venta'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default POSTab;
