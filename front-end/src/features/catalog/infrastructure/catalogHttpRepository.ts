import { apiClient } from "@/shared/http/apiClient";
import type {
  AdminProductFilters,
  CatalogRepository,
  Category,
  Inventory,
  Product,
  ProductFilters,
  ProductInput,
} from "../domain/catalog";
import type { BackendCategory, BackendInventory, BackendProduct } from "./catalogDtos";
import {
  mapCategoryRequest,
  mapCategoryResponse,
  mapInventoryRequest,
  mapInventoryResponse,
  mapProductRequest,
  mapProductResponse,
} from "./catalogMapper";

async function fetchInventory(productId: string): Promise<Inventory | null> {
  try {
    const { data } = await apiClient.get<BackendInventory>(`/api/inventory/product/${productId}`);
    return mapInventoryResponse(data);
  } catch {
    return null;
  }
}

function applyProductFilters(products: Product[], filters: ProductFilters = {}, includeInactive = false): Product[] {
  let result = includeInactive ? products : products.filter((product) => product.active);

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q),
      );
    }
  }

  if (filters.categoryId) result = result.filter((product) => product.categoryId === filters.categoryId);
  if (filters.minPrice !== undefined) result = result.filter((product) => product.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((product) => product.price <= filters.maxPrice!);
  if (filters.inStockOnly) result = result.filter((product) => product.availableQuantity > 0);

  switch (filters.sortBy) {
    case "price-asc":
      return [...result].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...result].sort((a, b) => b.price - a.price);
    case "name-asc":
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return [...result].sort((a, b) => Number(b.id) - Number(a.id));
    default:
      return result;
  }
}

async function fetchProducts(): Promise<Product[]> {
  const [{ data: products }, { data: inventoryData }] = await Promise.all([
    apiClient.get<BackendProduct[]>("/api/products"),
    apiClient.get<BackendInventory[]>("/api/inventory").catch(() => ({ data: [] })),
  ]);

  const inventoryMap = new Map<string, BackendInventory>();
  for (const inv of inventoryData) {
    inventoryMap.set(String(inv.productId), inv);
  }

  return products.map((product) => {
    const inv = inventoryMap.get(String(product.id)) || null;
    return mapProductResponse(product, inv);
  });
}

export const CatalogHttpRepository: CatalogRepository = {
  async listCategories(): Promise<Category[]> {
    return (await this.listAllCategories()).filter((category) => category.active);
  },

  async listAllCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<BackendCategory[]>("/api/categories");
    return data.map(mapCategoryResponse);
  },

  async getCategory(id: string): Promise<Category | null> {
    try {
      const { data } = await apiClient.get<BackendCategory>(`/api/categories/${id}`);
      return mapCategoryResponse(data);
    } catch {
      return null;
    }
  },

  async createCategory(input): Promise<Category> {
    const { data } = await apiClient.post<BackendCategory>("/api/categories", mapCategoryRequest(input));
    return mapCategoryResponse(data);
  },

  async updateCategory(id, input): Promise<Category> {
    const { data } = await apiClient.put<BackendCategory>(`/api/categories/${id}`, mapCategoryRequest(input));
    return mapCategoryResponse(data);
  },

  async deleteCategory(id): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },

  async listProducts(filters: ProductFilters = {}): Promise<Product[]> {
    return applyProductFilters(await fetchProducts(), filters);
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const { data } = await apiClient.get<BackendProduct>(`/api/products/${id}`);
      return mapProductResponse(data, await fetchInventory(id));
    } catch {
      return null;
    }
  },

  async listAllProducts(filters: AdminProductFilters = {}): Promise<Product[]> {
    let result = applyProductFilters(await fetchProducts(), filters, !!filters.includeInactive);
    if (filters.stockStatus === "low") {
      result = result.filter((product) => product.availableQuantity > 0 && product.availableQuantity <= 5);
    }
    if (filters.stockStatus === "zero") {
      result = result.filter((product) => product.availableQuantity === 0);
    }
    return result;
  },

  async createProduct(input: ProductInput): Promise<Product> {
    const { data } = await apiClient.post<BackendProduct>("/api/products", mapProductRequest(input));
    if (input.availableQuantity && input.availableQuantity > 0) {
      await apiClient.post("/api/inventory/replenish", mapInventoryRequest(String(data.id), input.availableQuantity));
    }
    return mapProductResponse(data, await fetchInventory(String(data.id)));
  },

  async updateProduct(id, input): Promise<Product> {
    const current = await this.getProduct(id);
    if (!current) throw new Error("Produto não encontrado");

    const { data } = await apiClient.put<BackendProduct>(
      `/api/products/${id}`,
      mapProductRequest({ ...current, ...input }),
    );
    return mapProductResponse(data, await fetchInventory(id));
  },

  async deleteProduct(id): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },

  async getInventory(productId): Promise<Inventory> {
    const { data } = await apiClient.get<BackendInventory>(`/api/inventory/product/${productId}`);
    return mapInventoryResponse(data);
  },

  async updateStock(productId, delta): Promise<Product | null> {
    if (delta > 0) await apiClient.post("/api/inventory/replenish", mapInventoryRequest(productId, delta));
    if (delta < 0) await apiClient.post("/api/inventory/reserve", mapInventoryRequest(productId, delta));
    return this.getProduct(productId);
  },
};
