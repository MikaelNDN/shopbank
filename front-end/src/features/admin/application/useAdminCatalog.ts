import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { AdminProductFilters, ProductInput } from "@/features/catalog/domain/catalog";
import type { DashboardPeriod } from "../domain/admin";
import { AdminHttpRepository } from "../infrastructure/adminHttpRepository";
import { CatalogHttpRepository } from "@/features/catalog/infrastructure/catalogHttpRepository";

function invalidateCatalogAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.list({ scope: "admin-categories" }),
    queryFn: () => CatalogHttpRepository.listAllCategories(),
  });
}

export function useAdminProducts(filters: AdminProductFilters = {}) {
  return useQuery({
    queryKey: queryKeys.catalog.list({
      scope: "admin-products",
      search: filters.search,
      categoryId: filters.categoryId,
      includeInactive: filters.includeInactive,
      stockStatus: filters.stockStatus,
    }),
    queryFn: () => CatalogHttpRepository.listAllProducts(filters),
  });
}

export function useAdminInventory() {
  return useQuery({
    queryKey: queryKeys.admin.list({ scope: "inventory" }),
    queryFn: () => AdminHttpRepository.getInventory(),
  });
}

export function useAdminDashboard(period: DashboardPeriod = "30d") {
  return useQuery({
    queryKey: queryKeys.admin.detail(`dashboard-${period}`),
    queryFn: () => AdminHttpRepository.getDashboard(period),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; description?: string; active?: boolean }) =>
      CatalogHttpRepository.createCategory(input),
    onSuccess: () => invalidateCatalogAdmin(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; description?: string; active?: boolean } }) =>
      CatalogHttpRepository.updateCategory(id, input),
    onSuccess: () => invalidateCatalogAdmin(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CatalogHttpRepository.deleteCategory(id),
    onSuccess: () => invalidateCatalogAdmin(queryClient),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductInput) => CatalogHttpRepository.createProduct(input),
    onSuccess: (product) => {
      invalidateCatalogAdmin(queryClient);
      queryClient.setQueryData(queryKeys.catalog.detail(product.id), product);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      CatalogHttpRepository.updateProduct(id, input),
    onSuccess: (product) => {
      invalidateCatalogAdmin(queryClient);
      queryClient.setQueryData(queryKeys.catalog.detail(product.id), product);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CatalogHttpRepository.deleteProduct(id),
    onSuccess: () => invalidateCatalogAdmin(queryClient),
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, delta }: { productId: string; delta: number }) =>
      CatalogHttpRepository.updateStock(productId, delta),
    onSuccess: (product) => {
      invalidateCatalogAdmin(queryClient);
      if (product) queryClient.setQueryData(queryKeys.catalog.detail(product.id), product);
    },
  });
}
