import type { Numeric } from "@/shared/lib/number";

export interface BackendCategory {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface BackendProduct {
  id: number;
  categoryId: number;
  storeId: number;
  name: string;
  description?: string | null;
  price: Numeric;
  imageUrl?: string | null;
  active: boolean;
}

export interface BackendInventory {
  id: number;
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

export interface BackendCategoryRequest {
  name: string;
  description?: string;
  active?: boolean;
}

export interface BackendProductRequest {
  categoryId: number;
  storeId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
}

export interface BackendInventoryRequest {
  productId: number;
  quantity: number;
}

