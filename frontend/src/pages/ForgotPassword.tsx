import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getTenantSubdomain } from '../services/tenant.service';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : 'http://localhost:3001/api/v1');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const subdomain = getTenantSubdomain();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { email },
        subdomain ? { headers: { 'X-Tenant-Subdomain': subdomain } } : {}
      );
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al procesar la solicitud');
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
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
            <p className="text-blue-100 text-sm mt-1">
              Te enviaremos instrucciones a tu email
            </p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">¡Email enviado!</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Si el email <strong>{email}</strong> está registrado, recibirás un enlace
                  para restablecer tu contraseña. Revisa también tu carpeta de spam.
                </p>
                <p className="text-xs text-gray-400 mb-6">El enlace expira en 1 hora.</p>
                <Link to="/login"
                  className="text-blue-600 hover:underline text-sm font-medium">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-gray-600">
                  Ingresa el email de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm
                    hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Enviando...
                    </span>
                  ) : 'Enviar instrucciones'}
                </button>

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
