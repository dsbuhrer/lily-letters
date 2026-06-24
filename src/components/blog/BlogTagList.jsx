import { Link } from 'react-router-dom';

export default function BlogTagList({ tags = [], className = '', heading = 'Topics' }) {
  if (!tags.length) return null;

  return (
    <nav className={className} aria-label="Article topics">
      {heading && (
        <p className="text-[11px] font-body font-medium tracking-widest uppercase text-ink-subtle mb-3">
          {heading}
        </p>
      )}
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              to={`/blog/tag/${tag.slug}`}
              rel="tag"
              className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-body font-medium tracking-wide text-ink-muted shadow-sm ring-1 ring-wine/5 hover:bg-sage/15 hover:text-sage hover:ring-sage/20 transition-colors"
            >
              {tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
