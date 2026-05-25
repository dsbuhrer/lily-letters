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
      <div className="divide-y divide-taupe/50 border-t border-taupe/50">
        {faq.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              className="w-full flex items-center justify-between py-5 text-left gap-4"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
            >
              <span className="font-display text-lg text-wine">{item.question}</span>
              {open === i ? <Minus size={18} className="text-gold shrink-0" /> : <Plus size={18} className="text-gold shrink-0" />}
            </button>
            {open === i && (
              <p className="pb-5 font-body text-sm text-[#2d2020]/80 leading-relaxed pr-8">
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
