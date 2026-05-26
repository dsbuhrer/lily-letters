import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import ToastStack from '../components/ui/ToastStack';

const UiFeedbackContext = createContext(null);

export function UiFeedbackProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const confirmResolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({
        title: options.title ?? 'Confirm',
        message: options.message ?? '',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        variant: options.variant ?? 'default',
      });
    });
  }, []);

  const closeConfirm = useCallback((result) => {
    setConfirmState(null);
    const resolve = confirmResolver.current;
    confirmResolver.current = null;
    resolve?.(result);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'success', duration = 4500) => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, duration) => pushToast(message, 'success', duration),
      error: (message, duration) => pushToast(message, 'error', duration),
      info: (message, duration) => pushToast(message, 'info', duration),
    }),
    [pushToast],
  );

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}
      {confirmState && (
        <ConfirmModal
          {...confirmState}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </UiFeedbackContext.Provider>
  );
}

export function useUiFeedback() {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) {
    throw new Error('useUiFeedback must be used within UiFeedbackProvider');
  }
  return ctx;
}
