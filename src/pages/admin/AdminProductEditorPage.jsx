import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import { staticProductCategories } from '../../lib/productCategoryUtils';
import ProductMediaGallery from '../../components/admin/ProductMediaGallery';
import ProductPdfUploader from '../../components/admin/ProductPdfUploader';

const defaultCategorySlug =
  staticProductCategories[0]?.slug || staticProductCategories[0]?.id || 'wedding-extras';

const emptyForm = () => ({
  name: '',
  subtitle: '',
  sku: '',
  category: defaultCategorySlug,
  price: 7,
  original_price: '',
  description: '',
  images: [],
  videos: [],
  pdf_url: '',
  pdf_file_name: '',
  badge: '',
  collection: '',
  active: true,
  featured: false,
});

function productToForm(p) {
  return {
    name: p.name,
    subtitle: p.subtitle || '',
    sku: p.sku || '',
    category: p.category,
    price: p.price,
    original_price: p.originalPrice ?? '',
    description: p.description || '',
    images: [...(p.images || [])],
    videos: [...(p.videos || [])],
    pdf_url: p.pdfUrl || '',
    pdf_file_name: p.pdfFileName || '',
    badge: p.badge || '',
    collection: p.collection || '',
    active: p.active !== false,
    featured: p.featured || false,
  };
}

export default function AdminProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, toast } = useUiFeedback();
  const isNew = id === 'new';

  const [form, setForm] = useState(emptyForm);
  const [groupedCategories, setGroupedCategories] = useState({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.admin
      .productCategories()
      .then((r) => {
        const list = r.categories || [];
        const grouped = list.reduce((acc, cat) => {
          const g = cat.group_name || 'Other';
          if (!acc[g]) acc[g] = [];
          acc[g].push(cat);
          return acc;
        }, {});
        setGroupedCategories(grouped);
        if (isNew && list.length) {
          setForm((f) => ({ ...f, category: list[0].slug }));
        }
      })
      .catch(() => {});
  }, [isNew]);

  useEffect(() => {
    if (isNew) {
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
    if (form.badge === 'Sale') {
      const original = form.original_price ? Number(form.original_price) : 0;
      if (!original || original <= Number(form.price)) {
        return 'For Sale badge, original price must be higher than the sale price.';
      }
    }
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
        sku: form.sku.trim() || null,
        category: form.category,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        description: form.description,
        images: form.images,
        videos: form.videos,
        pdf_url: form.pdf_url || null,
        pdf_file_name: form.pdf_file_name?.trim() || null,
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

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete product?',
      message: form.name
        ? `"${form.name}" will be removed from the shop. You can reactivate it later by editing the product.`
        : 'This product will be removed from the shop.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    setError('');
    try {
      await api.admin.deleteProduct(id);
      toast.success('Product deleted.');
      navigate('/admin/products');
    } catch (e) {
      setError(e.message || 'Could not delete product.');
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
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Name *</span>
          <input className="input-field mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Subtitle</span>
          <input className="input-field mt-1" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">SKU</span>
          <input
            className="input-field mt-1 font-mono"
            value={form.sku}
            onChange={(e) => set('sku', e.target.value)}
            placeholder="e.g. LL-WED-001"
          />
          <span className="block mt-1 text-xs text-ink-subtle">
            Unique code for this product. To group items in a collection, use the Collection field.
          </span>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Category *</span>
          <select className="input-field mt-1" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(groupedCategories).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Price (USD) *</span>
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
            <span className="text-xs uppercase tracking-widest text-ink-subtle">Original price</span>
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
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Badge</span>
          <select
            className="input-field mt-1"
            value={form.badge}
            onChange={(e) => set('badge', e.target.value)}
          >
            <option value="">None</option>
            <option value="Sale">Sale</option>
            <option value="New">New</option>
            <option value="Best Seller">Best Seller</option>
          </select>
          {form.badge === 'Sale' && (
            <span className="block mt-1 text-xs text-ink-subtle">
              Sale badge shows a discount % when original price is higher than sale price.
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Description</span>
          <textarea
            className="input-field mt-1 min-h-[200px] resize-y"
            rows={8}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <ProductMediaGallery
          images={form.images}
          onChange={(urls) => set('images', urls)}
          videos={form.videos}
          onVideosChange={(urls) => set('videos', urls)}
          onError={setError}
        />

        <ProductPdfUploader
          pdfPath={form.pdf_url}
          fileName={form.pdf_file_name}
          onChange={(path, name) => {
            setForm((f) => ({ ...f, pdf_url: path, pdf_file_name: name }));
          }}
          onError={setError}
        />

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

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button type="button" className="btn-primary" disabled={saving || deleting} onClick={save}>
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <Link to="/admin/products" className="btn-ghost">
            Cancel
          </Link>
          {!isNew && form.active !== false && (
            <button
              type="button"
              className="btn-ghost text-red-800 hover:text-red-900 ml-auto"
              disabled={saving || deleting}
              onClick={remove}
            >
              {deleting ? 'Deleting…' : 'Delete product'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
