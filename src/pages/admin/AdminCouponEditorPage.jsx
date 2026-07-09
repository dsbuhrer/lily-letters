import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';

const emptyForm = () => ({
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 20,
  scope: 'cart',
  productIds: [],
  minSubtotal: '',
  maxRedemptions: '',
  startsAt: '',
  endsAt: '',
  active: true,
});

function couponToForm(coupon) {
  return {
    code: coupon.code || '',
    description: coupon.description || '',
    discountType: coupon.discountType || 'percent',
    discountValue: coupon.discountValue ?? 20,
    scope: coupon.scope || 'cart',
    productIds: [...(coupon.productIds || [])],
    minSubtotal: coupon.minSubtotalCents != null ? (coupon.minSubtotalCents / 100).toFixed(2) : '',
    maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
    startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
    endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 16) : '',
    active: coupon.active !== false,
  };
}

export default function AdminCouponEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, toast } = useUiFeedback();
  const isNew = id === 'new';

  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.admin.products().then((r) => setProducts(r.products || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    api.admin
      .coupon(id)
      .then(({ coupon }) => setForm(couponToForm(coupon)))
      .catch((e) => setLoadError(e.message || 'Coupon not found'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const active = products.filter((p) => p.active !== false);
    if (!q) return active;
    return active.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.sku?.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const toggleProduct = (productId) => {
    setForm((f) => {
      const ids = new Set(f.productIds);
      if (ids.has(productId)) ids.delete(productId);
      else ids.add(productId);
      return { ...f, productIds: [...ids] };
    });
  };

  const validate = () => {
    if (!form.code?.trim()) return 'Coupon code is required.';
    if (!form.discountValue || Number(form.discountValue) <= 0) return 'Enter a valid discount value.';
    if (form.discountType === 'percent' && Number(form.discountValue) >= 100) {
      return 'Percent discount must be less than 100%.';
    }
    if (form.scope === 'products' && !form.productIds.length) {
      return 'Select at least one product for product-scoped coupons.';
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        scope: form.scope,
        productIds: form.scope === 'products' ? form.productIds : [],
        minSubtotalCents: form.minSubtotal ? Math.round(Number(form.minSubtotal) * 100) : null,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        active: form.active,
      };
      await api.admin.saveCoupon(payload, isNew ? null : id);
      toast.success(isNew ? 'Coupon created.' : 'Coupon saved.');
      navigate('/admin/coupons');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete coupon?',
      message: `"${form.code}" will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.admin.deleteCoupon(id);
      toast.success('Coupon deleted.');
      navigate('/admin/coupons');
    } catch (e) {
      setError(e.message || 'Could not delete coupon.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-ink-subtle">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-2xl">
        <p className="text-red-800 mb-4">{loadError}</p>
        <Link to="/admin/coupons" className="btn-ghost inline-flex items-center gap-1">
          <ChevronLeft size={18} />
          Back to coupons
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link to="/admin/coupons" className="btn-ghost inline-flex items-center gap-1 mb-6 -ml-1 text-sm">
        <ChevronLeft size={18} />
        Back to coupons
      </Link>

      <h1 className="font-display text-3xl text-wine mb-6">{isNew ? 'New coupon' : 'Edit coupon'}</h1>

      {error && (
        <p className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Code *</span>
          <input
            className="input-field mt-1 font-mono uppercase"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="SUMMER20"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Description</span>
          <input
            className="input-field mt-1"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Summer sale — 20% off"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Discount type *</span>
            <select
              className="input-field mt-1"
              value={form.discountType}
              onChange={(e) => set('discountType', e.target.value)}
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (USD)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Value *</span>
            <input
              className="input-field mt-1"
              type="number"
              min="0.01"
              step={form.discountType === 'percent' ? '1' : '0.01'}
              value={form.discountValue}
              onChange={(e) => set('discountValue', parseFloat(e.target.value) || 0)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Scope *</span>
          <select className="input-field mt-1" value={form.scope} onChange={(e) => set('scope', e.target.value)}>
            <option value="cart">Entire cart</option>
            <option value="products">Selected products only</option>
          </select>
        </label>

        {form.scope === 'products' && (
          <div className="border border-taupe/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">
                Products ({form.productIds.length} selected)
              </span>
              <input
                className="input-field max-w-xs text-sm py-1.5"
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filteredProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm py-1">
                  <input
                    type="checkbox"
                    className="accent-wine"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-ink-subtle tabular-nums w-8">{p.id}</span>
                  <span className="text-ink flex-1 truncate">{p.name}</span>
                  <span className="text-wine tabular-nums">${p.price}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Min. order (USD)</span>
            <input
              className="input-field mt-1"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              value={form.minSubtotal}
              onChange={(e) => set('minSubtotal', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Max redemptions</span>
            <input
              className="input-field mt-1"
              type="number"
              min="1"
              step="1"
              placeholder="Unlimited"
              value={form.maxRedemptions}
              onChange={(e) => set('maxRedemptions', e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Starts at</span>
            <input
              className="input-field mt-1"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Ends at</span>
            <input
              className="input-field mt-1"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          Active
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button type="button" className="btn-primary" disabled={saving || deleting} onClick={save}>
            {saving ? 'Saving…' : 'Save coupon'}
          </button>
          <Link to="/admin/coupons" className="btn-ghost">
            Cancel
          </Link>
          {!isNew && (
            <button
              type="button"
              className="btn-ghost text-red-800 hover:text-red-900 ml-auto"
              disabled={saving || deleting}
              onClick={remove}
            >
              {deleting ? 'Deleting…' : 'Delete coupon'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
