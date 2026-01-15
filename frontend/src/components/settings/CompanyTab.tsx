import { useEffect, useState, useRef } from 'react';
import { settingsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const CompanyTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rnc: '',
    logo: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getCompany();
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        rnc: data.rnc || '',
        logo: data.logo || '',
      });
      setLogoPreview(data.logo || null);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
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

          // Redimensionar si es necesario
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

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen', 'error');
      return;
    }

    // Validar tamaño original (máximo 5MB antes de comprimir)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe superar los 5MB', 'error');
      return;
    }

    try {
      showToast('Comprimiendo imagen...', 'info');
      // Comprimir la imagen antes de convertir a base64
      const compressedBase64 = await compressImage(file, 800, 0.8);
      
      // Verificar tamaño final (máximo 2MB después de compresión)
      const base64Size = (compressedBase64.length * 3) / 4;
      if (base64Size > 2 * 1024 * 1024) {
        // Intentar con más compresión
        const moreCompressed = await compressImage(file, 600, 0.6);
        setForm({ ...form, logo: moreCompressed });
        setLogoPreview(moreCompressed);
        showToast('Imagen comprimida y lista', 'success');
      } else {
        setForm({ ...form, logo: compressedBase64 });
        setLogoPreview(compressedBase64);
        showToast('Imagen comprimida y lista', 'success');
      }
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      showToast('Error al procesar la imagen', 'error');
    }
  };

  const handleRemoveLogo = () => {
    setForm({ ...form, logo: '' });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const dataToSend = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        rnc: form.rnc.trim() || undefined,
        logo: form.logo || undefined,
      };
      await settingsApi.updateCompany(dataToSend);
      showToast('Datos de la empresa actualizados exitosamente', 'success');
      // Recargar datos para asegurar sincronización
      await fetchData();
    } catch (error: any) {
      console.error('Error updating company:', error);
      showToast(error.response?.data?.error?.message || 'Error al actualizar los datos', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Datos de la Empresa</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Comercial *
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
              <label className="block text-sm font-medium text-gray-700 mb-1">RNC</label>
              <input
                type="text"
                value={form.rnc}
                onChange={(e) => setForm({ ...form, rnc: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
            <p className="text-xs text-gray-500 mb-2">Selecciona una imagen (JPG, PNG, máximo 2MB)</p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center text-sm transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Buscar Logo
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
                  >
                    Eliminar Logo
                  </button>
                )}
              </div>
              
              {logoPreview && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                  <div className="inline-block border border-gray-300 rounded p-2 bg-white">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
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

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• El RNC es obligatorio si usas NCF</li>
          <li>• Los cambios quedan auditados</li>
          <li>• El logo se usa en PDF e impresiones</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyTab;


