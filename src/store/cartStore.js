import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product) => {
    const items = get().items;
    if (items.some((i) => i.id === product.id)) return;
    set({ items: [...items, { ...product, quantity: 1 }] });
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  clearCart: () => set({ items: [] }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set({ isOpen: !get().isOpen }),

  get totalItems() {
    return get().items.length;
  },

  get subtotal() {
    return get().items.reduce((sum, i) => sum + i.price, 0);
  },

  get total() {
    return get().subtotal;
  },
}));

export default useCartStore;
