const API_BASE = '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
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
    categories: () => request('/api/admin/categories'),
    products: () => request('/api/admin/products'),
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
    upload: async (file, bucket = 'blog-images') => {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', bucket);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  },
};

export default api;
