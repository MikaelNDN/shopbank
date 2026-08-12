import { MOCK_CATEGORIES } from '@/services/mockData';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Category, Product } from '@/types/product';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function readAll(): Promise<Category[]> {
  return (
    (await storageService.get<Category[]>(StorageKeys.CATEGORIES)) ??
    MOCK_CATEGORIES
  );
}

async function writeAll(items: Category[]): Promise<void> {
  await storageService.set(StorageKeys.CATEGORIES, items);
}

async function countProducts(categoryId: string): Promise<number> {
  const products =
    (await storageService.get<Product[]>(StorageKeys.PRODUCTS)) ?? [];
  return products.filter((p) => p.categoryId === categoryId).length;
}

export const categoryApi = {
  async list(): Promise<Category[]> {
    return delay(await readAll());
  },

  async listWithCounts(): Promise<(Category & { productCount: number })[]> {
    const list = await readAll();
    const products =
      (await storageService.get<Product[]>(StorageKeys.PRODUCTS)) ?? [];
    return delay(
      list.map((cat) => ({
        ...cat,
        productCount: products.filter((p) => p.categoryId === cat.id).length,
      })),
    );
  },

  async getById(id: string): Promise<Category | null> {
    const list = await readAll();
    return list.find((c) => c.id === id) ?? null;
  },

  async create(name: string): Promise<Category> {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error('Nome muito curto');
    const list = await readAll();
    if (
      list.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      throw new Error('Já existe categoria com esse nome');
    }
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      slug: slugify(trimmed),
    };
    await writeAll([...list, newCategory]);
    return delay(newCategory);
  },

  async update(id: string, name: string): Promise<Category> {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error('Nome muito curto');
    const list = await readAll();
    if (
      list.some(
        (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      throw new Error('Já existe categoria com esse nome');
    }
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');
    const next = [...list];
    next[idx] = { ...next[idx], name: trimmed, slug: slugify(trimmed) };
    await writeAll(next);
    return delay(next[idx]);
  },

  async remove(id: string): Promise<void> {
    const count = await countProducts(id);
    if (count > 0) {
      throw new Error(
        `Categoria possui ${count} ${count === 1 ? 'produto' : 'produtos'} vinculado${count === 1 ? '' : 's'}.`,
      );
    }
    const list = await readAll();
    await writeAll(list.filter((c) => c.id !== id));
    await delay(undefined);
  },
};
