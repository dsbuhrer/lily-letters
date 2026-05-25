import { Link } from 'react-router-dom';

export default function ArticleCta() {
  return (
    <section className="mt-12 p-10 bg-wine text-cream text-center">
      <h2 className="font-display text-3xl font-light mb-3">Make it yours in Canva</h2>
      <p className="font-body text-sm text-cream/80 max-w-lg mx-auto mb-6">
        Download instantly, personalize every detail, and print beautiful wedding stationery without a designer.
      </p>
      <Link to="/products" className="inline-flex items-center justify-center bg-gold hover:bg-[#7a6a3e] text-cream px-8 py-3 text-xs font-body font-medium tracking-widest uppercase transition-colors">
        Shop wedding templates
      </Link>
    </section>
  );
}
