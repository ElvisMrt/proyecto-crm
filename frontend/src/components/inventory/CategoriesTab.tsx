import { useEffect, useState } from 'react';
import { inventoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';

const CategoriesTab = () => {
  const { showToast, showConfirm } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await inventoryApi.updateCategory(editingCategory.id, form);
        showToast('Categoría actualizada exitosamente', 'success');
      } else {
        await inventoryApi.createCategory(form);
        showToast('Categoría creada exitosamente', 'success');
      }
      setShowForm(false);
      setEditingCategory(null);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar la categoría', 'error');
    }
  };

  const handleDelete = async (category: any) => {
    setActionMenuOpen(null);
    showConfirm(
      'Eliminar Categoría',
      `¿Está seguro de eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await inventoryApi.deleteCategory(category.id);
          showToast('Categoría eliminada exitosamente', 'success');
          fetchCategories();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar la categoría', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setForm({ name: '', description: '' });
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nueva Categoría
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay categorías</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{category.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {category.productCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === category.id ? null : category.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          <HiDotsVertical className="w-5 h-5" />
                        </button>
                        {actionMenuOpen === category.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActionMenuOpen(null)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                              <div className="py-1">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setForm({ name: category.name, description: category.description || '' });
                          setShowForm(true);
                                    setActionMenuOpen(null);
                        }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                                  <HiPencil className="w-4 h-4 mr-2" />
                        Editar
                      </button>
                                <button
                                  onClick={() => handleDelete(category)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                >
                                  <HiTrash className="w-4 h-4 mr-2" />
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
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;


