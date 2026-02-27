/**
 * Servicio de detección de tenant basado en el subdominio/URL
 * Detecta automáticamente el tenant según la URL actual
 */

const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // 1. Query param ?tenant=slug (para acceso por IP sin dominio)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    localStorage.setItem('tenant_subdomain', tenantParam);
    return tenantParam;
  }

  // 2. Localhost testing: tenant.localhost:5173
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // Sin subdomain en localhost = SaaS admin o usar localStorage
  }

  // 3. IP pura (sin dominio): usar localStorage
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null; // IP pura = sin subdomain detectable
  }

  // 4. Subdominio real: tenant.dominio.com
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
};

export const getTenantSubdomain = (): string | null => {
  const subdomain = getSubdomain();

  if (subdomain) return subdomain;

  // Fallback: localStorage (guardado por ?tenant= o login previo)
  if (typeof window !== 'undefined') {
    const storedTenant = localStorage.getItem('tenant_subdomain');
    if (storedTenant) return storedTenant;
  }

  return null;
};

/**
 * Determina si estamos en el panel de administración SaaS
 */
export const isSaaSAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname;
  const subdomain = getTenantSubdomain(); // Usar getTenantSubdomain() que incluye localStorage

  // URL path starts with /saas OR no subdomain = SaaS admin
  return pathname.startsWith('/saas') || subdomain === null;
};

/**
 * Obtiene la URL del backend API
 */
export const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3001/api/v1';
};
