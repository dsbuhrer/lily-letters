import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';

export default function ShopTheLook({ products = [] }) {
  if (!products.length) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl text-wine mb-2">Shop the look</h2>
      <p className="font-body text-sm text-[#2d2020]/60 mb-6">
        Editable Canva templates to match this inspiration.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/products" className="btn-secondary">
          Browse all templates
        </Link>
      </div>
    </section>
  );
}
