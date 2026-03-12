import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff, HiLockClosed, HiMail } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import logoSrc from '../utils/3.svg';
import { getTenantSubdomain } from '../services/tenant.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError('Ingresa un email valido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Ingresa tu email');
      return;
    }

    if (!validateEmail(email)) return;

    if (!password) {
      setPasswordError('Ingresa tu contrasena');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      localStorage.setItem('app_mode_override', 'crm');
      const tenant = getTenantSubdomain();
      const params = new URLSearchParams();
      params.set('mode', 'crm');
      if (tenant) {
        params.set('tenant', tenant);
      }
      window.location.href = `/dashboard?${params.toString()}`;
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'MAINTENANCE_MODE' || code === 'TENANT_SUSPENDED' || code === 'TENANT_CANCELLED') {
        sessionStorage.setItem('tenantStatus', code);
        sessionStorage.setItem('tenantMessage', err.response?.data?.error?.message || '');
        navigate('/status');
        return;
      }
      setPasswordError(err.response?.data?.error?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <img src={logoSrc} alt="Neypier CRM" className="h-10 w-auto" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Acceso operativo</p>
                  <p className="text-sm font-semibold text-slate-950">CRM Tenant</p>
                </div>
              </div>

              <div className="mt-10 max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Panel de trabajo</p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950">
                  Opera ventas, caja, CxC, inventario y reportes desde una sola vista.
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Este acceso pertenece al CRM operativo de tu empresa. Desde aqui gestionas la operación diaria,
                  clientes, cobros, citas, compras y configuracion del negocio.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Ventas', note: 'POS, facturas y cobros' },
                { label: 'Caja', note: 'Apertura, movimientos y cierre' },
                { label: 'Reportes', note: 'Lectura operativa y financiera' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-8">
              <img src={logoSrc} alt="Neypier CRM" className="mb-5 h-11 w-auto" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Autenticacion</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-slate-500">Usa tu cuenta del tenant para entrar al CRM operativo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Correo electronico</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <HiMail className={`h-5 w-5 ${emailError ? 'text-rose-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    ref={emailInputRef}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => email && validateEmail(email)}
                    disabled={loading}
                    placeholder="tu@correo.com"
                    className={`w-full rounded-2xl border py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      emailError
                        ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {emailError ? <p className="mt-1.5 text-sm text-rose-600">{emailError}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Contrasena</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <HiLockClosed className={`h-5 w-5 ${passwordError ? 'text-rose-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    disabled={loading}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      passwordError
                        ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError ? <p className="mt-1.5 text-sm text-rose-600">{passwordError}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Iniciando sesion...' : 'Entrar al CRM'}
              </button>

              <div className="text-center">
                <a href="/forgot-password?mode=crm" className="text-sm font-medium text-slate-500 transition hover:text-slate-900 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Sistema CRM Multi-Tenant © {new Date().getFullYear()}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
