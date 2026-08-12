import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartItemSnapshot } from "../domain/cart";

export type { CartItem } from "../domain/cart";

interface CartState {
  itens: CartItem[];
  selectedAddressId: string | null;
  pedidoId: string | null;
  add: (item: CartItemSnapshot, qtd?: number) => void;
  remove: (productId: string) => void;
  setQuantidade: (productId: string, qtd: number) => void;
  setSelectedAddressId: (addressId: string | null) => void;
  setPedidoId: (id: string | null) => void;
  limpar: () => void;
  subtotal: () => number;
  total: () => number;
}

type LegacyCartItem = Partial<CartItem> & {
  id?: string;
  nome?: string;
  preco?: number;
  quantidade?: number;
  estoque?: number;
};

function clampQuantity(quantity: number, availableQuantity: number): number {
  return Math.max(1, Math.min(quantity, Math.max(availableQuantity, 1)));
}

function normalizeItem(item: CartItemSnapshot, quantity: number): CartItem | null {
  const availableQuantity = Math.max(0, Number(item.availableQuantity) || 0);
  if (availableQuantity <= 0) return null;

  return {
    productId: item.productId,
    name: item.name,
    price: Number(item.price) || 0,
    availableQuantity,
    imageUrl: item.imageUrl,
    quantity: clampQuantity(quantity, availableQuantity),
  };
}

function migrateItem(item: LegacyCartItem): CartItem | null {
  const productId = item.productId ?? item.id;
  if (!productId) return null;

  return normalizeItem(
    {
      productId,
      name: item.name ?? item.nome ?? "Produto",
      price: item.price ?? item.preco ?? 0,
      availableQuantity: item.availableQuantity ?? item.estoque ?? 1,
      imageUrl: item.imageUrl,
    },
    item.quantity ?? item.quantidade ?? 1,
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itens: [],
      selectedAddressId: null,
      pedidoId: null,
      add: (item, qtd = 1) => {
        const normalized = normalizeItem(item, qtd);
        if (!normalized) return;

        const itens = [...get().itens];
        const idx = itens.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          itens[idx] = {
            ...itens[idx],
            ...normalized,
            quantity: clampQuantity(itens[idx].quantity + qtd, normalized.availableQuantity),
          };
        } else {
          itens.push(normalized);
        }
        set({ itens, pedidoId: null });
      },
      remove: (productId) => {
        set({ itens: get().itens.filter((i) => i.productId !== productId), pedidoId: null });
      },
      setQuantidade: (productId, qtd) => {
        const itens = get().itens.map((i) =>
          i.productId === productId ? { ...i, quantity: clampQuantity(qtd, i.availableQuantity) } : i,
        );
        set({ itens, pedidoId: null });
      },
      setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId, pedidoId: null }),
      setPedidoId: (pedidoId) => set({ pedidoId }),
      limpar: () => set({ itens: [], selectedAddressId: null, pedidoId: null }),
      subtotal: () => get().itens.reduce((s, i) => s + i.price * i.quantity, 0),
      total: () => get().subtotal(),
    }),
    {
      name: "shopbank-cart",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<CartState> & {
          itens?: LegacyCartItem[];
          selectedAddressId?: string | null;
        };

        return {
          ...state,
          itens: (state.itens ?? []).map(migrateItem).filter((item): item is CartItem => item !== null),
          selectedAddressId: state.selectedAddressId ?? null,
          pedidoId: state.pedidoId ?? null,
        };
      },
    },
  ),
);
