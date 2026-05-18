import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";

export interface CartItem {
  productId: string;
  name: string;
  variant: string | null;
  size: string | null;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  items: Record<string, CartItem>;
  setQuantity: (productId: string, item: Omit<CartItem, "quantity">, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "leo-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Record<string, CartItem>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setQuantity: CartContextValue["setQuantity"] = (productId, item, qty) => {
    setItems((prev) => {
      const next = { ...prev };
      if (!qty || qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = { ...item, quantity: qty };
      }
      return next;
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

  const clear = () => setItems({});

  const { total, itemCount } = useMemo(() => {
    const list = Object.values(items);
    return {
      total: list.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      itemCount: list.reduce((s, i) => s + i.quantity, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, setQuantity, removeItem, clear, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
