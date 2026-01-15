import { useEffect, useState, useRef } from 'react';
import { inventoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';

const ProductsTab = () => {
  const { showToast, showConfirm } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [filters, setFilters] = useState({
    categoryId: '',
    search: '',
    isActive: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [form, setForm] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    brand: '',
    unit: 'UNIT',
    salePrice: 0,
    cost: 0,
    hasTax: true,
    taxPercent: 18,
    controlsStock: true,
    minStock: 0,
    isActive: true,
    imageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.page, filters.categoryId, filters.isActive]);

  const fetchCategories = async () => {
    try {
      const response = await inventoryApi.getCategories();
      setCategories(response.data || []);
      if (response.data && response.data.length > 0) {
        setForm({ ...form, categoryId: response.data[0].id });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.search) params.search = filters.search;
      if (filters.isActive) params.isActive = filters.isActive;

      const response = await inventoryApi.getProducts(params);
      setProducts(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, form);
        showToast('Producto actualizado exitosamente', 'success');
      } else {
        // Si no hay código, enviar sin código para que se genere automáticamente
        const productData = form.code.trim() ? form : { ...form, code: undefined };
        await inventoryApi.createProduct(productData);
        showToast('Producto creado exitosamente', 'success');
      }
      setShowForm(false);
      setEditingProduct(null);
      setForm({
        code: '',
        barcode: '',
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        brand: '',
        unit: 'UNIT',
        salePrice: 0,
        cost: 0,
        hasTax: true,
        taxPercent: 18,
        controlsStock: true,
        minStock: 0,
        isActive: true,
        imageUrl: '',
      });
      setImagePreview(null);
      fetchProducts();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar el producto', 'error');
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe superar los 5MB', 'error');
      return;
    }

    try {
      showToast('Comprimiendo imagen...', 'info');
      const compressedBase64 = await compressImage(file, 800, 0.8);
      
      const base64Size = (compressedBase64.length * 3) / 4;
      if (base64Size > 2 * 1024 * 1024) {
        const moreCompressed = await compressImage(file, 600, 0.6);
        setForm({ ...form, imageUrl: moreCompressed });
        setImagePreview(moreCompressed);
      } else {
        setForm({ ...form, imageUrl: compressedBase64 });
        setImagePreview(compressedBase64);
      }
      showToast('Imagen cargada exitosamente', 'success');
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      showToast('Error al procesar la imagen', 'error');
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, imageUrl: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (product: any) => {
    setActionMenuOpen(null);
    showConfirm(
      'Eliminar Producto',
      `¿Está seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await inventoryApi.deleteProduct(product.id);
          showToast('Producto eliminado exitosamente', 'success');
          fetchProducts();
        } catch (error: any) {
          showToast(error.response?.data?.error?.message || 'Error al eliminar el producto', 'error');
        }
      },
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Productos</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
            setForm({
              code: '',
              barcode: '',
              name: '',
              description: '',
              categoryId: categories.length > 0 ? categories[0].id : '',
              brand: '',
              unit: 'UNIT',
              salePrice: 0,
              cost: 0,
              hasTax: true,
              taxPercent: 18,
              controlsStock: true,
              minStock: 0,
              isActive: true,
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Código, nombre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchProducts();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchProducts}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          aria-describedby="product-modal-description"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 id="product-modal-title" className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <p id="product-modal-description" className="sr-only">
              Formulario para {editingProduct ? 'editar' : 'crear'} un producto en el inventario.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código {editingProduct ? '*' : '(Opcional - se genera automáticamente)'}
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required={!!editingProduct}
                    disabled={!!editingProduct}
                    placeholder={editingProduct ? form.code : 'Se generará automáticamente'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                <p className="text-xs text-gray-500 mb-2">Selecciona una imagen (JPG, PNG, máximo 5MB)</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Buscar Imagen
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
                      >
                        Eliminar Imagen
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                      <div className="inline-block border border-gray-300 rounded p-2 bg-white">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-32 max-h-32 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            showToast('Error al cargar la imagen', 'error');
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% Impuesto</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.taxPercent}
                    onChange={(e) => setForm({ ...form, taxPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.controlsStock}
                      onChange={(e) => setForm({ ...form, controlsStock: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Controla Stock</span>
                  </label>
                </div>
                {form.controlsStock && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
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
                    setEditingProduct(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay productos</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Control Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.controlsStock ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.controlsStock ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                          {actionMenuOpen === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                <div className="py-1">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setForm({
                              code: product.code,
                              barcode: product.barcode || '',
                              name: product.name,
                              description: product.description || '',
                              categoryId: product.categoryId,
                              brand: product.brand || '',
                              unit: product.unit || 'UNIT',
                              salePrice: product.salePrice,
                              cost: product.cost || 0,
                              hasTax: product.hasTax,
                              taxPercent: product.taxPercent,
                              controlsStock: product.controlsStock,
                              minStock: product.minStock,
                              isActive: product.isActive,
                              imageUrl: product.imageUrl || '',
                            });
                            setImagePreview(product.imageUrl || null);
                            setShowForm(true);
                                      setActionMenuOpen(null);
                          }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                                    <HiPencil className="w-4 h-4 mr-2" />
                          Editar
                        </button>
                                  <button
                                    onClick={() => handleDelete(product)}
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
            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} productos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ProductsTab;


