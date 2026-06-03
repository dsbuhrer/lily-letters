import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ArticleCta() {
  return (
    <section className="mt-12 relative overflow-hidden bg-wine text-cream text-center p-10 md:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(151,129,82,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(107,112,80,0.15),transparent_50%)]" />
      <div className="relative z-10">
        <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-gold mb-3">
          Canva Templates
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-3 text-balance text-cream">
          Make it yours in Canva
        </h2>
        <p className="font-body text-sm text-cream/75 max-w-lg mx-auto mb-8 leading-relaxed">
          Download instantly, personalize every detail, and print beautiful wedding stationery without a designer.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-gold hover:bg-[#7a6a3e] text-cream px-8 py-3.5 text-xs font-body font-medium tracking-widest uppercase transition-all duration-300 hover:gap-3"
        >
          Shop wedding templates
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
