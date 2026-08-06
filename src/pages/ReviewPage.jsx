import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Loader2, Star } from 'lucide-react';
import api from '../lib/api';
import SeoHead from '../components/seo/SeoHead';

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className="p-0.5 disabled:opacity-60"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star size={28} strokeWidth={0} fill={active ? '#978152' : '#d4cbc4'} />
          </button>
        );
      })}
    </div>
  );
}

function ProductReviewForm({ product, defaultName, token, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState(defaultName || '');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (product.reviewed) {
    return (
      <div className="border border-taupe/30 bg-cream/60 p-6">
        <div className="flex gap-4">
          {product.image && (
            <img
              src={product.image}
              alt=""
              className="w-16 h-16 object-cover shrink-0 bg-taupe/20"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-wine">{product.name}</p>
            <div className="flex items-center gap-2 mt-2 text-sage text-sm font-body">
              <Check size={16} />
              Review submitted
            </div>
            {product.existingReview && (
              <div className="mt-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      strokeWidth={0}
                      fill={i < product.existingReview.rating ? '#978152' : '#d4cbc4'}
                    />
                  ))}
                </div>
                {product.existingReview.body && (
                  <p className="font-body text-sm text-ink-muted mt-2 leading-relaxed">
                    {product.existingReview.body}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.submitReview({
        token,
        productId: product.productId,
        orderItemId: product.orderItemId,
        rating,
        authorName,
        body,
      });
      onSubmitted(product.productId, { rating, body, authorName });
    } catch (err) {
      setError(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-taupe/30 bg-white p-6 space-y-4">
      <div className="flex gap-4">
        {product.image && (
          <img
            src={product.image}
            alt=""
            className="w-16 h-16 object-cover shrink-0 bg-taupe/20"
          />
        )}
        <div>
          <p className="font-display text-lg text-wine">{product.name}</p>
          <p className="font-body text-xs text-ink-subtle mt-1">How was this template?</p>
        </div>
      </div>

      <StarPicker value={rating} onChange={setRating} disabled={submitting} />

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-ink-subtle">Your name</span>
        <input
          type="text"
          required
          maxLength={120}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="mt-1.5 w-full border border-taupe/40 bg-cream/40 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-wine"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-ink-subtle">
          Your review <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <textarea
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you love about this template?"
          className="mt-1.5 w-full border border-taupe/40 bg-cream/40 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-wine resize-y"
        />
      </label>

      {error && <p className="font-body text-sm text-wine">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Submitting…
          </>
        ) : (
          'Submit review'
        )}
      </button>
    </form>
  );
}

export default function ReviewPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid review link.');
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getReviewInvite(token)
      .then((data) => setInvite(data))
      .catch((err) => setError(err.message || 'Could not load this review page.'))
      .finally(() => setLoading(false));
  }, [token]);

  const onSubmitted = (productId, draft) => {
    setInvite((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.productId === productId
            ? {
                ...p,
                reviewed: true,
                existingReview: {
                  rating: draft.rating,
                  body: draft.body || null,
                  authorName: draft.authorName,
                  createdAt: new Date().toISOString(),
                },
              }
            : p,
        ),
      };
    });
  };

  const allDone =
    invite?.products?.length > 0 && invite.products.every((p) => p.reviewed);

  return (
    <>
      <SeoHead title="Leave a Review | The Lily Letters Co." noIndex />
      <main className="min-h-screen bg-cream pt-24 pb-20">
        <div className="max-w-xl mx-auto px-6">
          <p className="section-subtitle mb-3">Thank you</p>
          <h1 className="font-display text-4xl font-light text-wine mb-3">Leave a review</h1>
          <p className="font-body text-sm text-ink-muted mb-10 leading-relaxed">
            Your feedback helps other couples choose the perfect stationery.
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-ink-subtle font-body text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading your order…
            </div>
          )}

          {!loading && error && (
            <div className="border border-wine/20 bg-wine/5 p-6">
              <p className="font-body text-sm text-wine mb-4">{error}</p>
              <Link to="/" className="btn-ghost">
                Back to home
              </Link>
            </div>
          )}

          {!loading && invite && (
            <div className="space-y-6">
              {invite.orderNumber && (
                <p className="font-body text-xs text-ink-faint uppercase tracking-widest">
                  Order {invite.orderNumber}
                </p>
              )}

              {invite.products.length === 0 ? (
                <p className="font-body text-sm text-ink-muted">No products found for this order.</p>
              ) : (
                invite.products.map((product) => (
                  <ProductReviewForm
                    key={product.productId}
                    product={product}
                    defaultName={invite.billingName || ''}
                    token={token}
                    onSubmitted={onSubmitted}
                  />
                ))
              )}

              {allDone && (
                <div className="border border-sage/30 bg-sage/10 p-6 text-center">
                  <p className="font-display text-xl text-wine mb-2">Thank you!</p>
                  <p className="font-body text-sm text-ink-muted mb-4">
                    Your reviews have been submitted.
                  </p>
                  <Link to="/products" className="btn-primary inline-flex">
                    Browse templates
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
