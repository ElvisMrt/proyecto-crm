import { useEffect } from 'react';
import { HiExclamationCircle, HiCheckCircle, HiXCircle, HiInformationCircle } from 'react-icons/hi';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <HiXCircle className="h-6 w-6 text-rose-600 dark:text-rose-300" />;
      case 'warning':
        return <HiExclamationCircle className="h-6 w-6 text-amber-600 dark:text-amber-300" />;
      case 'info':
        return <HiInformationCircle className="h-6 w-6 text-slate-700 dark:text-slate-200" />;
      case 'success':
        return <HiCheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />;
      default:
        return <HiExclamationCircle className="h-6 w-6 text-amber-600 dark:text-amber-300" />;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-500',
          cancel: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        };
      case 'warning':
        return {
          confirm: 'bg-amber-700 hover:bg-amber-800 focus:ring-amber-500',
          cancel: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        };
      case 'info':
        return {
          confirm: 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
          cancel: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        };
      case 'success':
        return {
          confirm: 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-500',
          cancel: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        };
      default:
        return {
          confirm: 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
          cancel: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100',
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <div 
      className="fixed inset-0 z-[220] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      ></div>

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-950"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0" aria-hidden="true">{getIcon()}</div>
              <div className="ml-4 flex-1">
                <h3 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
                <p id="confirm-dialog-description" className="text-sm leading-6 text-slate-600 dark:text-slate-400">{message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${buttonColors.cancel}`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${buttonColors.confirm}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
