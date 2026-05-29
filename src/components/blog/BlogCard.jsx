import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';

export default function BlogCard({ post, featured = false }) {
  const category = post.category?.name || post.categories?.name || 'Blog';

  if (featured) {
    return (
      <article className="group relative overflow-hidden bg-white shadow-[0_8px_40px_-12px_rgba(76,34,51,0.18)] ring-1 ring-wine/5 transition-all duration-500 hover:shadow-[0_20px_60px_-16px_rgba(76,34,51,0.28)] hover:-translate-y-1">
        <Link to={`/blog/${post.slug}`} className="grid md:grid-cols-2">
          {post.hero_image && (
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
              <img
                src={post.hero_image}
                alt={post.hero_alt || post.title}
                loading="eager"
                width={800}
                height={500}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-wine/10" />
              <span className="absolute top-4 left-4 px-3 py-1 bg-cream/95 backdrop-blur-sm text-[11px] font-body font-medium tracking-widest uppercase text-wine">
                {category}
              </span>
            </div>
          )}
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
            <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-gold mb-3">
              Featured
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-wine leading-tight text-balance group-hover:text-[#3a1926] transition-colors">
              {post.title}
            </h2>
            <p className="mt-4 font-body text-sm text-[#2d2020]/65 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#2d2020]/45 font-body">
                <Clock size={13} strokeWidth={1.5} />
                {post.reading_time_minutes || 5} min read
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-body font-medium tracking-widest uppercase text-wine group-hover:gap-2 transition-all">
                Read article
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group h-full">
      <Link to={`/blog/${post.slug}`} className="flex flex-col h-full overflow-hidden bg-white shadow-[0_4px_24px_-8px_rgba(76,34,51,0.12)] ring-1 ring-wine/5 transition-all duration-400 hover:shadow-[0_12px_40px_-12px_rgba(76,34,51,0.22)] hover:-translate-y-0.5">
        {post.hero_image && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={post.hero_image}
              alt={post.hero_alt || post.title}
              loading="lazy"
              width={800}
              height={500}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-cream/95 backdrop-blur-sm text-[10px] font-body font-medium tracking-widest uppercase text-wine">
              {category}
            </span>
          </div>
        )}
        <div className="flex flex-col flex-1 p-5 md:p-6">
          <h2 className="font-display text-xl md:text-2xl font-light text-wine leading-snug text-balance group-hover:text-[#3a1926] transition-colors">
            {post.title}
          </h2>
          <p className="mt-2.5 font-body text-sm text-[#2d2020]/60 leading-relaxed line-clamp-2 flex-1">
            {post.excerpt}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#2d2020]/40 font-body">
            <Clock size={12} strokeWidth={1.5} />
            {post.reading_time_minutes || 5} min read
          </p>
        </div>
      </Link>
    </article>
  );
}
