import { useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamationCircle } from 'react-icons/hi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 4000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <HiCheckCircle className="w-5 h-5" />,
    error: <HiXCircle className="w-5 h-5" />,
    info: <HiInformationCircle className="w-5 h-5" />,
    warning: <HiExclamationCircle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 ${colors[type]} animate-slide-in-right min-w-[300px] max-w-md backdrop-blur-sm`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconColors[type]}`}>{icons[type]}</div>
      <p className="font-medium flex-1 text-sm">{message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${iconColors[type]} hover:opacity-70 transition-opacity focus:outline-none`}
        aria-label="Cerrar"
      >
        <HiXCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
