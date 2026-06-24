import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../lib/api';
import { normalizeTags } from '../../lib/blogTags';

const MAX_SUGGESTIONS = 10;

export default function BlogTagInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const tags = normalizeTags(value);

  useEffect(() => {
    api.admin.tags().then((res) => setAllTags(res.tags || [])).catch(() => setAllTags([]));
  }, []);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    return allTags
      .filter((s) => !tags.some((t) => t.slug === s.slug))
      .filter((s) => {
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.slug.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [allTags, tags, input]);

  useEffect(() => {
    setHighlight(0);
  }, [input, filtered.length]);

  const addRaw = (raw) => {
    const trimmed = String(raw).trim();
    if (!trimmed) return;
    const next = normalizeTags([...value, trimmed]).map((t) => t.name);
    onChange(next);
    setInput('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (slug) => {
    onChange(tags.filter((t) => t.slug !== slug).map((t) => t.name));
  };

  const selectHighlighted = () => {
    if (filtered[highlight]) {
      addRaw(filtered[highlight].name);
    } else if (input.trim()) {
      addRaw(input);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (open && filtered.length > 0) {
        selectHighlighted();
      } else {
        addRaw(input);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      remove(tags[tags.length - 1].slug);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showSuggestions = open && filtered.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="mt-1 min-h-[42px] flex flex-wrap items-center gap-2 px-3 py-2 bg-white border border-taupe/60 focus-within:border-wine/40 focus-within:ring-1 focus-within:ring-wine/20">
        {tags.map((tag) => (
          <span
            key={tag.slug}
            className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-cream text-xs font-body text-ink-muted rounded-full ring-1 ring-taupe/40"
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => remove(tag.slug)}
              className="p-0.5 rounded-full hover:bg-wine/10 hover:text-wine"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? 'Type to search tags…' : 'Type or pick a tag…'}
          className="flex-1 min-w-[140px] text-sm font-body bg-transparent focus:outline-none placeholder:text-ink-faint"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="blog-tag-suggestions"
        />
      </div>

      {showSuggestions && (
        <ul
          id="blog-tag-suggestions"
          role="listbox"
          className="absolute left-0 right-0 mt-1 border border-taupe/50 bg-white shadow-lg max-h-48 overflow-y-auto z-30"
        >
          {!input.trim() && (
            <li className="px-3 py-2 text-[10px] uppercase tracking-widest text-ink-faint border-b border-taupe/30">
              Existing tags
            </li>
          )}
          {filtered.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2.5 text-sm font-body flex justify-between gap-2 transition-colors ${
                  i === highlight ? 'bg-cream text-wine' : 'hover:bg-cream/70 text-ink'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => addRaw(s.name)}
              >
                <span>{s.name}</span>
                <span className="text-xs text-ink-faint font-mono shrink-0">{s.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && input.trim() && filtered.length === 0 && (
        <p className="absolute left-0 right-0 mt-1 px-3 py-2 text-xs font-body text-ink-muted bg-white border border-taupe/50 shadow-md z-30">
          No matching tags — press Enter to create &ldquo;{input.trim()}&rdquo;
        </p>
      )}

      <p className="mt-1.5 text-xs text-ink-faint leading-relaxed">
        Start typing to see suggestions from existing tags. Click a suggestion or press Enter to add.
        Remove a tag with the × button on each chip.
      </p>
    </div>
  );
}
