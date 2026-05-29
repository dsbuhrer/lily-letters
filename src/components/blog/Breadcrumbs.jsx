import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items, light = false }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs uppercase tracking-widest mb-6 ${
        light ? 'text-cream/50' : 'text-[#2d2020]/45'
      }`}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className={light ? 'text-cream/30' : 'text-[#2d2020]/25'}>/</span>}
            {i === items.length - 1 ? (
              <span className={light ? 'text-cream/90' : 'text-wine'}>{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className={`transition-colors ${
                  light ? 'hover:text-cream' : 'hover:text-wine'
                }`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
