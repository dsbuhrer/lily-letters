/**
 * Em dev com Vite (qualquer porta, ex. 5173/5174): URL relativa → proxy /api no vite.config.js (sem CORS).
 * MAMP/Apache (porta 80, etc.): defina VITE_API_URL=http://localhost:3001 no .env.
 */
export function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    // Vite dev server — não é a porta da API
    if (isLocal && port && port !== '3001') return '';
    if (isLocal) return 'http://localhost:3001';
  }

  return '';
}

async function parseJsonResponse(res, requestUrl) {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    const hint = resolveApiBase()
      ? 'Confira se o backend está rodando (npm run dev:server) e se VITE_API_URL aponta para http://localhost:3001.'
      : 'Rode npm run dev:full (Vite + API) ou defina VITE_API_URL=http://localhost:3001 no .env e reinicie o Vite.';
    throw new Error(
      `A API retornou HTML em vez de JSON (${requestUrl}). ${hint}`,
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
  const url = `${resolveApiBase()}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await parseJsonResponse(res, url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Endpoint da API não encontrado. Reinicie o backend (npm run dev:server) ou use npm run dev:full.',
      );
    }
    const err = new Error(data.error || res.statusText);
    if (data.fields && typeof data.fields === 'object') {
      err.fields = data.fields;
    }
    throw err;
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
    request('/api/contacts', { method: 'POST', body: JSON.stringify(payload) }),

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
    contacts: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/contacts/admin${q ? `?${q}` : ''}`);
    },
    updateContact: (id, data) =>
      request(`/api/contacts/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteContact: (id) => request(`/api/contacts/admin/${id}`, { method: 'DELETE' }),
    upload: async (file, bucket = 'blog-images') => {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', bucket);
      const uploadUrl = `${resolveApiBase()}/api/admin/upload`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await parseJsonResponse(res, uploadUrl);
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },
  },
};

export default api;
