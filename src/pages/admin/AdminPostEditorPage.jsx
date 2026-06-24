import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import BlogRichTextEditor, { getBlogEditorExtensions } from '../../components/admin/BlogRichTextEditor';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Plus, Trash2, Info } from 'lucide-react';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import ImageUploadWithCrop from '../../components/admin/ImageUploadWithCrop';
import {
  BLOG_HERO_ASPECT,
  BLOG_HERO_RECOMMENDED_LABEL,
  BLOG_HERO_RECOMMENDED_NOTE,
} from '../../constants/blogHeroImage';
import { slugify } from '../../utils/slugify';
import BlogTagInput from '../../components/admin/BlogTagInput';

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'article', label: 'Article' },
  { id: 'cover', label: 'Cover' },
  { id: 'faq', label: 'FAQ' },
  { id: 'products', label: 'Products' },
  { id: 'publish', label: 'Review' },
];

const emptyFaq = () => ({ question: '', answer: '' });

function FieldInfo({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle ml-1.5">
      <button
        type="button"
        className="text-ink-subtle hover:text-wine focus:text-wine rounded-full p-0.5"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <Info size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-20 w-72 p-3 text-xs font-normal normal-case tracking-normal leading-relaxed text-ink bg-white border border-taupe shadow-md rounded-sm"
        >
          {children}
        </span>
      )}
    </span>
  );
}

const initialForm = () => ({
  title: '',
  excerpt: '',
  direct_answer: '',
  status: 'draft',
  meta_title: '',
  meta_description: '',
  category_id: '',
  tag_slugs: [],
  hero_image: '',
  hero_alt: '',
  related_product_ids: [],
  featured: false,
  faq: [emptyFaq()],
  seo_keywords: [],
});

function validateStep(step, form, editor) {
  switch (step) {
    case 0: {
      if (!form.title.trim() || form.title.trim().length < 3) {
        return 'Enter a title (at least 3 characters).';
      }
      if (!form.category_id) return 'Select a category.';
      return null;
    }
    case 1: {
      if (!form.direct_answer.trim() || form.direct_answer.trim().length < 20) {
        return 'Write a direct answer for AEO (at least 20 characters).';
      }
      const text = editor?.getText()?.trim() || '';
      if (text.length < 80) return 'Write the article body (at least 80 characters).';
      return null;
    }
    case 2: {
      if (!form.hero_image?.trim()) return 'Add a hero image before continuing.';
      return null;
    }
    case 3: {
      for (let i = 0; i < form.faq.length; i += 1) {
        const { question, answer } = form.faq[i];
        const hasQ = !!question.trim();
        const hasA = !!answer.trim();
        if (hasQ !== hasA) {
          return `FAQ #${i + 1}: fill in both question and answer, or leave both empty.`;
        }
      }
      const complete = form.faq.filter((f) => f.question.trim() && f.answer.trim());
      if (complete.length < 1) return 'Add at least one complete FAQ (question + answer).';
      return null;
    }
    case 4:
      return null;
    default:
      return null;
  }
}

