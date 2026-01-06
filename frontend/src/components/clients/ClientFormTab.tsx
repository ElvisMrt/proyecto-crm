import { useState, useEffect } from 'react';
import { clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface ClientFormTabProps {
  client?: any;
  onSave: () => void;
  onCancel: () => void;
}

const ClientFormTab = ({ client, onSave, onCancel }: ClientFormTabProps) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    identification: '',
    email: '',
    phone: '',
    address: '',
    clientType: 'CASH' as 'CASH' | 'CREDIT',
    creditLimit: 0,
    creditDays: 30,
    observations: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        identification: client.identification || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        clientType: (client.creditLimit && client.creditLimit > 0) ? 'CREDIT' : 'CASH',
        creditLimit: client.creditLimit || 0,
        creditDays: client.creditDays || 30,
        observations: '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    if (!form.identification.trim()) {
      showToast('El documento (RNC/Cédula) es obligatorio', 'error');
      return;
    }

    try {
      setLoading(true);
      const data: any = {
        name: form.name,
        identification: form.identification,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        clientType: form.clientType,
        creditDays: form.creditDays,
      };

      if (form.clientType === 'CREDIT') {
        data.creditLimit = form.creditLimit;
      }

      if (client) {
        await clientsApi.updateClient(client.id, data);
        showToast('Cliente actualizado exitosamente', 'success');
      } else {
        await clientsApi.createClient(data);
        showToast('Cliente creado exitosamente', 'success');
      }
      onSave();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos Generales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Datos Generales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RNC / Cédula *
                  </label>
                  <input
                    type="text"
                    value={form.identification}
                    onChange={(e) => setForm({ ...form, identification: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Datos Comerciales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Datos Comerciales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Venta por Defecto *
                </label>
                <select
                  value={form.clientType}
                  onChange={(e) => setForm({ ...form, clientType: e.target.value as 'CASH' | 'CREDIT' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CASH">Contado</option>
                  <option value="CREDIT">Crédito</option>
                </select>
              </div>

              {form.clientType === 'CREDIT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Límite de Crédito (RD$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.creditLimit}
                      onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de Crédito
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.creditDays}
                      onChange={(e) => setForm({ ...form, creditDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Información */}
      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• No se permiten documentos duplicados</li>
          <li>• Los campos fiscales son validados</li>
          <li>• Los cambios quedan auditados</li>
          <li>• Un cliente bloqueado no puede facturar</li>
        </ul>
      </div>
    </div>
  );
};

export default ClientFormTab;


