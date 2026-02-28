import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/v1` : 'http://localhost:3001/api/v1');

type StatusType = 'MAINTENANCE_MODE' | 'TENANT_SUSPENDED' | 'TENANT_CANCELLED' | 'TENANT_NOT_FOUND' | null;

export default function TenantStatus() {
  const [status, setStatus] = useState<StatusType>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Intentar un ping al backend para obtener el estado real
    fetch(`${API_BASE_URL}/auth/status`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setStatus(data?.error?.code || 'TENANT_NOT_FOUND');
          setMessage(data?.error?.message || '');
        }
      })
      .catch(() => {
        setStatus('TENANT_NOT_FOUND');
      });

    // También leer el estado del sessionStorage si fue guardado por el Login
    const savedStatus = sessionStorage.getItem('tenantStatus') as StatusType;
    const savedMessage = sessionStorage.getItem('tenantMessage') || '';
    if (savedStatus) {
      setStatus(savedStatus);
      setMessage(savedMessage);
    }
  }, []);

  if (status === 'MAINTENANCE_MODE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-3">Sistema en Mantenimiento</h1>
          <p className="text-yellow-700 mb-6">
            {message || 'Estamos realizando mejoras en el sistema. Por favor intenta más tarde.'}
          </p>
          <p className="text-sm text-yellow-600">Tiempo estimado: pocos minutos</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (status === 'TENANT_SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-3">Cuenta Suspendida</h1>
          <p className="text-red-700 mb-6">
            {message || 'Esta cuenta ha sido suspendida. Contacta al administrador para más información.'}
          </p>
          <p className="text-sm text-gray-500">Si crees que es un error, contacta a soporte.</p>
        </div>
      </div>
    );
  }

  if (status === 'TENANT_CANCELLED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Cuenta Cancelada</h1>
          <p className="text-gray-600 mb-6">
            {message || 'Esta cuenta ha sido cancelada.'}
          </p>
        </div>
      </div>
    );
  }

  // Estado genérico / cargando
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Verificando estado del sistema...</p>
      </div>
    </div>
  );
}
