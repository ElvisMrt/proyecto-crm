import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff, HiLockClosed, HiMail } from 'react-icons/hi';
import axios from 'axios';
import logoSrc from '../utils/3.svg';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : 'http://localhost:3001/api/v1');

export default function SaaSLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
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

  const handleLogin = async (e: React.FormEvent) => {
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
      const response = await axios.post(
        `${API_BASE_URL}/saas/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = response.data;
      if (data.success) {
        localStorage.setItem('app_mode_override', 'saas');
        localStorage.setItem('saasToken', data.token);
        localStorage.setItem('saasUser', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setPasswordError(data.error?.message || 'Error al iniciar sesion');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Credenciales invalidas';
      setPasswordError(errorMsg);
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
                <img src={logoSrc} alt="Neypier" className="h-10 w-auto" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Acceso maestro</p>
                  <p className="text-sm font-semibold text-slate-950">SaaS Admin</p>
                </div>
              </div>

              <div className="mt-10 max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Panel central</p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950">
                  Opera tenants, billing y website desde una sola consola.
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Este acceso es exclusivo para administracion SaaS. Desde aqui controlas provisionamiento,
                  facturacion, productos publicos y acciones operativas sobre cada empresa.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Tenants', note: 'Provisioning y estado' },
                { label: 'Billing', note: 'Facturas y cobros' },
                { label: 'Website', note: 'Catalogo publico' },
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
              <img src={logoSrc} alt="Neypier" className="mb-5 h-11 w-auto" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Autenticacion</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-slate-500">Usa tu cuenta de super administrador para entrar al panel maestro.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <HiMail className={`h-5 w-5 ${emailError ? 'text-rose-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => email && validateEmail(email)}
                    className={`block w-full rounded-2xl border py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition ${
                      emailError
                        ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                    }`}
                    placeholder="tu@correo.com"
                  />
                </div>
                {emailError ? <p className="mt-1.5 text-sm text-rose-600">{emailError}</p> : null}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contrasena
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <HiLockClosed className={`h-5 w-5 ${passwordError ? 'text-rose-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`block w-full rounded-2xl border py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition ${
                      passwordError
                        ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError ? <p className="mt-1.5 text-sm text-rose-600">{passwordError}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Iniciando sesion...' : 'Entrar al panel'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Sistema CRM Multi-Tenant © {new Date().getFullYear()}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
