import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  const load = () => api.admin.products().then((r) => setProducts(r.products || []));

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing('new');
    setForm({
      name: '',
      category: 'wedding-extras',
      price: 7,
      description: '',
      images: '',
      etsy_url: '',
      active: true,
    });
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      subtitle: p.subtitle || '',
      category: p.category,
      price: p.price,
      original_price: p.originalPrice,
      description: p.description || '',
      images: (p.images || []).join('\n'),
      etsy_url: p.etsyUrl || '',
      etsy_id: p.etsyId || '',
      badge: p.badge || '',
      collection: p.collection || '',
      active: p.active !== false,
      featured: p.featured || false,
    });
  };

  const save = async () => {
    const payload = {
      ...form,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      original_price: form.original_price || null,
    };
    await api.admin.saveProduct(payload, editing === 'new' ? null : editing);
    setEditing(null);
    setForm(null);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-8">
      <div className="flex justify-between mb-8">
        <h1 className="font-display text-3xl text-wine">Products</h1>
        <button type="button" className="btn-primary" onClick={startNew}>
          Add product
        </button>
      </div>

      {form && (
        <div className="bg-white/80 border border-taupe p-6 mb-8 max-w-2xl space-y-3">
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className="input-field" placeholder="Category id" value={form.category} onChange={(e) => set('category', e.target.value)} />
          <input className="input-field" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => set('price', parseFloat(e.target.value))} />
          <textarea className="input-field" rows={3} placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <textarea className="input-field" rows={3} placeholder="Image URLs (one per line)" value={form.images} onChange={(e) => set('images', e.target.value)} />
          <div className="flex gap-3">
            <button type="button" className="btn-primary" onClick={save}>Save</button>
            <button type="button" className="btn-ghost" onClick={() => { setEditing(null); setForm(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white/80 border border-taupe">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-taupe">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Price</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-taupe/40">
                <td className="p-4">{p.id}</td>
                <td className="p-4">{p.name}</td>
                <td className="p-4">${p.price}</td>
                <td className="p-4 text-right">
                  <button type="button" className="text-wine text-xs hover:underline" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
