import { useEffect } from 'react';

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}) {
  const isDanger = variant === 'danger';

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2d2020]/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-cream border border-taupe shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-taupe/60">
          <h2 id="confirm-modal-title" className="font-display text-2xl text-wine">
            {title}
          </h2>
          {message && (
            <p className="mt-3 font-body text-sm text-[#2d2020]/70 leading-relaxed">{message}</p>
          )}
        </div>
        <div className="p-4 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-ghost text-xs py-2" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              isDanger
                ? 'inline-flex items-center justify-center px-8 py-3 text-sm font-body font-medium tracking-widest uppercase bg-red-700 text-cream hover:bg-red-800 transition-colors'
                : 'btn-primary text-xs py-2.5'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
