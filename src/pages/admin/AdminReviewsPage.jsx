import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const REVIEW_SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'rating_desc', label: 'Highest rating' },
  { value: 'rating_asc', label: 'Lowest rating' },
];

const reviewComparators = {
  created_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  created_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  rating_desc: (a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt),
  rating_asc: (a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt),
};

function Stars({ rating }) {
  return (
    <span className="inline-flex" aria-label={`${rating} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={0}
          fill={i < rating ? '#978152' : '#d4cbc4'}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { confirm, toast } = useUiFeedback();
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin
      .reviews()
      .then((r) => setReviews(r.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const matched = filterBySearch(reviews, search, (review) => [
      review.productName,
      review.authorName,
      review.authorEmail,
      review.body,
      review.orderNumber,
    ]);
    return sortByKey(matched, sort, reviewComparators);
  }, [reviews, search, sort]);

  const remove = async (review) => {
    const ok = await confirm({
      title: 'Delete review?',
      message: review.productName
        ? `Remove the ${review.rating}-star review for “${review.productName}” by ${review.authorName}? This cannot be undone.`
        : 'This review will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteReview(review.id);
      setReviews((list) => list.filter((r) => r.id !== review.id));
      toast.success('Review deleted.');
    } catch (e) {
      toast.error(e.message || 'Could not delete review.');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-lead mt-1">
            Customer reviews from post-purchase invites. Deleting recalculates product ratings.
          </p>
        </div>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product, author, email, order…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={REVIEW_SORT_OPTIONS}
        filteredCount={filtered.length}
        totalCount={reviews.length}
      />

      <div className="table-shell overflow-x-auto">
        {loading ? (
          <p className="data-table-empty">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="data-table-empty">
            {reviews.length === 0 ? 'No reviews yet.' : 'No reviews match your search.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Rating</th>
                <th>Author</th>
                <th>Review</th>
                <th>Order</th>
                <th>Date</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <tr key={review.id}>
                  <td>
                    {review.productSlug ? (
                      <Link
                        to={`/products/${review.productSlug}`}
                        className="text-wine hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {review.productName}
                      </Link>
                    ) : (
                      review.productName
                    )}
                  </td>
                  <td>
                    <Stars rating={review.rating} />
                  </td>
                  <td>
                    <div className="min-w-0">
                      <p className="truncate">{review.authorName}</p>
                      <p className="text-xs text-ink-subtle truncate">{review.authorEmail}</p>
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm text-ink-muted line-clamp-3 whitespace-pre-wrap">
                      {review.body || '—'}
                    </p>
                  </td>
                  <td className="font-mono text-xs">{review.orderNumber || '—'}</td>
                  <td className="text-xs text-ink-subtle whitespace-nowrap">
                    {review.createdAt ? new Date(review.createdAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => remove(review)}
                      className="p-2 text-ink-subtle hover:text-wine transition-colors"
                      aria-label="Delete review"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
