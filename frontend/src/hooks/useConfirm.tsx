import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

interface ConfirmContextType {
  showConfirm: (title: string, message: string, onConfirm: () => void, options?: Partial<ConfirmOptions>) => void;
  hideConfirm: () => void;
  confirmState: ConfirmOptions | null;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: Partial<ConfirmOptions>
  ) => {
    setConfirmState({
      title,
      message,
      onConfirm,
      onCancel: options?.onCancel,
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar',
      type: options?.type || 'info',
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState?.onConfirm) {
      confirmState.onConfirm();
    }
    hideConfirm();
  }, [confirmState, hideConfirm]);

  const handleCancel = useCallback(() => {
    if (confirmState?.onCancel) {
      confirmState.onCancel();
    }
    hideConfirm();
  }, [confirmState, hideConfirm]);

  return (
    <ConfirmContext.Provider value={{ showConfirm, hideConfirm, confirmState }}>
      {children}
      {confirmState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmState.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {confirmState.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmState.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  confirmState.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};
