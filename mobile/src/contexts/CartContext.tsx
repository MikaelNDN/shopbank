import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { productApi } from '@/api/productApi';
import { StorageKeys, storageService } from '@/services/storageService';
import type { CartItem } from '@/types/cart';
import type { Product } from '@/types/product';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  hasUnavailableItems: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored =
        (await storageService.get<CartItem[]>(StorageKeys.CART)) ?? [];
      const revalidated = await revalidateAgainstCatalog(stored);
      setItems(revalidated);
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback(async (next: CartItem[]) => {
    setItems(next);
    await storageService.set(StorageKeys.CART, next);
  }, []);

  const addItem = useCallback<CartContextValue['addItem']>(
    async (product, quantity = 1) => {
      if (!product.active) {
        throw new Error('Produto indisponível');
      }
      const existing = items.find((it) => it.productId === product.id);
      const nextQty = (existing?.quantity ?? 0) + quantity;
      if (nextQty > product.availableQuantity) {
        throw new Error(
          `Apenas ${product.availableQuantity} unidades em estoque`,
        );
      }
      const newItem: CartItem = existing
        ? { ...existing, quantity: nextQty, availableQuantity: product.availableQuantity }
        : {
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            quantity,
            availableQuantity: product.availableQuantity,
            active: product.active,
          };
      const next = existing
        ? items.map((it) => (it.productId === product.id ? newItem : it))
        : [...items, newItem];
      await persist(next);
    },
    [items, persist],
  );

  const updateQuantity = useCallback<CartContextValue['updateQuantity']>(
    async (productId, quantity) => {
      const target = items.find((it) => it.productId === productId);
      if (!target) return;
      if (quantity <= 0) {
        await persist(items.filter((it) => it.productId !== productId));
        return;
      }
      if (quantity > target.availableQuantity) {
        throw new Error(
          `Apenas ${target.availableQuantity} unidades em estoque`,
        );
      }
      const next = items.map((it) =>
        it.productId === productId ? { ...it, quantity } : it,
      );
      await persist(next);
    },
    [items, persist],
  );

  const removeItem = useCallback<CartContextValue['removeItem']>(
    async (productId) => {
      await persist(items.filter((it) => it.productId !== productId));
    },
    [items, persist],
  );

  const clear = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const itemCount = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.price * it.quantity, 0),
    [items],
  );

  const hasUnavailableItems = useMemo(
    () =>
      items.some(
        (it) => !it.active || it.quantity > it.availableQuantity,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      hasUnavailableItems,
    }),
    [
      items,
      itemCount,
      subtotal,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      hasUnavailableItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

async function revalidateAgainstCatalog(items: CartItem[]): Promise<CartItem[]> {
  if (items.length === 0) return items;
  const updated: CartItem[] = [];
  for (const item of items) {
    const product = await productApi.getById(item.productId);
    if (!product) continue;
    updated.push({
      ...item,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      availableQuantity: product.availableQuantity,
      active: product.active,
      quantity: Math.min(item.quantity, product.availableQuantity || 0),
    });
  }
  return updated.filter((it) => it.quantity > 0);
}
