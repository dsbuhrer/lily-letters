import { Link } from 'react-router-dom';

export default function BlogCard({ post }) {
  const category = post.category?.name || post.categories?.name || 'Blog';
  return (
    <article className="group">
      <Link to={`/blog/${post.slug}`} className="block">
        {post.hero_image && (
          <img
            src={post.hero_image}
            alt={post.hero_alt || post.title}
            loading="lazy"
            width={800}
            height={450}
            className="w-full aspect-[16/9] object-cover mb-4 transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        <p className="section-subtitle mb-2">{category}</p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-wine group-hover:underline underline-offset-4">
          {post.title}
        </h2>
        <p className="mt-3 font-body text-sm text-[#2d2020]/70 leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>
        <p className="mt-3 text-xs text-[#2d2020]/50">
          {post.reading_time_minutes || 5} min read
        </p>
      </Link>
    </article>
  );
}
