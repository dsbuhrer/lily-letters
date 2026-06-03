import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export default function TableOfContents({ contentHtml, sticky = false }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const div = document.createElement('div');
    div.innerHTML = contentHtml || '';
    const found = [];
    div.querySelectorAll('h2, h3').forEach((el) => {
      const id = el.id || el.textContent?.trim().toLowerCase().replace(/\s+/g, '-');
      if (!id) return;
      found.push({ id, text: el.textContent, level: el.tagName });
    });
    setHeadings(found);
  }, [contentHtml]);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="In this article"
      className={`bg-white p-5 shadow-[0_4px_24px_-8px_rgba(76,34,51,0.1)] ring-1 ring-wine/5 ${
        sticky ? 'sticky top-28 z-10' : 'mb-8'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-7 w-7 items-center justify-center bg-gold/10 text-gold">
          <List size={14} strokeWidth={1.5} />
        </span>
        <p className="text-xs uppercase tracking-widest text-gold font-medium">In this article</p>
      </div>
      <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto no-scrollbar">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 'H3' ? 'pl-3' : ''}>
            <a
              href={`#${h.id}`}
              className={`block py-1.5 px-2 font-body text-sm leading-snug transition-colors ${
                activeId === h.id
                  ? 'bg-wine/5 text-wine font-medium'
                  : 'text-ink-muted hover:text-wine hover:bg-wine/[0.03]'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
