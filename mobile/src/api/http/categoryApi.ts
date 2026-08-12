import { apiClient } from '@/api/apiClient';
import type { Category, Product } from '@/types/product';

interface BackendCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface BackendProduct {
  id: number;
  categoryId: number;
  storeId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  active: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toCategory(c: BackendCategory): Category {
  return {
    id: String(c.id),
    name: c.name,
    slug: slugify(c.name),
  };
}

export const categoryApiHttp = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<BackendCategory[]>('/api/categories');
    return data.filter((c) => c.active).map(toCategory);
  },

  async listWithCounts(): Promise<(Category & { productCount: number })[]> {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      apiClient.get<BackendCategory[]>('/api/categories'),
      apiClient.get<BackendProduct[]>('/api/products'),
    ]);
    return cats
      .filter((c) => c.active)
      .map((c) => ({
        ...toCategory(c),
        productCount: prods.filter((p) => p.categoryId === c.id).length,
      }));
  },

  async getById(id: string): Promise<Category | null> {
    try {
      const { data } = await apiClient.get<BackendCategory>(
        `/api/categories/${id}`,
      );
      return toCategory(data);
    } catch {
      return null;
    }
  },

  async create(name: string): Promise<Category> {
    const { data } = await apiClient.post<BackendCategory>('/api/categories', {
      name: name.trim(),
      active: true,
    });
    return toCategory(data);
  },

  async update(id: string, name: string): Promise<Category> {
    const { data } = await apiClient.put<BackendCategory>(
      `/api/categories/${id}`,
      { name: name.trim(), active: true },
    );
    return toCategory(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },
};
