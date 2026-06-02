import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const styles = {
  success: {
    wrap: 'border-sage/50 bg-white shadow-panel',
    icon: CheckCircle2,
    iconClass: 'text-sage',
  },
  error: {
    wrap: 'border-red-300/70 bg-red-50/95 shadow-panel',
    icon: XCircle,
    iconClass: 'text-red-800',
  },
  info: {
    wrap: 'border-gold/45 bg-white shadow-panel',
    icon: Info,
    iconClass: 'text-gold',
  },
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-6 right-4 sm:right-6 z-[110] flex flex-col gap-3 max-w-sm w-[min(100vw-2rem,24rem)] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const s = styles[t.type] || styles.info;
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border px-4 py-3.5 animate-[toast-in_0.25s_ease-out] ${s.wrap}`}
            role="status"
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${s.iconClass}`} strokeWidth={1.5} />
            <p className="flex-1 font-body text-sm text-ink leading-snug">{t.message}</p>
            <button
              type="button"
              className="icon-btn shrink-0 -mr-1 text-ink-faint hover:text-wine"
              aria-label="Dismiss"
              onClick={() => onDismiss(t.id)}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
