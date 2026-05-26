import { useEffect, useState } from 'react';

export default function TableOfContents({ contentHtml }) {
  const [headings, setHeadings] = useState([]);

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

  if (headings.length < 2) return null;

  return (
    <aside className="mb-10 p-6 bg-white/60 border border-taupe/50">
      <p className="text-xs uppercase tracking-widest text-gold font-medium mb-4">In this article</p>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 'H3' ? 'pl-4' : ''}>
            <a href={`#${h.id}`} className="font-body text-sm text-wine hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
