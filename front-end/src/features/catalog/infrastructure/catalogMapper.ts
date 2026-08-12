import { toId, toNumber } from "@/shared/lib/number";
import type { Category, Inventory, Product, ProductInput } from "../domain/catalog";
import type {
  BackendCategory,
  BackendCategoryRequest,
  BackendInventory,
  BackendInventoryRequest,
  BackendProduct,
  BackendProductRequest,
} from "./catalogDtos";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function mapCategoryResponse(dto: BackendCategory): Category {
  return {
    id: toId(dto.id),
    name: dto.name,
    slug: slugify(dto.name),
    description: dto.description ?? undefined,
    active: dto.active,
  };
}

export function mapCategoryRequest(input: { name: string; description?: string; active?: boolean }): BackendCategoryRequest {
  return {
    name: input.name.trim(),
    description: input.description,
    active: input.active ?? true,
  };
}

export function mapInventoryResponse(dto: BackendInventory): Inventory {
  return {
    id: toId(dto.id),
    productId: toId(dto.productId),
    availableQuantity: dto.availableQuantity ?? 0,
    reservedQuantity: dto.reservedQuantity ?? 0,
    updatedAt: dto.updatedAt,
  };
}

export function mapProductResponse(dto: BackendProduct, inventory?: BackendInventory | Inventory | null): Product {
  return {
    id: toId(dto.id),
    categoryId: toId(dto.categoryId),
    storeId: toId(dto.storeId),
    name: dto.name,
    description: dto.description ?? "",
    price: toNumber(dto.price),
    imageUrl: dto.imageUrl ?? "",
    active: dto.active,
    availableQuantity: inventory?.availableQuantity ?? 0,
  };
}

export function mapProductRequest(input: ProductInput): BackendProductRequest {
  return {
    categoryId: Number.parseInt(input.categoryId, 10),
    storeId: Number.parseInt(input.storeId, 10),
    name: input.name.trim(),
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    active: input.active ?? true,
  };
}

export function mapInventoryRequest(productId: string, quantity: number): BackendInventoryRequest {
  return {
    productId: Number.parseInt(productId, 10),
    quantity: Math.abs(quantity),
  };
}

