const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function parseJsonResponse(res) {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(
      API_BASE
        ? 'A API retornou HTML em vez de JSON. Confira VITE_API_URL e se o servidor está rodando (npm run dev:server).'
        : 'A API retornou HTML em vez de JSON. Rode npm run dev:full (Vite + API) ou defina VITE_API_URL=http://localhost:3001 no .env.',
    );
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(res.ok ? 'Resposta inválida da API' : text.slice(0, 200) || res.statusText);
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Endpoint da API não encontrado. Reinicie o backend (npm run dev:server) ou use npm run dev:full.',
      );
    }
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  getPosts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/posts?${q}`);
  },
  getPost: (slug) => request(`/api/posts/${slug}`),

  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/products?${q}`);
  },
  getProduct: (idOrSlug) => request(`/api/products/${idOrSlug}`),

  subscribe: (email, source = 'footer') =>
    request('/api/subscribers', { method: 'POST', body: JSON.stringify({ email, source }) }),

  submitContact: (payload) =>
    request('/api/leads', { method: 'POST', body: JSON.stringify(payload) }),

  getCategories: () => request('/api/categories'),

  admin: {
    stats: () => request('/api/admin/stats'),
    posts: () => request('/api/admin/posts'),
    post: (id) => request(`/api/admin/posts/${id}`),
    savePost: (data, id) =>
      request(id ? `/api/admin/posts/${id}` : '/api/admin/posts', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      }),
    deletePost: (id) => request(`/api/admin/posts/${id}`, { method: 'DELETE' }),
    publishPost: (id) => request(`/api/admin/posts/${id}/publish`, { method: 'POST' }),
    generateSeo: (payload) =>
      request('/api/admin/generate-post-seo', { method: 'POST', body: JSON.stringify(payload) }),
    categories: () => request('/api/admin/categories'),
    products: () => request('/api/admin/products'),
    product: (id) => request(`/api/admin/products/${id}`),
    saveProduct: (data, id) =>
      request(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      }),
    deleteProduct: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' }),
    subscribers: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/subscribers/admin?${q}`);
    },
    leads: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/leads/admin${q ? `?${q}` : ''}`);
    },
    updateLead: (id, data) =>
      request(`/api/leads/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteLead: (id) => request(`/api/leads/admin/${id}`, { method: 'DELETE' }),
    upload: async (file, bucket = 'blog-images') => {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', bucket);
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },
  },
};

export default api;
