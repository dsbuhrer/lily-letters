import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import { slugify } from '../../lib/utils/slug';

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  meta_title: '',
  meta_description: '',
  sort_order: 0,
});

function categoryToForm(c) {
  return {
    name: c.name || '',
    slug: c.slug || '',
    description: c.description || '',
    meta_title: c.meta_title || '',
    meta_description: c.meta_description || '',
    sort_order: c.sort_order ?? 0,
  };
}

export default function AdminCategoryEditorPage() {
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
      .category(id)
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

  const onNameChange = (value) => {
    set('name', value);
    if (!slugTouched && isNew) {
      set('slug', slugify(value));
    }
  };

  const validate = () => {
    if (!form.name?.trim()) return 'Category name is required.';
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
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      await api.admin.saveCategory(payload, isNew ? null : id);
      navigate('/admin/categories');
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
        <Link to="/admin/categories" className="btn-ghost inline-flex items-center gap-1">
          <ChevronLeft size={18} />
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        to="/admin/categories"
        className="btn-ghost inline-flex items-center gap-1 mb-6 -ml-1 text-sm"
      >
        <ChevronLeft size={18} />
        Back to categories
      </Link>

      <h1 className="font-display text-3xl text-wine mb-6">{isNew ? 'New category' : 'Edit category'}</h1>

      {error && (
        <p className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Name *</span>
          <input className="input-field mt-1" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
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
            placeholder="wedding-signage"
          />
          <p className="mt-1 text-xs text-ink-subtle">Used in URLs: /blog/category/your-slug</p>
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

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Description</span>
          <textarea
            className="input-field mt-1"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Meta title</span>
          <input
            className="input-field mt-1"
            value={form.meta_title}
            onChange={(e) => set('meta_title', e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-subtle">Meta description</span>
          <textarea
            className="input-field mt-1"
            rows={2}
            value={form.meta_description}
            onChange={(e) => set('meta_description', e.target.value)}
          />
        </label>

        <div className="flex gap-3 pt-4">
          <button type="button" className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save category'}
          </button>
          <Link to="/admin/categories" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
