import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { whatsappApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiPlus, HiPencil, HiTrash, HiChat, HiSearch, HiDocumentDownload, HiXCircle, HiRefresh, HiCheckCircle, HiX } from 'react-icons/hi';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface WhatsAppTemplate {
  id: string;
  name: string;
  type: 'INVOICE' | 'QUOTE' | 'PAYMENT' | 'REMINDER' | 'CUSTOM';
  subject: string | null;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const WhatsAppTab = () => {
  const { showToast, showConfirm } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    type: 'INVOICE' as WhatsAppTemplate['type'],
    subject: '',
    message: '',
  });
  
  // Estado de conexión WhatsApp
  const [instanceStatus, setInstanceStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const fetchingQRRef = useRef(false);
  const fetchingTemplatesRef = useRef(false);
  const fetchingStatusRef = useRef(false);

  // Función helper para obtener etiqueta de tipo (debe estar antes del useMemo)
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INVOICE: 'Factura',
      QUOTE: 'Cotización',
      PAYMENT: 'Pago',
      REMINDER: 'Recordatorio',
      CUSTOM: 'Personalizado',
    };
    return labels[type] || type;
  };

  // Memoizar fetchTemplates para evitar recreaciones
  const fetchTemplates = useCallback(async () => {
    if (fetchingTemplatesRef.current) return; // Prevenir múltiples llamadas
    
    try {
      fetchingTemplatesRef.current = true;
      setLoading(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar templates')), 10000)
      );
      
      const response = await Promise.race([
        whatsappApi.getTemplates(),
        timeoutPromise
      ]) as any;
      
      // Solo actualizar si los datos realmente cambiaron
      setTemplates((prev) => {
        const newTemplates = response.data || [];
        if (prev.length === newTemplates.length && 
            prev.every((t, i) => t.id === newTemplates[i]?.id && 
                               t.updatedAt === newTemplates[i]?.updatedAt)) {
          return prev; // No cambiar si son los mismos
        }
        return newTemplates;
      });
    } catch (error: any) {
      console.error('Error fetching WhatsApp templates:', error);
      if (error.message !== 'Timeout al cargar templates') {
        showToast(error.response?.data?.error?.message || 'Error al cargar los templates', 'error');
      }
    } finally {
      setLoading(false);
      fetchingTemplatesRef.current = false;
    }
  }, []);

  // Memoizar fetchInstanceStatus
  const fetchInstanceStatus = useCallback(async () => {
    if (fetchingStatusRef.current) return; // Prevenir múltiples llamadas
    
    try {
      fetchingStatusRef.current = true;
      setLoadingStatus(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al obtener estado')), 10000)
      );
      
      const status = await Promise.race([
        whatsappApi.getInstanceStatus(),
        timeoutPromise
      ]) as any;
      
      // Solo actualizar si el estado realmente cambió
      setInstanceStatus((prev: any) => {
        if (prev?.connected === status?.connected && 
            prev?.exists === status?.exists && 
            prev?.status === status?.status &&
            prev?.number === status?.number) {
          return prev;
        }
        return status;
      });
    } catch (error: any) {
      console.error('Error fetching instance status:', error);
      setInstanceStatus((prev: any) => {
        if (prev?.error === error.message) {
          return prev;
        }
        return {
          exists: false,
          connected: false,
          error: error.message || 'Error al obtener estado'
        };
      });
    } finally {
      setLoadingStatus(false);
      fetchingStatusRef.current = false;
    }
  }, []);

  // Cargar datos solo una vez al montar
  useEffect(() => {
    fetchTemplates();
    fetchInstanceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar - las funciones son estables gracias a useCallback

  // Usar useMemo para filtrar templates directamente, sin estado adicional
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) {
      return templates;
    }
    const searchLower = searchTerm.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchLower) ||
        getTypeLabel(template.type).toLowerCase().includes(searchLower) ||
        (template.subject && template.subject.toLowerCase().includes(searchLower)) ||
        template.message.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, templates]);

  // Resetear página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // fetchInstanceStatus ya está definido arriba con useCallback

  const fetchQRCode = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (loadingQR || fetchingQRRef.current || qrCode) {
      return;
    }
    
    try {
      fetchingQRRef.current = true;
      setLoadingQR(true);
      
      // Timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al obtener QR')), 10000)
      );
      
      const response = await Promise.race([
        whatsappApi.getQRCode(),
        timeoutPromise
      ]) as any;
      
      console.log('Get QR code response:', response);
      if (response.qrCode) {
        // Limpiar el QR code si ya tiene el prefijo data: duplicado
        let cleanQR = response.qrCode;
        if (cleanQR.includes('data:image/png;base64,data:')) {
          cleanQR = cleanQR.replace('data:image/png;base64,data:', 'data:image/png;base64,');
        }
        setQrCode(cleanQR);
      } else {
        console.warn('No QR code in response:', response);
      }
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
    } finally {
      setLoadingQR(false);
      fetchingQRRef.current = false;
    }
  };

  const handleCreateInstance = async () => {
    try {
      setLoadingQR(true);
      const response = await whatsappApi.createInstance();
      console.log('Create instance response:', response);
      if (response.qrCode) {
        // Limpiar el QR code si ya tiene el prefijo data: duplicado
        let cleanQR = response.qrCode;
        if (cleanQR.includes('data:image/png;base64,data:')) {
          cleanQR = cleanQR.replace('data:image/png;base64,data:', 'data:image/png;base64,');
        }
        setQrCode(cleanQR);
        showToast('Instancia creada exitosamente. QR code generado.', 'success');
      } else {
        console.warn('No QR code in response:', response);
        showToast(response.message || 'Instancia creada pero no se pudo obtener el QR. Intenta actualizar.', 'warning');
      }
      await fetchInstanceStatus();
    } catch (error: any) {
      console.error('Error creating instance:', error);
      showToast(error.response?.data?.error?.message || 'Error al crear instancia', 'error');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleRefreshQR = async () => {
    await fetchQRCode();
    showToast('QR code actualizado', 'success');
  };

  // fetchTemplates ya está definido arriba con useCallback

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        subject: formData.subject || undefined,
      };

      if (editingTemplate) {
        await whatsappApi.updateTemplate(editingTemplate.id, data);
        showToast('Template actualizado exitosamente', 'success');
      } else {
        await whatsappApi.createTemplate(data);
        showToast('Template creado exitosamente', 'success');
      }

      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar el template', 'error');
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      message: template.message,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Eliminar Template',
      '¿Está seguro de que desea eliminar este template? Esta acción no se puede deshacer.',
      async () => {
        try {
          await whatsappApi.deleteTemplate(id);
          showToast('Template eliminado exitosamente', 'success');
          fetchTemplates();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar el template', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const handleToggleActive = async (template: WhatsAppTemplate) => {
    try {
      await whatsappApi.updateTemplate(template.id, { isActive: !template.isActive });
      showToast(`Template ${!template.isActive ? 'activado' : 'desactivado'} exitosamente`, 'success');
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al actualizar el template', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'INVOICE',
      subject: '',
      message: '',
    });
  };

  // getTypeLabel ya está definido arriba

  const getVariablesHelp = (type: string) => {
    const variables: Record<string, string[]> = {
      INVOICE: ['{{number}}', '{{ncf}}', '{{clientName}}', '{{total}}', '{{date}}', '{{items}}'],
      QUOTE: ['{{number}}', '{{clientName}}', '{{total}}', '{{date}}', '{{validUntil}}', '{{items}}'],
      PAYMENT: ['{{amount}}', '{{invoiceNumber}}', '{{clientName}}', '{{date}}', '{{method}}'],
      REMINDER: ['{{clientName}}', '{{invoiceNumber}}', '{{amount}}', '{{dueDate}}', '{{daysOverdue}}'],
      CUSTOM: ['{{variable1}}', '{{variable2}}', '...'],
    };
    return variables[type] || [];
  };

  const handleExportExcel = () => {
    const exportData = filteredTemplates.map((template) => ({
      Nombre: template.name,
      Tipo: getTypeLabel(template.type),
      Asunto: template.subject || '-',
      Mensaje: template.message.substring(0, 100) + (template.message.length > 100 ? '...' : ''),
      Estado: template.isActive ? 'Activo' : 'Inactivo',
      'Fecha Creación': new Date(template.createdAt).toLocaleDateString('es-DO'),
      'Última Actualización': new Date(template.updatedAt).toLocaleDateString('es-DO'),
    }));
    exportToExcel(exportData, `Templates_WhatsApp_${new Date().toISOString().split('T')[0]}`, 'Templates WhatsApp');
    showToast('Exportación a Excel completada', 'success');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nombre', dataKey: 'nombre', width: 100 },
      { header: 'Tipo', dataKey: 'tipo', width: 80 },
      { header: 'Asunto', dataKey: 'asunto', width: 100 },
      { header: 'Mensaje', dataKey: 'mensaje', width: 150 },
      { header: 'Estado', dataKey: 'estado', width: 60 },
    ];
    const exportData = filteredTemplates.map((template) => ({
      nombre: template.name,
      tipo: getTypeLabel(template.type),
      asunto: template.subject || '-',
      mensaje: template.message.substring(0, 100) + (template.message.length > 100 ? '...' : ''),
      estado: template.isActive ? 'Activo' : 'Inactivo',
    }));
    exportToPDF(exportData, columns, `Templates_WhatsApp_${new Date().toISOString().split('T')[0]}`, 'Templates WhatsApp', {
      title: 'Listado de Templates de WhatsApp',
      date: new Date().toLocaleDateString('es-DO'),
    });
    showToast('Exportación a PDF completada', 'success');
  };

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Sección de Conexión WhatsApp */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Conexión WhatsApp</h2>
            <p className="text-sm text-gray-600 mt-1">Gestiona la conexión de WhatsApp con Evolution API</p>
          </div>
          <button
            onClick={fetchInstanceStatus}
            disabled={loadingStatus}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            Actualizar Estado
          </button>
        </div>

        {loadingStatus ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Verificando estado...</p>
          </div>
        ) : instanceStatus ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {instanceStatus.connected ? (
                <>
                  <HiCheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">WhatsApp Conectado</p>
                    {instanceStatus.number && (
                      <p className="text-sm text-gray-600">Número: {instanceStatus.number}</p>
                    )}
                  </div>
                </>
              ) : instanceStatus.exists ? (
                <>
                  {instanceStatus.status === 'connecting' ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <p className="font-medium text-blue-700">Conectando...</p>
                        <p className="text-sm text-gray-600">Escanea el QR code con WhatsApp</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <HiX className="w-6 h-6 text-yellow-500" />
                      <div>
                        <p className="font-medium text-yellow-700">WhatsApp Desconectado</p>
                        <p className="text-sm text-gray-600">Estado: {instanceStatus.status}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <HiX className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700">Instancia no encontrada</p>
                    <p className="text-sm text-gray-600">Crea una instancia para conectar WhatsApp</p>
                  </div>
                </>
              )}
            </div>

            {!instanceStatus.connected && (
              <div className="border-t pt-4">
                {!instanceStatus.exists ? (
                  <button
                    onClick={handleCreateInstance}
                    disabled={loadingQR}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                  >
                    {loadingQR ? 'Creando instancia...' : 'Crear Instancia y Generar QR'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Código QR para conectar</p>
                      <button
                        onClick={handleRefreshQR}
                        disabled={loadingQR}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        <HiRefresh className={`w-4 h-4 ${loadingQR ? 'animate-spin' : ''}`} />
                        Actualizar QR
                      </button>
                    </div>
                    {loadingQR ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Generando QR...</p>
                      </div>
                    ) : qrCode ? (
                      <div className="flex flex-col items-center bg-gray-50 p-6 rounded-lg">
                        <img
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code WhatsApp"
                          className="max-w-xs w-full border-4 border-white rounded-lg shadow-lg"
                        />
                        <p className="mt-4 text-sm text-gray-600 text-center">
                          1. Abre WhatsApp en tu teléfono<br />
                          2. Ve a Configuración → Dispositivos vinculados → Vincular un dispositivo<br />
                          3. Escanea este código QR
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No hay QR code disponible. Intenta actualizar o crear la instancia.</p>
                        <button
                          onClick={handleCreateInstance}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        >
                          Recrear Instancia
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo obtener el estado de la conexión
          </div>
        )}
      </div>

      {/* Sección de Templates */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Templates de WhatsApp</h2>
          <p className="text-sm text-gray-600 mt-1">Administre los templates de mensajes para WhatsApp</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingTemplate(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Nuevo Template
        </button>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, tipo, asunto o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <HiXCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            >
              <HiDocumentDownload className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
            >
              <HiDocumentDownload className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Ej: Factura estándar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as WhatsAppTemplate['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="INVOICE">Factura</option>
                  <option value="QUOTE">Cotización</option>
                  <option value="PAYMENT">Pago</option>
                  <option value="REMINDER">Recordatorio</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto (opcional)</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Asunto del mensaje"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={8}
                required
                placeholder="Escriba el mensaje. Use {{variable}} para variables dinámicas."
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-xs font-medium text-blue-900 mb-1">Variables disponibles para {getTypeLabel(formData.type)}:</p>
                <div className="flex flex-wrap gap-2">
                  {getVariablesHelp(formData.type).map((variable) => (
                    <code key={variable} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                      {variable}
                    </code>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                {editingTemplate ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de templates */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron templates' : 'No hay templates configurados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asunto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensaje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{template.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTypeLabel(template.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {template.subject || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={template.message}>
                          {template.message.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            template.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {template.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleActive(template)}
                            className={`${
                              template.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={template.isActive ? 'Desactivar' : 'Activar'}
                          >
                            <HiChat className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(template)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <HiPencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTemplates.length)} de {filteredTemplates.length} templates
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppTab;
