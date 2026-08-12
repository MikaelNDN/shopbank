import { apiClient } from '@/api/apiClient';
import type { Product, ProductFilters } from '@/types/product';

const DEFAULT_STORE_ID = 1;

interface BackendProduct {
  id: number;
  categoryId: number;
  storeId: number;
  name: string;
  description?: string;
  price: number | string;
  imageUrl?: string;
  active: boolean;
}

interface BackendInventory {
  id: number;
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

interface AdminProductFilters extends ProductFilters {
  includeInactive?: boolean;
  stockStatus?: 'all' | 'low' | 'zero';
}

async function fetchInventory(productId: number): Promise<number> {
  try {
    const { data } = await apiClient.get<BackendInventory>(
      `/api/inventory/product/${productId}`,
    );
    return data.availableQuantity ?? 0;
  } catch {
    return 0;
  }
}

async function toProduct(backend: BackendProduct): Promise<Product> {
  const availableQuantity = await fetchInventory(backend.id);
  return {
    id: String(backend.id),
    name: backend.name,
    description: backend.description ?? '',
    categoryId: String(backend.categoryId),
    price:
      typeof backend.price === 'string'
        ? Number.parseFloat(backend.price)
        : backend.price,
    imageUrl: backend.imageUrl ?? '',
    availableQuantity,
    active: backend.active,
    createdAt: new Date().toISOString(),
  };
}

function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  let result = products.filter((p) => p.active);

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
  }
  if (filters.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId);
  }
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.availableQuantity > 0);
  }

  switch (filters.sortBy) {
    case 'price-asc':
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      result = [...result].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      break;
    default:
      break;
  }

  return result;
}

async function fetchAll(): Promise<Product[]> {
  const { data } = await apiClient.get<BackendProduct[]>('/api/products');
  return Promise.all(data.map(toProduct));
}

export const productApiHttp = {
  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const all = await fetchAll();
    return applyFilters(all, filters);
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data } = await apiClient.get<BackendProduct>(
        `/api/products/${id}`,
      );
      return await toProduct(data);
    } catch {
      return null;
    }
  },

  async featured(limit = 6): Promise<Product[]> {
    const all = await fetchAll();
    return all
      .filter((p) => p.active && p.availableQuantity > 0)
      .slice(0, limit);
  },

  async related(productId: string, limit = 4): Promise<Product[]> {
    const all = await fetchAll();
    const target = all.find((p) => p.id === productId);
    if (!target) return [];
    return all
      .filter(
        (p) =>
          p.id !== productId &&
          p.categoryId === target.categoryId &&
          p.active,
      )
      .slice(0, limit);
  },

  async listAll(filters: AdminProductFilters = {}): Promise<Product[]> {
    const all = await fetchAll();
    let result = filters.includeInactive ? all : all.filter((p) => p.active);

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q.length > 0) {
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q),
        );
      }
    }
    if (filters.categoryId) {
      result = result.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters.stockStatus === 'low') {
      result = result.filter(
        (p) => p.availableQuantity > 0 && p.availableQuantity <= 5,
      );
    } else if (filters.stockStatus === 'zero') {
      result = result.filter((p) => p.availableQuantity === 0);
    }
    return result;
  },

  async updateStock(productId: string, delta: number): Promise<Product | null> {
    const id = Number.parseInt(productId, 10);
    if (delta > 0) {
      await apiClient.post('/api/inventory/replenish', {
        productId: id,
        quantity: delta,
      });
    } else if (delta < 0) {
      await apiClient.post('/api/inventory/reserve', {
        productId: id,
        quantity: -delta,
      });
    }
    return this.getById(productId);
  },

  async setStock(productId: string, quantity: number): Promise<Product | null> {
    const current = await this.getById(productId);
    if (!current) return null;
    const diff = quantity - current.availableQuantity;
    if (diff !== 0) {
      await this.updateStock(productId, diff);
    }
    return this.getById(productId);
  },

  async create(input: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const { data } = await apiClient.post<BackendProduct>('/api/products', {
      categoryId: Number.parseInt(input.categoryId, 10),
      storeId: DEFAULT_STORE_ID,
      name: input.name,
      description: input.description,
      price: input.price,
      imageUrl: input.imageUrl,
      active: input.active,
    });
    if (input.availableQuantity > 0) {
      await apiClient.post('/api/inventory/replenish', {
        productId: data.id,
        quantity: input.availableQuantity,
      });
    }
    return toProduct(data);
  },

  async update(
    id: string,
    input: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product> {
    const current = await apiClient.get<BackendProduct>(`/api/products/${id}`);
    const merged = {
      categoryId:
        input.categoryId !== undefined
          ? Number.parseInt(input.categoryId, 10)
          : current.data.categoryId,
      storeId: current.data.storeId,
      name: input.name ?? current.data.name,
      description: input.description ?? current.data.description,
      price: input.price ?? current.data.price,
      imageUrl: input.imageUrl ?? current.data.imageUrl,
      active: input.active ?? current.data.active,
    };
    const { data } = await apiClient.put<BackendProduct>(
      `/api/products/${id}`,
      merged,
    );
    return toProduct(data);
  },

  async setActive(id: string, active: boolean): Promise<Product> {
    return this.update(id, { active });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },
};
