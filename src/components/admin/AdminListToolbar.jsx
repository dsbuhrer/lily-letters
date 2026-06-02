import { Search } from 'lucide-react';

/**
 * @param {{ value: string, label: string }[]} sortOptions
 */
export default function AdminListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  sort,
  onSortChange,
  sortOptions,
  filteredCount,
  totalCount,
}) {
  const showCount = totalCount > 0;
  const countLabel =
    filteredCount !== totalCount
      ? `${filteredCount} of ${totalCount}`
      : `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" size={18} />
        <input
          type="search"
          className="input-field pl-10 w-full"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search list"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted shrink-0">
        <span className="sr-only">Sort by</span>
        <select className="input-field w-52" value={sort} onChange={(e) => onSortChange(e.target.value)}>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {showCount && <p className="text-sm text-ink-muted ml-auto tabular-nums">{countLabel}</p>}
    </div>
  );
}
