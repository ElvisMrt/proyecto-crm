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
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
              {confirmState.title}
            </h3>
            <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {confirmState.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {confirmState.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors ${
                  confirmState.type === 'danger'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : confirmState.type === 'warning'
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-slate-900 hover:bg-slate-800'
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
