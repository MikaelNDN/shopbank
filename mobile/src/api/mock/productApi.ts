import { MOCK_PRODUCTS } from '@/services/mockData';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Product, ProductFilters } from '@/types/product';

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function readProducts(): Promise<Product[]> {
  const stored = await storageService.get<Product[]>(StorageKeys.PRODUCTS);
  return stored ?? MOCK_PRODUCTS;
}

async function writeProducts(products: Product[]): Promise<void> {
  await storageService.set(StorageKeys.PRODUCTS, products);
}

interface AdminProductFilters extends ProductFilters {
  includeInactive?: boolean;
  stockStatus?: 'all' | 'low' | 'zero';
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

export const productApi = {
  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const products = await readProducts();
    return delay(applyFilters(products, filters));
  },

  async getById(id: string): Promise<Product | null> {
    const products = await readProducts();
    return delay(products.find((p) => p.id === id) ?? null);
  },

  async featured(limit = 6): Promise<Product[]> {
    const products = await readProducts();
    const active = products.filter((p) => p.active && p.availableQuantity > 0);
    return delay(active.slice(0, limit));
  },

  async related(productId: string, limit = 4): Promise<Product[]> {
    const products = await readProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) return delay([]);
    const result = products.filter(
      (p) =>
        p.id !== productId &&
        p.categoryId === target.categoryId &&
        p.active,
    );
    return delay(result.slice(0, limit));
  },

  async updateStock(productId: string, delta: number): Promise<Product | null> {
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return null;
    const next = [...products];
    next[idx] = {
      ...next[idx],
      availableQuantity: Math.max(0, next[idx].availableQuantity + delta),
    };
    await writeProducts(next);
    return next[idx];
  },

  async listAll(filters: AdminProductFilters = {}): Promise<Product[]> {
    const products = await readProducts();
    let result = filters.includeInactive
      ? [...products]
      : products.filter((p) => p.active);

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

    return delay(result);
  },

  async setStock(productId: string, quantity: number): Promise<Product | null> {
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return null;
    const next = [...products];
    next[idx] = {
      ...next[idx],
      availableQuantity: Math.max(0, Math.floor(quantity)),
    };
    await writeProducts(next);
    return delay(next[idx]);
  },

  async create(input: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const products = await readProducts();
    const newProduct: Product = {
      ...input,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await writeProducts([newProduct, ...products]);
    return delay(newProduct);
  },

  async update(
    id: string,
    input: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product> {
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');
    const next = [...products];
    next[idx] = { ...next[idx], ...input };
    await writeProducts(next);
    return delay(next[idx]);
  },

  async setActive(id: string, active: boolean): Promise<Product> {
    return this.update(id, { active });
  },

  async remove(id: string): Promise<void> {
    const orders =
      (await storageService.get<{ items: { productId: string }[] }[]>(
        StorageKeys.ORDERS,
      )) ?? [];
    const hasOrder = orders.some((o) =>
      o.items.some((it) => it.productId === id),
    );
    if (hasOrder) {
      throw new Error(
        'Produto possui pedidos vinculados. Inative em vez de excluir.',
      );
    }
    const products = await readProducts();
    await writeProducts(products.filter((p) => p.id !== id));
    await delay(undefined);
  },
};
