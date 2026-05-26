/**
 * Data access facade — Supabase only (no Express).
 */
import * as publicApi from './supabase/public';
import * as mutations from './supabase/mutations';
import * as adminApi from './supabase/admin';
import * as ordersApi from './supabase/orders';
import { uploadImage } from './uploadImage';

export const api = {
  getPosts: publicApi.getPosts,
  getPost: publicApi.getPost,
  getProducts: publicApi.getProducts,
  getProduct: publicApi.getProduct,
  getCategories: publicApi.getCategories,
  subscribe: mutations.subscribe,
  submitContact: mutations.submitContact,
  createOrder: ordersApi.createOrder,

  admin: {
    stats: adminApi.getStats,
    posts: adminApi.listPosts,
    post: adminApi.getPostById,
    savePost: adminApi.savePost,
    deletePost: adminApi.deletePost,
    publishPost: adminApi.publishPost,
    generateSeo: adminApi.generatePostSeo,
    categories: adminApi.listCategories,
    products: adminApi.listProductsAdmin,
    product: adminApi.getProductAdmin,
    saveProduct: adminApi.saveProduct,
    deleteProduct: adminApi.deleteProduct,
    subscribers: adminApi.listSubscribers,
    contacts: adminApi.listContacts,
    updateContact: adminApi.updateContact,
    deleteContact: adminApi.deleteContact,
    upload: uploadImage,
  },
};

export default api;
