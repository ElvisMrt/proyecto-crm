import { useEffect, useState } from 'react';
import { inventoryApi } from '../../services/api';
import { branchesApi } from '../../services/api';
import { HiOfficeBuilding, HiRefresh, HiCalendar, HiSearch, HiX, HiArrowUp, HiArrowDown } from 'react-icons/hi';

const MovementsTab = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    branchId: '',
    type: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchMovements();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [filters.page, filters.productId, filters.branchId, filters.type, filters.startDate, filters.endDate]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response?.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProducts = async (search: string) => {
    if (search.length < 2) {
      setProducts([]);
      return;
    }
    try {
      const response = await inventoryApi.getProducts({ search, limit: 10 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.productId) params.productId = filters.productId;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await inventoryApi.getMovements(params);
      setMovements(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALE: 'Venta',
      ADJUSTMENT_ENTRY: 'Ajuste Entrada',
      ADJUSTMENT_EXIT: 'Ajuste Salida',
      CREDIT_NOTE: 'Nota de Crédito',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'SALE' || type === 'ADJUSTMENT_EXIT') {
      return <HiArrowDown className="w-4 h-4 text-red-600" />;
    }
    return <HiArrowUp className="w-4 h-4 text-green-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiOfficeBuilding className="w-4 h-4 mr-1 text-gray-400" />
              Sucursal
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiSearch className="w-4 h-4 mr-1 text-gray-400" />
              Producto
            </label>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                if (e.target.value === '') {
                  setFilters({ ...filters, productId: '', page: 1 });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {productSearch && (
              <button
                onClick={() => {
                  setProductSearch('');
                  setFilters({ ...filters, productId: '', page: 1 });
                  setProducts([]);
                }}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
            {products.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setFilters({ ...filters, productId: product.id, page: 1 });
                      setProductSearch(product.name);
                      setProducts([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiRefresh className="w-4 h-4 mr-1 text-gray-400" />
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="SALE">Venta</option>
              <option value="ADJUSTMENT_ENTRY">Ajuste Entrada</option>
              <option value="ADJUSTMENT_EXIT">Ajuste Salida</option>
              <option value="CREDIT_NOTE">Nota de Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiCalendar className="w-4 h-4 mr-1 text-gray-400" />
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiCalendar className="w-4 h-4 mr-1 text-gray-400" />
              Hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchMovements}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
            >
              <HiSearch className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              onClick={() => {
                setFilters({
                  productId: '',
                  branchId: '',
                  type: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 20,
                });
                setProductSearch('');
                setProducts([]);
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md flex items-center"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay movimientos</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(movement.movementDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                        <div className="text-xs text-gray-500">{movement.product.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium flex items-center text-gray-500">
                          {getTypeIcon(movement.type)}
                          <span className="ml-1">{getTypeLabel(movement.type)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.branch?.name || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {movement.balance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.user?.name || '-'}
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
                  {pagination.total} movimientos
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

export default MovementsTab;



