import { useEffect, useState } from 'react';
import { whatsappApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiPlus, HiPencil, HiTrash, HiChat } from 'react-icons/hi';

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
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'INVOICE' as WhatsAppTemplate['type'],
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.getTemplates();
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error('Error fetching WhatsApp templates:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar los templates', 'error');
    } finally {
      setLoading(false);
    }
  };

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
    if (!confirm('¿Está seguro de que desea eliminar este template?')) {
      return;
    }

    try {
      await whatsappApi.deleteTemplate(id);
      showToast('Template eliminado exitosamente', 'success');
      fetchTemplates();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al eliminar el template', 'error');
    }
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

  return (
    <div className="space-y-6">
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
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay templates configurados
          </div>
        ) : (
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
                {templates.map((template) => (
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
        )}
      </div>
    </div>
  );
};

export default WhatsAppTab;


