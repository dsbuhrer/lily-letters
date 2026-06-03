import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import { slugify } from '../../lib/utils/slug';
import { invalidateProductCategoriesCache } from '../../hooks/useProductCategories';

const emptyForm = () => ({
  label: '',
  slug: '',
  group_name: '',
  sort_order: 0,
});

function categoryToForm(c) {
  return {
    label: c.label || '',
    slug: c.slug || '',
    group_name: c.group_name || '',
    sort_order: c.sort_order ?? 0,
  };
}

export default function AdminProductCategoryEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm());
      setSlugTouched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    api.admin
      .productCategory(id)
      .then(({ category }) => {
        if (category.deleted_at) {
          setLoadError('This category is archived and cannot be edited.');
          return;
        }
        setForm(categoryToForm(category));
        setSlugTouched(true);
      })
      .catch((e) => setLoadError(e.message || 'Category not found'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onLabelChange = (value) => {
    set('label', value);
    if (!slugTouched && isNew) {
      set('slug', slugify(value));
    }
  };

  const validate = () => {
    if (!form.label?.trim()) return 'Category label is required.';
    if (!form.slug?.trim()) return 'Slug is required.';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      return 'Slug must use lowercase letters, numbers, and hyphens only.';
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
        label: form.label.trim(),
        slug: form.slug.trim(),
        group_name: form.group_name,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      await api.admin.saveProductCategory(payload, isNew ? null : id);
      invalidateProductCategoriesCache();
      navigate('/admin/product-categories');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
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
        <Link to="/admin/product-categories" className="btn-ghost inline-flex items-center gap-1">
          <ChevronLeft size={18} />
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        to="/admin/product-categories"
        className="btn-ghost inline-flex items-center gap-1 mb-6 -ml-1 text-sm"
      >
        <ChevronLeft size={18} />
        Back to categories
      </Link>

      <h1 className="font-display text-3xl text-wine mb-6">
        {isNew ? 'New product category' : 'Edit product category'}
      </h1>

      {error && (
        <p className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Label *</span>
          <input className="input-field mt-1" value={form.label} onChange={(e) => onLabelChange(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Slug *</span>
          <input
            className="input-field mt-1 font-mono text-sm"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set('slug', e.target.value);
            }}
            placeholder="wedding-table-signs"
          />
          <p className="mt-1 text-xs text-ink-subtle">
            Stored on each product. Used in URLs: /products?category=your-slug
          </p>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Group (sidebar)</span>
          <input
            className="input-field mt-1"
            value={form.group_name}
            onChange={(e) => set('group_name', e.target.value)}
            placeholder="WEDDING COLLECTIONS"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Sort order</span>
          <input
            className="input-field mt-1 w-32"
            type="number"
            min="0"
            value={form.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
          />
        </label>

        <div className="flex gap-3 pt-4">
          <button type="button" className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save category'}
          </button>
          <Link to="/admin/product-categories" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
