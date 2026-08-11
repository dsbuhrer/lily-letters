/**
 * Data access facade — Supabase only (no Express).
 */
import * as publicApi from './supabase/public';
import * as mutations from './supabase/mutations';
import * as adminApi from './supabase/admin';
import * as ordersApi from './supabase/orders';
import { uploadImage } from './uploadImage';
import { uploadProductPdf } from './uploadPdf';
import { uploadProductVideo } from './uploadVideo';

export const api = {
  getPosts: publicApi.getPosts,
  getPost: publicApi.getPost,
  getTags: publicApi.getTags,
  getTag: publicApi.getTag,
  getProducts: publicApi.getProducts,
  getProduct: publicApi.getProduct,
  getProductReviews: publicApi.getProductReviews,
  getCategories: publicApi.getCategories,
  getProductCategories: publicApi.getProductCategories,
  subscribe: mutations.subscribe,
  submitContact: mutations.submitContact,
  getReviewInvite: mutations.getReviewInvite,
  submitReview: mutations.submitReview,
  trackPostView: mutations.trackPostView,
  createOrder: ordersApi.createOrder,
  retryOrderBrl: ordersApi.retryOrderBrl,
  validateCoupon: ordersApi.validateCoupon,

  admin: {
    stats: adminApi.getStats,
    blogAnalytics: adminApi.getBlogAnalyticsSummary,
    postAnalytics: adminApi.getPostAnalytics,
    posts: adminApi.listPosts,
    post: adminApi.getPostById,
    savePost: adminApi.savePost,
    deletePost: adminApi.deletePost,
    publishPost: adminApi.publishPost,
    generateSeo: adminApi.generatePostSeo,
    tags: adminApi.listTags,
    categories: adminApi.listCategories,
    category: adminApi.getBlogCategory,
    saveCategory: adminApi.saveBlogCategory,
    deleteCategory: adminApi.deleteBlogCategory,
    productCategories: adminApi.listProductCategories,
    productCategory: adminApi.getProductCategory,
    saveProductCategory: adminApi.saveProductCategory,
    deleteProductCategory: adminApi.deleteProductCategory,
    products: adminApi.listProductsAdmin,
    product: adminApi.getProductAdmin,
    saveProduct: adminApi.saveProduct,
    deleteProduct: adminApi.deleteProduct,
    bulkUpdateProducts: adminApi.bulkUpdateProducts,
    coupons: adminApi.listCoupons,
    coupon: adminApi.getCoupon,
    saveCoupon: adminApi.saveCoupon,
    deleteCoupon: adminApi.deleteCoupon,
    subscribers: adminApi.listSubscribers,
    contacts: adminApi.listContacts,
    updateContact: adminApi.updateContact,
    deleteContact: adminApi.deleteContact,
    orders: adminApi.listOrders,
    refundOrder: adminApi.refundOrder,
    reviews: adminApi.listReviews,
    deleteReview: adminApi.deleteReview,
    upload: uploadImage,
    uploadPdf: uploadProductPdf,
    uploadVideo: uploadProductVideo,
  },
};

export default api;
