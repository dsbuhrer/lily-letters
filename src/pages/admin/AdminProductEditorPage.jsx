import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import { productCategories } from '../../data/productCategories';
import ProductImageUploader from '../../components/admin/ProductImageUploader';

const emptyForm = () => ({
  name: '',
  subtitle: '',
  category: 'wedding-extras',
  price: 7,
  original_price: '',
  description: '',
  images: [],
  etsy_url: '',
  etsy_id: '',
  badge: '',
  collection: '',
  active: true,
  featured: false,
});

function productToForm(p) {
  return {
    name: p.name,
    subtitle: p.subtitle || '',
    category: p.category,
    price: p.price,
    original_price: p.originalPrice ?? '',
    description: p.description || '',
    images: [...(p.images || [])],
    etsy_url: p.etsyUrl || '',
    etsy_id: p.etsyId || '',
    badge: p.badge || '',
    collection: p.collection || '',
    active: p.active !== false,
    featured: p.featured || false,
  };
}

const groupedCategories = productCategories.reduce((acc, cat) => {
  const g = cat.group || 'Other';
  if (!acc[g]) acc[g] = [];
  acc[g].push(cat);
  return acc;
}, {});

export default function AdminProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm());
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    api.admin
      .product(id)
      .then(({ product }) => setForm(productToForm(product)))
      .catch((e) => setLoadError(e.message || 'Product not found'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name?.trim()) return 'Product name is required.';
    if (!form.category) return 'Select a category.';
    if (!form.price || form.price <= 0) return 'Enter a valid price.';
    if (!form.images?.length || !form.images.some((url) => url?.trim())) {
      return 'Add at least one product image before saving.';
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
        name: form.name.trim(),
        subtitle: form.subtitle || undefined,
        category: form.category,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        description: form.description,
        images: form.images,
        etsy_url: form.etsy_url || undefined,
        etsy_id: form.etsy_id || undefined,
        badge: form.badge || null,
        collection: form.collection || undefined,
        active: form.active,
        featured: form.featured,
      };
      await api.admin.saveProduct(payload, isNew ? null : id);
      navigate('/admin/products');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[#2d2020]/50">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-2xl">
        <p className="text-red-800 mb-4">{loadError}</p>
        <Link to="/admin/products" className="btn-ghost inline-flex items-center gap-1">
          <ChevronLeft size={18} />
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        to="/admin/products"
        className="btn-ghost inline-flex items-center gap-1 mb-6 -ml-1 text-sm"
      >
        <ChevronLeft size={18} />
        Back to products
      </Link>

      <h1 className="font-display text-3xl text-wine mb-6">{isNew ? 'New product' : 'Edit product'}</h1>

      {error && (
        <p className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Name *</span>
          <input className="input-field mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Subtitle</span>
          <input className="input-field mt-1" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Category *</span>
          <select className="input-field mt-1" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(groupedCategories).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Price (USD) *</span>
            <input
              className="input-field mt-1"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Original price</span>
            <input
              className="input-field mt-1"
              type="number"
              step="0.01"
              min="0"
              placeholder="Optional"
              value={form.original_price}
              onChange={(e) => set('original_price', e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Description</span>
          <textarea
            className="input-field mt-1"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <ProductImageUploader images={form.images} onChange={(urls) => set('images', urls)} onError={setError} />

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Etsy URL</span>
          <input className="input-field mt-1" value={form.etsy_url} onChange={(e) => set('etsy_url', e.target.value)} />
        </label>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active in shop
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            Featured
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <Link to="/admin/products" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
