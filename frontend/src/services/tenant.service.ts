/**
 * Servicio de detección de tenant basado en el subdominio/URL
 *
 * Soporta:
 *   - nip.io:        neypier.66.94.111.139.nip.io  → subdomain = "neypier"
 *   - dominio real:  neypier.midominio.com          → subdomain = "neypier"
 *   - localhost dev: localStorage / query param     → subdomain = valor guardado
 *   - IP pura:       query param ?tenant=slug        → subdomain = slug
 *
 * Subdominio "admin" siempre va al panel SaaS.
 */

const detectSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // 1. Query param ?tenant=slug (override manual, útil en IP pura y dev)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    localStorage.setItem('tenant_subdomain', tenantParam);
    return tenantParam;
  }

  // 2. IP pura (sin dominio): no hay subdominio detectable
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // 3. localhost: sin subdomain real
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // 4. nip.io: slug.A.B.C.D.nip.io
  //    e.g. neypier.66.94.111.139.nip.io
  const nipIoMatch = hostname.match(/^([^.]+)\.\d+\.\d+\.\d+\.\d+\.nip\.io$/);
  if (nipIoMatch) {
    return nipIoMatch[1];
  }

  // 5. neypier.com raíz y www → admin (panel SaaS)
  if (hostname === 'neypier.com' || hostname === 'www.neypier.com') {
    return 'admin';
  }

  // 6. slug.neypier.com → subdominio del tenant
  const neypierMatch = hostname.match(/^([^.]+)\.neypier\.com$/);
  if (neypierMatch) {
    return neypierMatch[1];
  }

  // 7. Dominio real genérico con subdominio: slug.dominio.tld
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
};

export const getTenantSubdomain = (): string | null => {
  const subdomain = detectSubdomain();
  if (subdomain) return subdomain;

  // Fallback a localStorage (guardado en sesión previa)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tenant_subdomain');
    if (stored) return stored;
  }

  return null;
};

/**
 * Limpia el tenant guardado en localStorage (logout)
 */
export const clearTenantSubdomain = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tenant_subdomain');
  }
};

/**
 * Determina si estamos en el panel SaaS Admin.
 * Subdominio "admin" o ausencia de subdominio = panel SaaS.
 */
export const isSaaSAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;

  const subdomain = getTenantSubdomain();

  // Sin subdominio = panel SaaS (acceso por IP pura o localhost)
  if (subdomain === null) return true;

  // Subdominio "admin" = panel SaaS
  if (subdomain === 'admin') return true;

  return false;
};

/**
 * Obtiene la URL del backend API
 */
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
};
