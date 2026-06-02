import { Loader2 } from 'lucide-react';

export function BlogLoadingIndicator({ label = 'Loading' }) {
  return (
    <div
      className="flex justify-center mb-10 blog-loader-enter"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="inline-flex items-center gap-3 px-5 py-2.5 border border-taupe/50 bg-white/60 shadow-sm">
        <Loader2
          size={20}
          strokeWidth={1.5}
          className="text-wine blog-loader-spin"
          aria-hidden
        />
        <span className="font-body text-xs tracking-[0.2em] uppercase text-ink-muted">
          {label}
        </span>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = '', style }) {
  return (
    <div
      className={`skeleton-shimmer border border-taupe/20 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function BlogCategoriesSkeleton() {
  return (
    <div className="blog-loader-enter" style={{ animationDelay: '0.05s' }}>
      <nav
        aria-label="Loading categories"
        aria-busy="true"
        className="flex flex-wrap justify-center gap-2 mb-14"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className="h-9 w-28"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </nav>
    </div>
  );
}

function SidebarListSkeleton({ titleWidth = 'w-24' }) {
  return (
    <div aria-hidden className="blog-loader-enter" style={{ animationDelay: '0.1s' }}>
      <SkeletonBlock className={`h-6 ${titleWidth} mb-4`} />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <SkeletonBlock className="h-4 w-full" style={{ animationDelay: `${0.15 + i * 0.08}s` }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlogPostsSkeleton() {
  return (
    <div className="blog-loader-enter" style={{ animationDelay: '0.08s' }}>
      <div
        className="grid lg:grid-cols-3 gap-10 mb-16"
        aria-busy="true"
        aria-label="Loading articles"
      >
        <aside className="lg:col-span-1 space-y-10">
          <SidebarListSkeleton titleWidth="w-28" />
          <SidebarListSkeleton titleWidth="w-32" />
        </aside>
        <section className="lg:col-span-2 space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <article
              key={i}
              className="blog-loader-enter"
              style={{ animationDelay: `${0.12 + i * 0.1}s` }}
              aria-hidden
            >
              <SkeletonBlock className="w-full aspect-[16/9] mb-4" />
              <SkeletonBlock className="h-3 w-16 mb-2" />
              <SkeletonBlock className="h-8 w-4/5 max-w-md mb-3" />
              <SkeletonBlock className="h-4 w-full mb-2" />
              <SkeletonBlock className="h-4 w-2/3 mb-3" />
              <SkeletonBlock className="h-3 w-20" />
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
