import { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';
import ConfirmDialog, { ConfirmType } from '../components/ConfirmDialog';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: ConfirmType;
      confirmText?: string;
      cancelText?: string;
    }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ConfirmType;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const hideToast = () => {
    setToast(null);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: ConfirmType;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      type: options?.type || 'warning',
      confirmText: options?.confirmText || 'Aceptar',
      cancelText: options?.cancelText || 'Cancelar',
      onConfirm: () => {
        setConfirm(null);
        onConfirm();
      },
    });
  };

  const handleCancel = () => {
    setConfirm(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      {confirm && (
        <ConfirmDialog
          isOpen={confirm.isOpen}
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          onConfirm={confirm.onConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
};
