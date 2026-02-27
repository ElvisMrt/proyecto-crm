import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getTenantSubdomain } from '../services/tenant.service';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : 'http://localhost:3001/api/v1');

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');
  const subdomain = getTenantSubdomain();

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación inválido o faltante. Solicita un nuevo enlace.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        { token, password },
        subdomain ? { headers: { 'X-Tenant-Subdomain': subdomain } } : {}
      );
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
            <p className="text-blue-100 text-sm mt-1">Elige una contraseña segura</p>
          </div>

          <div className="px-8 py-8">
            {done ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Tu contraseña ha sido restablecida exitosamente.
                  Serás redirigido al inicio de sesión en unos segundos.
                </p>
                <Link to="/login" className="text-blue-600 hover:underline text-sm font-medium">
                  Ir al inicio de sesión →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                    {!token && (
                      <div className="mt-2">
                        <Link to="/forgot-password" className="underline font-medium">
                          Solicitar nuevo enlace
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {token && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoFocus
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-12"
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {password.length > 0 && password.length < 6 && (
                        <p className="text-xs text-orange-600 mt-1">Mínimo 6 caracteres</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar contraseña
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Repite la contraseña"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                      {confirm.length > 0 && password !== confirm && (
                        <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || password.length < 6 || password !== confirm}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm
                        hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Actualizando...
                        </span>
                      ) : 'Actualizar contraseña'}
                    </button>
                  </>
                )}

                <div className="text-center">
                  <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                    ← Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
