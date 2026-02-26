import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiXCircle } from 'react-icons/hi';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface StandardAlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    message: 'text-green-700',
    IconComponent: HiCheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
    IconComponent: HiXCircle,
  },
  warning: {
    container: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-500',
    title: 'text-orange-800',
    message: 'text-orange-700',
    IconComponent: HiExclamationCircle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
    IconComponent: HiInformationCircle,
  },
};

export function StandardAlert({ type, title, message, onClose }: StandardAlertProps) {
  const styles = alertStyles[type];
  const Icon = styles.IconComponent;

  return (
    <div className={`border rounded-lg p-3 ${styles.container}`}>
      <div className="flex items-start space-x-2">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          {title && <p className={`text-xs font-medium ${styles.title}`}>{title}</p>}
          <p className={`text-xs ${styles.message} ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-70`}
          >
            <HiXCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Hook para mensajes toast
export function useToast() {
  const showToast = (type: AlertType, message: string) => {
    // Implementación simple con alert por ahora
    // Puede mejorarse con un sistema de toast más sofisticado
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    alert(`${icons[type]} ${message}`);
  };

  return {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message),
    info: (message: string) => showToast('info', message),
  };
}
