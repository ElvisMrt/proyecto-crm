import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiPencil, HiTrash, HiSearch, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const BranchesTab = () => {
  const { showToast, showConfirm } = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerId: '',
    isActive: true,
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterBranches();
  }, [searchTerm, branches]);

  const filterBranches = () => {
    if (!searchTerm.trim()) {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (branch.code && branch.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (branch.address && branch.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBranches(filtered);
    }
    setCurrentPage(1);
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      showToast('Error al cargar las sucursales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await settingsApi.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      managerId: branch.managerId || '',
      isActive: branch.isActive,
    });
    setShowForm(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (branch: any) => {
    setActionMenuOpen(null);
    showConfirm(
      'Eliminar Sucursal',
      `¿Está seguro de eliminar la sucursal "${branch.name}"? Esta acción puede desactivar la sucursal si tiene datos asociados.`,
      async () => {
        try {
          await settingsApi.deleteBranch(branch.id);
          showToast('Sucursal eliminada exitosamente', 'success');
          fetchBranches();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar la sucursal', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const handleNew = () => {
    setEditingBranch(null);
    setForm({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      managerId: '',
      isActive: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await settingsApi.updateBranch(editingBranch.id, form);
        showToast('Sucursal actualizada exitosamente', 'success');
      } else {
        await settingsApi.createBranch(form);
        showToast('Sucursal creada exitosamente', 'success');
      }
      setShowForm(false);
      fetchBranches();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar la sucursal', 'error');
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredBranches.map((branch) => ({
      Nombre: branch.name,
      Código: branch.code || '-',
      Dirección: branch.address || '-',
      Teléfono: branch.phone || '-',
      Email: branch.email || '-',
      Gerente: branch.manager?.name || '-',
      Estado: branch.isActive ? 'Activa' : 'Inactiva',
    }));
    exportToExcel(exportData, `Sucursales_${new Date().toISOString().split('T')[0]}`, 'Sucursales');
    showToast('Exportación a Excel completada', 'success');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nombre', dataKey: 'nombre', width: 100 },
      { header: 'Código', dataKey: 'codigo', width: 60 },
      { header: 'Dirección', dataKey: 'direccion', width: 120 },
      { header: 'Teléfono', dataKey: 'telefono', width: 80 },
      { header: 'Email', dataKey: 'email', width: 100 },
      { header: 'Gerente', dataKey: 'gerente', width: 100 },
      { header: 'Estado', dataKey: 'estado', width: 60 },
    ];
    const exportData = filteredBranches.map((branch) => ({
      nombre: branch.name,
      codigo: branch.code || '-',
      direccion: branch.address || '-',
      telefono: branch.phone || '-',
      email: branch.email || '-',
      gerente: branch.manager?.name || '-',
      estado: branch.isActive ? 'Activa' : 'Inactiva',
    }));
    exportToPDF(exportData, columns, `Sucursales_${new Date().toISOString().split('T')[0]}`, 'Sucursales', {
      title: 'Listado de Sucursales',
      date: new Date().toLocaleDateString('es-DO'),
    });
    showToast('Exportación a PDF completada', 'success');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  // Pagination
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBranches = filteredBranches.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Sucursales</h2>
        <button
          onClick={handleNew}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nueva Sucursal
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
                placeholder="Buscar por nombre, código o dirección..."
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

      {/* Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-modal-title"
          aria-describedby="branch-modal-description"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 id="branch-modal-title" className="text-lg font-semibold text-gray-900 mb-4">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h3>
              <p id="branch-modal-description" className="sr-only">
                Formulario para {editingBranch ? 'editar' : 'crear'} una sucursal.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="Ej: CENTRO, NORTE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Código corto único para identificar la sucursal</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gerente</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin gerente asignado</option>
                    {users
                      .filter(u => u.isActive && (u.role === 'SUPERVISOR' || u.role === 'ADMINISTRATOR'))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role === 'SUPERVISOR' ? 'Supervisor' : 'Administrador'})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Activa</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    {editingBranch ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron sucursales' : 'No hay sucursales'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gerente</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Usuarios</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentBranches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {branch.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.code || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {branch.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.manager?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {branch.usersCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          branch.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === branch.id ? null : branch.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === branch.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEdit(branch)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <HiPencil className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(branch)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
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
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredBranches.length)} de {filteredBranches.length} sucursales
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

export default BranchesTab;
