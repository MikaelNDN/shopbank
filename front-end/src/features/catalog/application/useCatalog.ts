import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { QueryKeyPart } from "@/shared/lib/queryKeys";
import type { ProductFilters } from "../domain/catalog";
import { CatalogHttpRepository } from "../infrastructure/catalogHttpRepository";

const CATALOG_STALE_TIME = 60_000;

function normalizeFilters(filters: ProductFilters = {}): ProductFilters {
  return {
    search: filters.search?.trim() || undefined,
    categoryId: filters.categoryId && filters.categoryId !== "ALL" ? filters.categoryId : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStockOnly: filters.inStockOnly || undefined,
    sortBy: filters.sortBy && filters.sortBy !== "relevance" ? filters.sortBy : undefined,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.list({ scope: "categories" }),
    queryFn: () => CatalogHttpRepository.listCategories(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProducts(filters: ProductFilters = {}) {
  const normalized = normalizeFilters(filters);
  const queryFilters = normalized as Record<string, QueryKeyPart>;

  return useQuery({
    queryKey: queryKeys.catalog.list(queryFilters),
    queryFn: () => CatalogHttpRepository.listProducts(normalized),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: queryKeys.catalog.detail(id ?? "missing"),
    queryFn: () => (id ? CatalogHttpRepository.getProduct(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useFeaturedProducts(limit = 4) {
  return useQuery({
    queryKey: [...queryKeys.catalog.all, "featured", limit] as const,
    queryFn: async () => {
      const products = await CatalogHttpRepository.listProducts({
        inStockOnly: true,
        sortBy: "relevance",
      });
      return products.slice(0, limit);
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useRelatedProducts(productId?: string, limit = 4) {
  return useQuery({
    queryKey: [...queryKeys.catalog.all, "related", productId ?? "missing", limit] as const,
    queryFn: async () => {
      if (!productId) return [];

      const product = await CatalogHttpRepository.getProduct(productId);
      if (!product) return [];

      const products = await CatalogHttpRepository.listProducts({
        categoryId: product.categoryId,
        inStockOnly: true,
      });

      return products.filter((item) => item.id !== product.id).slice(0, limit);
    },
    enabled: !!productId,
    staleTime: CATALOG_STALE_TIME,
  });
}
