export function normalizeSearch(query) {
  return query.trim().toLowerCase();
}

export function filterBySearch(items, query, getHaystack) {
  const needle = normalizeSearch(query);
  if (!needle) return items;
  return items.filter((item) =>
    getHaystack(item).some((part) => String(part ?? '').toLowerCase().includes(needle)),
  );
}

export function sortByKey(items, sortKey, comparators) {
  const compare = comparators[sortKey];
  if (!compare) return [...items];
  return [...items].sort(compare);
}
