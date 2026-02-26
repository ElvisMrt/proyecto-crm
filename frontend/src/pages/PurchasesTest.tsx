import { useState } from 'react';
import api from '../services/api';

export default function PurchasesTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCreatePurchase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/purchases', {
        supplierId: '4d70459b-6f39-4bb4-90e6-5eaf0922206d',
        purchaseDate: new Date().toISOString().split('T')[0],
        total: 1500,
        notes: 'Compra de prueba desde interfaz',
        status: 'PENDING'
      });

      setResult({
        success: true,
        data: response.data
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
      setResult({
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetPurchases = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.get('/purchases');
      setResult({
        success: true,
        data: response.data
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
      setResult({
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Prueba de Módulo de Compras</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          <div className="space-x-4">
            <button
              onClick={testGetPurchases}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Listar Compras (GET)'}
            </button>
            <button
              onClick={testCreatePurchase}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Crear Compra (POST)'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {result.success ? '✅ Resultado Exitoso' : '❌ Error'}
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">ℹ️ Información</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Tenant: demo</li>
            <li>Proveedor ID: 4d70459b-6f39-4bb4-90e6-5eaf0922206d</li>
            <li>Backend: http://localhost:3001/api/v1</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
