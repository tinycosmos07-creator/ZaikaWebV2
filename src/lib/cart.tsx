import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  remove: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
  getQty: (productId: number) => number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'fh_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product: Product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const remove = (productId: number) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const setQty = (productId: number, qty: number) => {
    if (qty <= 0) { remove(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const clear = () => setItems([]);

  const getQty = (productId: number) => items.find(i => i.product.id === productId)?.quantity ?? 0;

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const price = i.product.discount_price ? parseFloat(String(i.product.discount_price)) : parseFloat(String(i.product.price));
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, remove, setQty, clear, getQty }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
