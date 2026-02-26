import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import logoSrc from '../utils/3.svg';

// Icon wrapper for crisp rendering
const CrispIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={className} style={{ 
    shapeRendering: 'geometricPrecision',
    imageRendering: 'crisp-edges',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {children}
  </span>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-focus en el campo de email al cargar
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Validación de email en tiempo real
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError('Email inválido');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
    if (error) setError(''); // Limpiar error general al escribir
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(''); // Limpiar error general al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    
    // Validación básica
    if (!email || !password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    if (emailError) {
      setError('Por favor, corrija el email');
      return;
    }

    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/dashboard';
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        setTimeout(() => {
          document.getElementById('password')?.focus();
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" style={{ backgroundColor: '#1D79C4' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" style={{ backgroundColor: '#1f2937' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" style={{ backgroundColor: '#1D79C4' }}></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md px-8 py-10 relative z-10">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all duration-300 hover:shadow-3xl">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img src={logoSrc} alt="Neypier" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
              Bienvenido
            </h1>
            <p className="text-gray-500 text-sm">Inicia sesión en tu cuenta CRM</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm animate-fade-in shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CrispIcon className={`h-5 w-5 transition-colors duration-200 ${
                    emailError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#1D79C4]'
                  }`}>
                    <HiMail size={20} />
                  </CrispIcon>
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  disabled={loading}
                  className={`block w-full pl-12 pr-4 py-3.5 border-2 rounded-xl shadow-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 ${
                    emailError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-[#1D79C4]'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-300'}`}
                  placeholder="tu@correo.com"
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CrispIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#1D79C4] transition-colors duration-200">
                    <HiLockClosed size={20} />
                  </CrispIcon>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  className={`block w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl shadow-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#1D79C4] transition-all duration-200 ${
                    loading ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50 transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <CrispIcon className="h-5 w-5">
                      <HiEyeOff size={20} />
                    </CrispIcon>
                  ) : (
                    <CrispIcon className="h-5 w-5">
                      <HiEye size={20} />
                    </CrispIcon>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center group">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer transition-all duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors">
                  Recordarme
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !!emailError || !email || !password}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                style={{ 
                  backgroundColor: '#1D79C4',
                  boxShadow: loading || !!emailError || !email || !password 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    : '0 10px 25px -5px rgba(29, 121, 196, 0.5)',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !emailError && email && password) {
                    e.currentTarget.style.backgroundColor = '#1565a8';
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(29, 121, 196, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !emailError && email && password) {
                    e.currentTarget.style.backgroundColor = '#1D79C4';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(29, 121, 196, 0.5)';
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Iniciar Sesión
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
