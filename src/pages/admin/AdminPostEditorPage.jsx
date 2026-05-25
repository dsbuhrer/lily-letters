import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import api from '../../lib/api';

const emptyFaq = () => ({ question: '', answer: '' });

export default function AdminPostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    direct_answer: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    category_id: '',
    tag_slugs: '',
    hero_image: '',
    hero_alt: '',
    related_product_ids: '',
    featured: false,
    faq: [emptyFaq(), emptyFaq(), emptyFaq(), emptyFaq()],
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: '<p>Start writing your article…</p>',
  });

  useEffect(() => {
    api.admin.categories().then((r) => setCategories(r.categories || []));
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      api.admin.post(id).then(({ post }) => {
        setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          direct_answer: post.direct_answer || '',
          status: post.status || 'draft',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          category_id: post.category_id || '',
          tag_slugs: (post.tag_slugs || []).join(', '),
          hero_image: post.hero_image || '',
          hero_alt: post.hero_alt || '',
          related_product_ids: (post.related_product_ids || []).join(', '),
          featured: post.featured || false,
          faq: post.faq?.length ? post.faq : [emptyFaq()],
        });
        editor?.commands.setContent(post.content || '');
      });
    }
  }, [id, isNew, editor]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (publish = false) => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        direct_answer: form.direct_answer,
        content: editor?.getHTML() || '',
        status: publish ? 'published' : form.status,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        category_id: form.category_id || null,
        tag_slugs: form.tag_slugs.split(',').map((t) => t.trim()).filter(Boolean),
        hero_image: form.hero_image,
        hero_alt: form.hero_alt,
        related_product_ids: form.related_product_ids
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !Number.isNaN(n)),
        featured: form.featured,
        faq: form.faq.filter((f) => f.question && f.answer),
      };
      const res = await api.admin.savePost(payload, isNew ? null : id);
      if (publish && res.post?.id) await api.admin.publishPost(res.post.id);
      navigate('/admin/posts');
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadHero = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await api.admin.upload(file, 'blog-images');
    set('hero_image', url);
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl text-wine mb-8">{isNew ? 'New post' : 'Edit post'}</h1>

      <div className="space-y-6">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Title</span>
          <input className="input-field mt-1" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Slug</span>
          <input className="input-field mt-1" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated if empty" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Direct answer (AEO snippet)</span>
          <textarea className="input-field mt-1" rows={2} value={form.direct_answer} onChange={(e) => set('direct_answer', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Excerpt</span>
          <textarea className="input-field mt-1" rows={2} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Category</span>
          <select className="input-field mt-1" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Tags (comma-separated)</span>
          <input className="input-field mt-1" value={form.tag_slugs} onChange={(e) => set('tag_slugs', e.target.value)} />
        </label>
        <div>
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Content</span>
          <div className="mt-1 border border-taupe bg-white min-h-[200px] p-4 prose-blog">
            <EditorContent editor={editor} />
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Hero image</span>
          <input type="file" accept="image/*" className="mt-1 block" onChange={uploadHero} />
          {form.hero_image && <img src={form.hero_image} alt="" className="mt-2 max-h-40 object-cover" />}
          <input className="input-field mt-2" placeholder="Alt text" value={form.hero_alt} onChange={(e) => set('hero_alt', e.target.value)} />
        </div>
        <fieldset className="border border-taupe p-4">
          <legend className="text-xs uppercase tracking-widest text-[#2d2020]/50 px-2">SEO</legend>
          <input className="input-field mb-3" placeholder="Meta title" value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
          <textarea className="input-field" rows={2} placeholder="Meta description" value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
        </fieldset>
        <fieldset className="border border-taupe p-4">
          <legend className="text-xs uppercase tracking-widest text-[#2d2020]/50 px-2">FAQ</legend>
          {form.faq.map((item, i) => (
            <div key={i} className="mb-4 pb-4 border-b border-taupe/30 last:border-0">
              <input className="input-field mb-2" placeholder="Question" value={item.question} onChange={(e) => {
                const faq = [...form.faq];
                faq[i] = { ...faq[i], question: e.target.value };
                set('faq', faq);
              }} />
              <textarea className="input-field" rows={2} placeholder="Answer" value={item.answer} onChange={(e) => {
                const faq = [...form.faq];
                faq[i] = { ...faq[i], answer: e.target.value };
                set('faq', faq);
              }} />
            </div>
          ))}
          <button type="button" className="btn-ghost text-sm" onClick={() => set('faq', [...form.faq, emptyFaq()])}>
            + Add FAQ
          </button>
        </fieldset>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">Related product IDs</span>
          <input className="input-field mt-1" value={form.related_product_ids} onChange={(e) => set('related_product_ids', e.target.value)} placeholder="1, 2, 8" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
          <span className="text-sm">Featured / trending</span>
        </label>
      </div>

      <div className="flex gap-4 mt-10">
        <button type="button" className="btn-primary" disabled={saving} onClick={() => save(false)}>
          Save draft
        </button>
        <button type="button" className="btn-secondary" disabled={saving} onClick={() => save(true)}>
          Publish
        </button>
        <button type="button" className="btn-ghost" onClick={() => navigate('/admin/posts')}>
          Cancel
        </button>
      </div>
    </div>
  );
}
