import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const styles = {
  success: {
    wrap: 'border-sage/40 bg-cream',
    icon: CheckCircle2,
    iconClass: 'text-sage',
  },
  error: {
    wrap: 'border-red-300/60 bg-red-50/90',
    icon: XCircle,
    iconClass: 'text-red-700',
  },
  info: {
    wrap: 'border-gold/40 bg-cream',
    icon: Info,
    iconClass: 'text-gold',
  },
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 max-w-sm w-[min(100vw-2rem,24rem)] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const s = styles[t.type] || styles.info;
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border px-4 py-3 shadow-lg animate-[toast-in_0.25s_ease-out] ${s.wrap}`}
            role="status"
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${s.iconClass}`} strokeWidth={1.5} />
            <p className="flex-1 font-body text-sm text-[#2d2020] leading-snug">{t.message}</p>
            <button
              type="button"
              className="shrink-0 p-0.5 text-[#2d2020]/40 hover:text-wine"
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
