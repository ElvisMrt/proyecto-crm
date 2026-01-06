import { useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamation } from 'react-icons/hi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
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
    warning: <HiExclamation className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${colors[type]} animate-slide-in`}
      role="alert"
    >
      <div className={iconColors[type]}>{icons[type]}</div>
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className={`ml-2 ${iconColors[type]} hover:opacity-70 transition-opacity`}
        aria-label="Cerrar"
      >
        <HiXCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;


