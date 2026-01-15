import { useEffect, useState } from 'react';
import { settingsApi, branchesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiPencil, HiTrash, HiSearch, HiDocumentDownload, HiXCircle, HiLockClosed, HiLockOpen } from 'react-icons/hi';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const UsersTab = () => {
  const { showToast, showConfirm } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'OPERATOR' as 'ADMINISTRATOR' | 'SUPERVISOR' | 'OPERATOR' | 'CASHIER',
    branchId: '',
    password: '',
    isActive: true,
  });

  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
          getRoleLabel(user.role).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error al cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      branchId: user.branchId || '',
      password: '',
      isActive: user.isActive,
    });
    setShowForm(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (user: any) => {
    setActionMenuOpen(null);
    showConfirm(
      'Eliminar Usuario',
      `¿Está seguro de eliminar el usuario "${user.name}"? Esta acción puede desactivar el usuario si tiene datos asociados.`,
      async () => {
        try {
          await settingsApi.deleteUser(user.id);
          showToast('Usuario eliminado exitosamente', 'success');
          fetchUsers();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar el usuario', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const handleToggleStatus = async (user: any) => {
    setActionMenuOpen(null);
    showConfirm(
      user.isActive ? 'Desactivar Usuario' : 'Activar Usuario',
      `¿Está seguro de ${user.isActive ? 'desactivar' : 'activar'} el usuario "${user.name}"?`,
      async () => {
        try {
          await settingsApi.toggleUserStatus(user.id, !user.isActive);
          showToast(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`, 'success');
          fetchUsers();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al cambiar el estado', 'error');
        }
      },
      { type: user.isActive ? 'warning' : 'info', confirmText: user.isActive ? 'Desactivar' : 'Activar', cancelText: 'Cancelar' }
    );
  };

  const handleNew = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'OPERATOR',
      branchId: '',
      password: '',
      isActive: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        branchId: form.branchId || undefined,
        isActive: form.isActive,
      };
      if (form.password || !editingUser) {
        data.password = form.password;
      }

      if (editingUser) {
        await settingsApi.updateUser(editingUser.id, data);
        showToast('Usuario actualizado exitosamente', 'success');
      } else {
        await settingsApi.createUser(data);
        showToast('Usuario creado exitosamente', 'success');
      }
      setShowForm(false);
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar el usuario', 'error');
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredUsers.map((user) => ({
      Nombre: user.name,
      Email: user.email,
      Teléfono: user.phone || '-',
      Rol: getRoleLabel(user.role),
      Sucursal: user.branch?.name || '-',
      Estado: user.isActive ? 'Activo' : 'Inactivo',
      'Último Acceso': formatDate(user.lastLogin),
    }));
    exportToExcel(exportData, `Usuarios_${new Date().toISOString().split('T')[0]}`, 'Usuarios');
    showToast('Exportación a Excel completada', 'success');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nombre', dataKey: 'nombre', width: 100 },
      { header: 'Email', dataKey: 'email', width: 120 },
      { header: 'Teléfono', dataKey: 'telefono', width: 80 },
      { header: 'Rol', dataKey: 'rol', width: 80 },
      { header: 'Sucursal', dataKey: 'sucursal', width: 100 },
      { header: 'Estado', dataKey: 'estado', width: 60 },
      { header: 'Último Acceso', dataKey: 'ultimoAcceso', width: 80 },
    ];
    const exportData = filteredUsers.map((user) => ({
      nombre: user.name,
      email: user.email,
      telefono: user.phone || '-',
      rol: getRoleLabel(user.role),
      sucursal: user.branch?.name || '-',
      estado: user.isActive ? 'Activo' : 'Inactivo',
      ultimoAcceso: formatDate(user.lastLogin),
    }));
    exportToPDF(exportData, columns, `Usuarios_${new Date().toISOString().split('T')[0]}`, 'Usuarios', {
      title: 'Listado de Usuarios',
      date: new Date().toLocaleDateString('es-DO'),
    });
    showToast('Exportación a PDF completada', 'success');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  const getRoleLabel = (role: string) => {
    const labels: any = {
      ADMINISTRATOR: 'Administrador',
      SUPERVISOR: 'Supervisor',
      OPERATOR: 'Operador',
      CASHIER: 'Cajero',
    };
    return labels[role] || role;
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
        <button
          onClick={handleNew}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nuevo Usuario
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
                placeholder="Buscar por nombre, email, teléfono o rol..."
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="CASHIER">Cajero</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMINISTRATOR">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin sucursal asignada</option>
                    {branches.filter(b => b.isActive).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} {branch.code ? `(${branch.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Asignar una sucursal limita el acceso del usuario a esa sucursal
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingUser}
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Activo</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    {editingUser ? 'Actualizar' : 'Crear'}
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
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios'}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRoleLabel(user.role)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.branch?.name || '-'}
                        {user.branch?.code && (
                          <span className="text-xs text-gray-400 ml-1">({user.branch.code})</span>
                        )}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                                <div className="py-1">
                        <button
                          onClick={() => handleEdit(user)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                                    <HiPencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                                    {user.isActive ? (
                                      <>
                                        <HiLockClosed className="w-4 h-4" />
                                        Desactivar
                                      </>
                                    ) : (
                                      <>
                                        <HiLockOpen className="w-4 h-4" />
                                        Activar
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user)}
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
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
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

export default UsersTab;
