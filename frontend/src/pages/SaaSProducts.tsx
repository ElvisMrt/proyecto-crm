import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlinePhotograph, HiPlus, HiSearch } from 'react-icons/hi';
import { saasApi } from '../services/api';

const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}/api/v1`;
  return url.replace('/api/v1', '');
})();

const UPLOAD_API = `${API_BASE}/api/v1/saas/upload-image`;

const CATEGORIES = [
  { id: 'gorras', name: 'Gorras' },
  { id: 'tshirts', name: 'Camisetas' },
  { id: 'tazas', name: 'Tazas' },
  { id: 'termos', name: 'Termos' },
  { id: 'llaveros', name: 'Llaveros' },
  { id: 'otros', name: 'Otros' },
];

const TAGS = [
  { id: 'best-seller', name: 'Mas vendido' },
  { id: 'new', name: 'Nuevo' },
  { id: 'discount', name: 'Oferta' },
  { id: 'trending', name: 'Tendencia' },
];

const COLORS_PRESET = ['Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Marron', 'Cyan', 'Rosa', 'Naranja', 'Morado'];

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  colors: string[];
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  note?: string;
  createdAt: string;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'gorras',
  imageUrl: '',
  colors: [] as string[],
  tags: [] as string[],
  isActive: true,
  sortOrder: '0',
  note: '',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const resolveProductImageUrl = (value?: string) => {
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${API_BASE}${parsed.pathname}`;
      }
      return value;
    } catch {
      return value;
    }
  }

  if (value.startsWith('/uploads/')) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${API_BASE}/${value}`;
  }

  return value;
};

export default function SaaSProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showError = (message: string) => setError(message);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Solo se permiten imagenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen no puede superar 5MB');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('saasToken');
      const res = await fetch(UPLOAD_API, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setBrokenImages((current) => ({ ...current, preview: false }));
        setForm((current) => ({ ...current, imageUrl: data.url || data.path || '' }));
      } else {
        showError(data.message || 'Error al subir imagen');
      }
    } catch {
      showError('Error de conexion al subir imagen');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadImage(file);
    },
    [uploadImage]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = '';
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await saasApi.get('/saas/website-products');
      setProducts(response.data.data || []);
      setBrokenImages({});
      setError('');
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setColorInput('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      imageUrl: product.imageUrl || '',
      colors: product.colors,
      tags: product.tags,
      isActive: product.isActive,
      sortOrder: String(product.sortOrder),
      note: product.note || '',
    });
    setColorInput('');
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      showError('Nombre, precio y categoria son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        category: form.category,
        imageUrl: form.imageUrl || undefined,
        colors: form.colors,
        tags: form.tags,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        note: form.note || undefined,
      };

      if (editingProduct) {
        await saasApi.put(`/saas/website-products/${editingProduct.id}`, payload);
      } else {
        await saasApi.post('/saas/website-products', payload);
      }

      setShowModal(false);
      await fetchProducts();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto del website?')) return;

    setDeleting(id);
    try {
      await saasApi.delete(`/saas/website-products/${id}`);
      await fetchProducts();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Error al eliminar producto');
    } finally {
      setDeleting(null);
    }
  };

  const toggleTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  };

  const toggleColor = (color: string) => {
    setForm((current) => ({
      ...current,
      colors: current.colors.includes(color)
        ? current.colors.filter((item) => item !== color)
        : [...current.colors, color],
    }));
  };

  const addCustomColor = () => {
    const value = colorInput.trim();
    if (value && !form.colors.includes(value)) {
      setForm((current) => ({ ...current, colors: [...current.colors, value] }));
    }
    setColorInput('');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, filterCategory, search]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.isActive).length,
      hidden: products.filter((product) => !product.isActive).length,
      withImage: products.filter((product) => Boolean(product.imageUrl)).length,
    };
  }, [products]);

  const categoryName = (id: string) => CATEGORIES.find((category) => category.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Website</p>
          <h1 className="text-2xl font-bold text-slate-950">Catalogo publico</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona el contenido que aparece en la tienda publica de la marca.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <HiPlus className="h-4 w-4" />
          Nuevo producto
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Productos', value: stats.total },
          { label: 'Activos', value: stats.active },
          { label: 'Ocultos', value: stats.hidden },
          { label: 'Con imagen', value: stats.withImage },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Bandeja de productos</h2>
              <p className="text-sm text-slate-500">Filtra por categoria o busca por nombre para mantener el website ordenado.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[240px]">
                <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">Todas las categorias</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            No hay productos que coincidan con el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Colores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && !brokenImages[product.id] ? (
                          <img
                            src={resolveProductImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="h-12 w-12 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-1"
                            onError={() => setBrokenImages((current) => ({ ...current, [product.id]: true }))}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                            <HiOutlinePhotograph className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-950">{product.name}</p>
                          {product.note ? <p className="text-xs text-slate-500">{product.note}</p> : null}
                          {product.description ? <p className="max-w-xs truncate text-xs text-slate-400">{product.description}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {categoryName(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-950">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.colors.slice(0, 4).map((color) => (
                          <span key={color} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {color}
                          </span>
                        ))}
                        {product.colors.length > 4 ? <span className="text-xs text-slate-400">+{product.colors.length - 4}</span> : null}
                        {product.colors.length === 0 ? <span className="text-xs text-slate-300">—</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {TAGS.find((item) => item.id === tag)?.name || tag}
                          </span>
                        ))}
                        {product.tags.length === 0 ? <span className="text-xs text-slate-300">—</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {product.isActive ? 'Activo' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deleting === product.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ej: Gorras Ojo de Angel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Descripcion del producto"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Precio (RD$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Categoria *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Imagen</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />

                {form.imageUrl && !brokenImages.preview ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={resolveProductImageUrl(form.imageUrl)}
                      alt="preview"
                      className="h-24 w-24 rounded-2xl border border-slate-200 bg-white object-contain p-1"
                      onError={() => setBrokenImages((current) => ({ ...current, preview: true }))}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-white"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition ${
                      dragOver
                        ? 'border-slate-400 bg-slate-100'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-slate-700" />
                        <span className="text-xs text-slate-500">Subiendo imagen...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlinePhotograph className="h-7 w-7 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">
                          {dragOver ? 'Suelta la imagen aqui' : 'Arrastra una imagen o haz clic'}
                        </p>
                        <p className="text-xs text-slate-400">JPG, PNG, SVG, WebP · max 5MB</p>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="O pega una URL manual"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Colores</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS_PRESET.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        form.colors.includes(color)
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Agregar color personalizado"
                  />
                  <button
                    type="button"
                    onClick={addCustomColor}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        form.tags.includes(tag.id)
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nota visible</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Ej: NUEVO"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Orden de aparicion</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((current) => ({ ...current, sortOrder: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Visible en el website
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