export default function AdminPostEditorPage() {
  const { confirm, toast } = useUiFeedback();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState('');
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoSource, setSeoSource] = useState('');
  const [seoError, setSeoError] = useState('');
  const [existingSlug, setExistingSlug] = useState('');
  const pendingContentRef = useRef(null);

  const editor = useEditor({
    extensions: getBlogEditorExtensions(),
    content: '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[220px]',
      },
    },
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    Promise.all([api.admin.categories(), api.admin.products()]).then(([cats, prods]) => {
      setCategories(cats.categories || []);
      setProducts((prods.products || []).filter((p) => p.active !== false));
    });
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      api.admin.post(id).then(({ post }) => {
        setExistingSlug(post.slug || '');
        setForm({
          ...initialForm(),
          title: post.title || '',
          excerpt: post.excerpt || '',
          direct_answer: post.direct_answer || '',
          status: post.status || 'draft',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          category_id: post.category_id || '',
          tag_slugs: post.tag_slugs || [],
          hero_image: post.hero_image || '',
          hero_alt: post.hero_alt || '',
          related_product_ids: post.related_product_ids || [],
          featured: post.featured || false,
          faq: post.faq?.length ? post.faq : [emptyFaq()],
          seo_keywords: post.seo_keywords || [],
        });
        pendingContentRef.current = post.content || '<p></p>';
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(pendingContentRef.current);
          pendingContentRef.current = null;
        }
      });
    }
  }, [id, isNew, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || pendingContentRef.current === null) return;
    editor.commands.setContent(pendingContentRef.current);
    pendingContentRef.current = null;
  }, [editor]);

  const seoAutoRan = useRef(false);

  const runSeoGeneration = useCallback(async ({ force = false } = {}) => {
    setSeoLoading(true);
    setSeoError('');
    try {
      const tags = form.tag_slugs;
      const seo = await api.admin.generateSeo({
        title: form.title,
        direct_answer: form.direct_answer,
        content: editor?.getHTML() || '',
        tag_slugs: tags,
        regenerate: force,
      });
      setForm((f) => ({
        ...f,
        meta_title: seo.meta_title?.trim() || f.meta_title,
        meta_description: force
          ? (seo.meta_description ?? '')
          : (seo.meta_description?.trim() || f.meta_description),
        excerpt: force ? (seo.excerpt ?? '') : (seo.excerpt?.trim() || f.excerpt),
        seo_keywords: seo.seo_keywords?.length ? seo.seo_keywords : f.seo_keywords,
      }));
      setSeoSource(
        seo.source === 'gemini' ? 'Generated with Gemini' : 'Generated automatically (no API key or fallback)',
      );
    } catch (e) {
      setSeoError(e.message);
      seoAutoRan.current = false;
    } finally {
      setSeoLoading(false);
    }
  }, [form.title, form.direct_answer, form.tag_slugs, editor]);

  useEffect(() => {
    if (step !== 5) {
      seoAutoRan.current = false;
      setSeoError('');
      return;
    }
    if (seoAutoRan.current) return;
    if (form.meta_title?.trim() && form.meta_description?.trim()) {
      seoAutoRan.current = true;
      return;
    }
    seoAutoRan.current = true;
    runSeoGeneration({ force: false });
  }, [step, form.meta_title, form.meta_description, runSeoGeneration]);

  const goNext = () => {
    const err = validateStep(step, form, editor);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError('');
    if (step === 0) {
      navigate('/admin/posts');
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleProduct = (productId) => {
    setForm((f) => {
      const ids = f.related_product_ids.includes(productId)
        ? f.related_product_ids.filter((x) => x !== productId)
        : [...f.related_product_ids, productId];
      return { ...f, related_product_ids: ids };
    });
  };

  const buildPayload = (status) => ({
    title: form.title.trim(),
    excerpt: form.excerpt,
    direct_answer: form.direct_answer,
    content: editor?.getHTML() || '',
    status,
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    category_id: form.category_id || null,
    tag_slugs: form.tag_slugs,
    hero_image: form.hero_image,
    hero_alt: form.hero_alt || form.title,
    related_product_ids: form.related_product_ids,
    featured: form.featured,
    faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
    seo_keywords: form.seo_keywords,
  });

  const validateForSave = () => {
    for (let i = 0; i <= 3; i += 1) {
      const err = validateStep(i, form, editor);
      if (err) return err;
    }
    return null;
  };

  const save = async (publish = false) => {
    const err = validateForSave();
    if (err) {
      setStepError(err);
      return;
    }
    setSaving(true);
    setStepError('');
    try {
      const payload = buildPayload(publish ? 'published' : form.status);
      const res = await api.admin.savePost(payload, isNew ? null : id);
      const postId = res.post?.id || id;
      if (publish && postId) await api.admin.publishPost(postId);
      navigate('/admin/posts');
    } catch (e) {
      setStepError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async () => {
    const err = validateForSave();
    if (err) {
      setStepError(err);
      return;
    }
    const ok = await confirm({
      title: 'Publish post?',
      message: 'This post will be visible on the blog.',
      confirmLabel: 'Publish',
    });
    if (!ok) return;
    setSaving(true);
    setStepError('');
    try {
      const payload = buildPayload('published');
      const res = await api.admin.savePost(payload, isNew ? null : id);
      const postId = res.post?.id || id;
      if (postId) await api.admin.publishPost(postId);
      if (isNew && res.post?.id) {
        navigate(`/admin/posts/${res.post.id}`, { replace: true });
      }
      setForm((f) => ({ ...f, status: 'published' }));
      toast.success('Post published.');
    } catch (e) {
      setStepError(e.message);
      toast.error(e.message || 'Could not publish.');
    } finally {
      setSaving(false);
    }
  };

  const isDraft = form.status !== 'published';

  const previewSlug = existingSlug || slugify(form.title) || 'your-post-slug';

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 className="font-display text-3xl text-wine">{isNew ? 'New post' : 'Edit post'}</h1>
        {isDraft && (
          <button
            type="button"
            className="btn-secondary shrink-0"
            disabled={saving || seoLoading}
            onClick={publishDraft}
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        )}
      </div>
      {!isNew && (
        <p className="text-sm mb-2">
          <span
            className={`inline-block text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
              isDraft ? 'bg-[#2d2020]/5 text-ink-muted border-taupe' : 'bg-wine/10 text-wine border-wine/25'
            }`}
          >
            {isDraft ? 'Draft' : 'Published'}
          </span>
        </p>
      )}
      <p className="text-sm text-ink-subtle mb-6">
        URL: <span className="text-wine font-mono">/blog/{previewSlug}</span>
        <span className="text-ink-faint"> (slug generated from title)</span>
      </p>

      <nav className="flex gap-1 mb-8 overflow-x-auto pb-1" aria-label="Steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={`shrink-0 px-3 py-2 text-xs uppercase tracking-wider border transition-colors ${
              i === step
                ? 'bg-wine text-cream border-wine'
                : i < step
                  ? 'border-taupe text-wine hover:bg-wine/5'
                  : 'border-taupe/50 text-ink-faint'
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </nav>

      {stepError && (
        <p className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {stepError}
        </p>
      )}

      <div className="min-h-[280px]">
        {step === 0 && (
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Title *</span>
              <input
                className="input-field mt-1"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Wedding Signage Checklist"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Category *</span>
              <select
                className="input-field mt-1"
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Tags</span>
              <BlogTagInput
                value={form.tag_slugs}
                onChange={(tags) => set('tag_slugs', tags)}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle inline-flex items-center">
                Direct answer (AEO snippet) *
                <FieldInfo label="What is Direct answer (AEO snippet)?">
                  <strong className="text-wine block mb-1">What it is</strong>
                  A short, direct answer (about 40–60 words) to the main question your article answers—written so a reader gets the gist immediately.
                  <strong className="text-wine block mt-2 mb-1">What it&apos;s for</strong>
                  Shown as <em>Quick answer</em> at the top of the published post. AI search tools (ChatGPT, Perplexity, Google AI Overviews) often pull this kind of snippet when citing your page—Answer Engine Optimization (AEO).
                </FieldInfo>
              </span>
              <textarea
                className="input-field mt-1"
                rows={3}
                value={form.direct_answer}
                onChange={(e) => set('direct_answer', e.target.value)}
                placeholder="40–60 words: the clearest answer to the main question."
              />
              <span className="text-xs text-ink-faint mt-1 block">{form.direct_answer.length} characters</span>
            </label>
            <div>
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Article body *</span>
              <div className="mt-1">
                <BlogRichTextEditor editor={editor} onError={setStepError} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <ImageUploadWithCrop
              mode="single"
              value={form.hero_image}
              onChange={(url) => {
                set('hero_image', url);
                if (url && !form.hero_alt) set('hero_alt', form.title);
              }}
              bucket="blog-images"
              aspect={BLOG_HERO_ASPECT}
              recommendedSize={BLOG_HERO_RECOMMENDED_LABEL}
              recommendedSizeNote={BLOG_HERO_RECOMMENDED_NOTE}
              label="Hero image *"
              onError={setStepError}
            />
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-subtle">Image alt text</span>
              <input
                className="input-field mt-1"
                value={form.hero_alt}
                onChange={(e) => set('hero_alt', e.target.value)}
                placeholder={form.title || 'Describe the image'}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-ink-muted">Add FAQs for Google and AI search. At least one complete pair is required.</p>
            {form.faq.map((item, i) => (
              <div key={i} className="p-4 border border-taupe/60 bg-white/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-wine">FAQ {i + 1}</span>
                  {form.faq.length > 1 && (
                    <button
                      type="button"
                      className="text-ink-faint hover:text-wine"
                      onClick={() => set('faq', form.faq.filter((_, j) => j !== i))}
                      aria-label="Remove FAQ"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input
                  className="input-field"
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => {
                    const faq = [...form.faq];
                    faq[i] = { ...faq[i], question: e.target.value };
                    set('faq', faq);
                  }}
                />
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) => {
                    const faq = [...form.faq];
                    faq[i] = { ...faq[i], answer: e.target.value };
                    set('faq', faq);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost text-sm inline-flex items-center gap-2"
              onClick={() => set('faq', [...form.faq, emptyFaq()])}
            >
              <Plus size={16} />
              Add another FAQ
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">Select templates to show in “Shop the look” on this article.</p>
            {products.length === 0 ? (
              <p className="text-sm text-ink-subtle">No products in catalog. Add products first.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto border border-taupe p-3 bg-white/50">
                {products.map((p) => (
                  <li key={p.id}>
                    <label className="flex items-start gap-3 cursor-pointer py-2 hover:bg-wine/5 px-2 -mx-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={form.related_product_ids.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium text-wine">{p.name}</span>
                        <span className="text-ink-subtle block text-xs">
                          ${p.price} · {p.category}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-ink-subtle">
              {form.related_product_ids.length} product(s) selected
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink-muted">SEO fields are filled automatically from your content.</p>
              <button
                type="button"
                className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"
                disabled={seoLoading}
                onClick={() => runSeoGeneration({ force: true })}
              >
                {seoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Regenerate SEO
              </button>
            </div>
            {seoError && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 px-3 py-2">{seoError}</p>
            )}
            {seoSource && !seoError && <p className="text-xs text-gold">{seoSource}</p>}
            {seoLoading ? (
              <p className="text-sm text-ink-subtle flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Generating SEO…
              </p>
            ) : (
              <div className="space-y-4 p-4 border border-taupe bg-[#f8f5ef] text-sm">
                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-subtle">Meta title</span>
                  <p className="mt-1 text-wine">{form.meta_title || '—'}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-subtle">Meta description</span>
                  <p className="mt-1">{form.meta_description || '—'}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-ink-subtle">Card excerpt</span>
                  <p className="mt-1">{form.excerpt || '—'}</p>
                </div>
                {form.seo_keywords?.length > 0 && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-ink-subtle">Keywords</span>
                    <p className="mt-1 text-ink-muted">{form.seo_keywords.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span className="text-sm">Featured in trending</span>
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-10 pt-6 border-t border-taupe/50">
        <button type="button" className="btn-ghost inline-flex items-center gap-1" onClick={goBack}>
          <ChevronLeft size={18} />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <>
            <button type="button" className="btn-primary inline-flex items-center gap-1" onClick={goNext}>
              Next
              <ChevronRight size={18} />
            </button>
            {isDraft && (
              <button type="button" className="btn-secondary" disabled={saving || seoLoading} onClick={publishDraft}>
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn-primary" disabled={saving || seoLoading} onClick={() => save(false)}>
              {saving ? 'Saving…' : isDraft ? 'Save draft' : 'Save'}
            </button>
            {isDraft && (
              <button type="button" className="btn-secondary" disabled={saving || seoLoading} onClick={() => save(true)}>
                Publish
              </button>
            )}
          </>
        )}
        <button type="button" className="btn-ghost ml-auto" onClick={() => navigate('/admin/posts')}>
          Cancel
        </button>
      </div>
    </div>
  );
}
