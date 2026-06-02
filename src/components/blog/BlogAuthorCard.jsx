import { Link } from 'react-router-dom';

const GAU_AVATAR = '/images/about/gau.jpg';
const DEFAULT_BIO = 'Curating elegant, editable wedding stationery for modern couples.';

export default function BlogAuthorCard({
  brandName = 'The Lily Letters Co.',
  authorName = 'Gau Silva',
  bio,
  avatarUrl,
  tags = [],
}) {
  const displayBio = bio?.trim() || DEFAULT_BIO;
  const avatar = avatarUrl?.trim() || GAU_AVATAR;

  return (
    <aside
      className="mt-10 bg-white p-6 md:p-8 shadow-[0_4px_24px_-8px_rgba(76,34,51,0.1)] ring-1 ring-wine/5 text-left"
      aria-label="About the author"
    >
      <div className="flex items-start gap-5 md:gap-6">
        <img
          src={avatar}
          alt={`${authorName}, founder of ${brandName}`}
          width={80}
          height={80}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shrink-0 ring-2 ring-gold/40 ring-offset-2 ring-offset-white"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-script text-xl md:text-2xl text-gold leading-none">
            words by {authorName}
          </p>
          <p className="mt-3 font-display text-xl md:text-2xl font-light text-wine leading-tight">
            {brandName}
          </p>
          <p className="mt-2 font-body text-sm text-[#2d2020]/65 leading-relaxed max-w-xl">
            {displayBio}
          </p>
        </div>
      </div>

      {tags.length > 0 && (
        <ul
          className="mt-6 pt-5 border-t border-taupe/35 flex flex-wrap gap-2"
          aria-label="Article tags"
        >
          {tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                to={`/blog/tag/${tag.slug}`}
                className="inline-block px-3 py-1.5 rounded-full bg-cream text-xs font-body font-medium tracking-wide text-[#2d2020]/70 hover:bg-sage/15 hover:text-sage transition-colors"
              >
                #{tag.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
