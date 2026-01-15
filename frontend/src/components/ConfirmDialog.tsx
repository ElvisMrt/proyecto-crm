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
        return <HiXCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <HiInformationCircle className="w-6 h-6 text-blue-500" />;
      case 'success':
        return <HiCheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <HiExclamationCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      case 'info':
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      ></div>

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0" aria-hidden="true">{getIcon()}</div>
              <div className="ml-4 flex-1">
                <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p id="confirm-dialog-description" className="text-sm text-gray-600">{message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${buttonColors.cancel}`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColors.confirm}`}
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

