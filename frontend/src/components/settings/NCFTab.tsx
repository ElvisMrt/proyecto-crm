import { useEffect, useState } from 'react';
import { ncfApi, branchesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiPlus, HiPencil, HiTrash, HiExclamationCircle, HiSearch, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface NcfSequence {
  id: string;
  prefix: string;
  description: string | null;
  startRange: number;
  endRange: number;
  currentNumber: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  branch: {
    id: string;
    name: string;
  } | null;
  remaining: number;
  percentageUsed: number;
}

const NCFTab = () => {
  const { showToast } = useToast();
  const [sequences, setSequences] = useState<NcfSequence[]>([]);
  const [filteredSequences, setFilteredSequences] = useState<NcfSequence[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState<NcfSequence | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    prefix: 'FACE',
    description: '',
    startRange: 1,
    endRange: 1000,
    currentNumber: 0,
    branchId: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
  });

  useEffect(() => {
    fetchSequences();
    fetchBranches();
  }, []);

  useEffect(() => {
    filterSequences();
  }, [searchTerm, sequences]);

  const filterSequences = () => {
    if (!searchTerm.trim()) {
      setFilteredSequences(sequences);
    } else {
      const filtered = sequences.filter(
        (seq) =>
          seq.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (seq.description && seq.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (seq.branch && seq.branch.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSequences(filtered);
    }
    setCurrentPage(1);
  };

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const response = await ncfApi.getSequences({ limit: 100 });
      setSequences(response.data || []);
    } catch (error: any) {
      console.error('Error fetching NCF sequences:', error);
      showToast(error.response?.data?.error?.message || 'Error al cargar las secuencias NCF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        prefix: formData.prefix,
        description: formData.description || undefined,
        startRange: parseInt(formData.startRange.toString()),
        endRange: parseInt(formData.endRange.toString()),
        branchId: formData.branchId || undefined,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
      };

      if (editingSequence) {
        data.currentNumber = parseInt(formData.currentNumber.toString());
      }

      if (editingSequence) {
        await ncfApi.updateSequence(editingSequence.id, data);
        showToast('Secuencia NCF actualizada exitosamente', 'success');
      } else {
        await ncfApi.createSequence(data);
        showToast('Secuencia NCF creada exitosamente', 'success');
      }

      setShowForm(false);
      setEditingSequence(null);
      resetForm();
      fetchSequences();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar la secuencia NCF', 'error');
    }
  };

  const handleEdit = (sequence: NcfSequence) => {
    setEditingSequence(sequence);
    setFormData({
      prefix: sequence.prefix,
      description: sequence.description || '',
      startRange: sequence.startRange,
      endRange: sequence.endRange,
      currentNumber: sequence.currentNumber,
      branchId: sequence.branch?.id || '',
      validFrom: new Date(sequence.validFrom).toISOString().split('T')[0],
      validUntil: sequence.validUntil ? new Date(sequence.validUntil).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea desactivar esta secuencia NCF?')) {
      return;
    }

    try {
      await ncfApi.deleteSequence(id);
      showToast('Secuencia NCF desactivada exitosamente', 'success');
      fetchSequences();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al desactivar la secuencia NCF', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      prefix: 'FACE',
      description: '',
      startRange: 1,
      endRange: 1000,
      currentNumber: 0,
      branchId: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
    });
  };

  const getStatusColor = (sequence: NcfSequence) => {
    if (!sequence.isActive) return 'bg-gray-100 text-gray-800';
    if (sequence.percentageUsed >= 90) return 'bg-red-100 text-red-800';
    if (sequence.percentageUsed >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const handleExportExcel = () => {
    const exportData = filteredSequences.map((seq) => ({
      Prefijo: seq.prefix,
      Descripción: seq.description || '-',
      'Rango Inicial': seq.startRange,
      'Rango Final': seq.endRange,
      'Número Actual': seq.currentNumber,
      Disponibles: seq.remaining,
      'Uso %': `${seq.percentageUsed}%`,
      Sucursal: seq.branch?.name || 'Todas',
      Estado: seq.isActive ? 'Activa' : 'Inactiva',
      'Válido desde': new Date(seq.validFrom).toLocaleDateString('es-DO'),
      'Válido hasta': seq.validUntil ? new Date(seq.validUntil).toLocaleDateString('es-DO') : '-',
    }));
    exportToExcel(exportData, `Secuencias_NCF_${new Date().toISOString().split('T')[0]}`, 'Secuencias NCF');
    showToast('Exportación a Excel completada', 'success');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Prefijo', dataKey: 'prefijo', width: 60 },
      { header: 'Descripción', dataKey: 'descripcion', width: 100 },
      { header: 'Rango', dataKey: 'rango', width: 100 },
      { header: 'Actual', dataKey: 'actual', width: 60 },
      { header: 'Disponibles', dataKey: 'disponibles', width: 70 },
      { header: 'Uso %', dataKey: 'uso', width: 50 },
      { header: 'Sucursal', dataKey: 'sucursal', width: 100 },
      { header: 'Estado', dataKey: 'estado', width: 60 },
    ];
    const exportData = filteredSequences.map((seq) => ({
      prefijo: seq.prefix,
      descripcion: seq.description || '-',
      rango: `${seq.startRange.toLocaleString()} - ${seq.endRange.toLocaleString()}`,
      actual: seq.currentNumber.toLocaleString(),
      disponibles: seq.remaining.toLocaleString(),
      uso: `${seq.percentageUsed}%`,
      sucursal: seq.branch?.name || 'Todas',
      estado: seq.isActive ? 'Activa' : 'Inactiva',
    }));
    exportToPDF(exportData, columns, `Secuencias_NCF_${new Date().toISOString().split('T')[0]}`, 'Secuencias NCF', {
      title: 'Listado de Secuencias NCF',
      date: new Date().toLocaleDateString('es-DO'),
    });
    showToast('Exportación a PDF completada', 'success');
  };

  // Pagination
  const totalPages = Math.ceil(filteredSequences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSequences = filteredSequences.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de NCF</h2>
          <p className="text-sm text-gray-600 mt-1">Administre las secuencias de Números de Comprobante Fiscal</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingSequence(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Nueva Secuencia
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
                placeholder="Buscar por prefijo, descripción o sucursal..."
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
            {editingSequence ? 'Editar Secuencia NCF' : 'Nueva Secuencia NCF'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefijo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingSequence}
                >
                  <option value="FACE">FACE - Factura de Consumo Electrónica</option>
                  <option value="NCE">NCE - Nota de Crédito Electrónica</option>
                  <option value="NDE">NDE - Nota de Débito Electrónica</option>
                  <option value="FAC">FAC - Factura de Consumo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Secuencia principal 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rango Inicial <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.startRange}
                  onChange={(e) => setFormData({ ...formData, startRange: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rango Final <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.endRange}
                  onChange={(e) => setFormData({ ...formData, endRange: parseInt(e.target.value) || 1000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={formData.startRange + 1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Válido desde <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Válido hasta</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {editingSequence && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número Actual</label>
                <input
                  type="number"
                  value={formData.currentNumber}
                  onChange={(e) => setFormData({ ...formData, currentNumber: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min={formData.startRange - 1}
                  max={formData.endRange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajuste el número actual si necesita corregir la secuencia
                </p>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                {editingSequence ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSequence(null);
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

      {/* Lista de secuencias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando secuencias NCF...</p>
          </div>
        ) : filteredSequences.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron secuencias NCF' : 'No hay secuencias NCF configuradas'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefijo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rango</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponibles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSequences.map((sequence) => (
                    <tr key={sequence.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{sequence.prefix}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sequence.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sequence.startRange.toLocaleString()} - {sequence.endRange.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {sequence.currentNumber.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={sequence.remaining <= 100 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {sequence.remaining.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                sequence.percentageUsed >= 90
                                  ? 'bg-red-600'
                                  : sequence.percentageUsed >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(sequence.percentageUsed, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{sequence.percentageUsed}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sequence.branch?.name || 'Todas'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sequence)}`}
                        >
                          {sequence.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(sequence)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <HiPencil className="w-5 h-5" />
                          </button>
                          {sequence.isActive && (
                            <button
                              onClick={() => handleDelete(sequence.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
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
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSequences.length)} de {filteredSequences.length} secuencias
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

      {/* Alertas */}
      {sequences.some((s) => s.isActive && s.percentageUsed >= 90) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <HiExclamationCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Secuencias NCF con bajo stock</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Hay secuencias NCF con menos del 10% de números disponibles. Considere agregar nuevas secuencias.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NCFTab;
