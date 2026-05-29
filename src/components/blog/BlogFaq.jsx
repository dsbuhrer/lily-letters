import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function BlogFaq({ faq = [] }) {
  const [open, setOpen] = useState(0);
  if (!faq.length) return null;

  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-display text-3xl text-wine mb-6">
        Frequently Asked Questions
      </h2>
      <div className="bg-white shadow-[0_4px_24px_-8px_rgba(76,34,51,0.08)] ring-1 ring-wine/5 overflow-hidden divide-y divide-taupe/30">
        {faq.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-wine/[0.02] transition-colors"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
            >
              <span className="font-display text-lg text-wine">{item.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                  open === i ? 'bg-wine text-cream' : 'bg-gold/10 text-gold'
                }`}
              >
                {open === i ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {open === i && (
              <p className="px-6 pb-5 font-body text-sm text-[#2d2020]/75 leading-relaxed">
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
