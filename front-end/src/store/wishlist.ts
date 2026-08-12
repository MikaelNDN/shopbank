import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/features/catalog/domain/catalog";
import { toast } from "sonner";
import { useEventsStore } from "./events";

interface WishlistStore {
  items: string[];
  toggleItem: (produto: Pick<Product, "id" | "name">) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

type LegacyWishlistItem = string | { id?: unknown };

function migrateItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: LegacyWishlistItem) => (typeof item === "string" ? item : item.id))
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (produto) => {
        const { items } = get();
        const exists = items.includes(produto.id);
        
        if (exists) {
          set({ items: items.filter((id) => id !== produto.id) });
          toast("Removido dos favoritos");
        } else {
          set({ items: [...items, produto.id] });
          toast.success("Adicionado aos favoritos");
          useEventsStore.getState().logEvent("PRODUCT_FAVORITED", {
            productId: produto.id,
            productName: produto.name,
          });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((itemId) => itemId !== id) }),
      isInWishlist: (id) => get().items.includes(id),
    }),
    {
      name: "shopbank-wishlist",
      migrate: (persisted: unknown) => ({
        ...(persisted as Partial<WishlistStore>),
        items: migrateItems((persisted as { items?: unknown } | null)?.items),
      }),
      version: 2,
    },
  )
);
