/**
 * Servicio de detección de tenant basado en el subdominio/URL
 * Detecta automáticamente el tenant según la URL actual
 */

const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // Localhost testing
  if (hostname.includes('localhost')) {
    // Format: tenant.localhost:5173
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]; // Permitir localhost como subdominio válido
    }
    return null; // No subdomain = SaaS admin
  }

  // Production domain (neypier.com)
  // Format: tenant.neypier.com
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // tenant.neypier.com → parts = ['tenant', 'neypier', 'com']
    return parts[0];
  }

  return null;
};

export const getTenantSubdomain = (): string | null => {
  const subdomain = getSubdomain();
  
  // Si no hay subdomain, intentar obtener del localStorage (para desarrollo en localhost)
  if (!subdomain && typeof window !== 'undefined') {
    const storedTenant = localStorage.getItem('tenant_subdomain');
    if (storedTenant) {
      return storedTenant;
    }
    
    // Para desarrollo en localhost sin subdomain, usar 'neypier' por defecto
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'neypier';
    }
  }
  
  return subdomain;
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
