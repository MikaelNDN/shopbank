export type QueryKeyPart = string | number | boolean | null | undefined;

export function createQueryKeys(scope: string) {
  const all = [scope] as const;

  return {
    all,
    lists: () => [...all, "list"] as const,
    list: (filters?: Record<string, QueryKeyPart>) => [...all, "list", filters ?? {}] as const,
    details: () => [...all, "detail"] as const,
    detail: (id: string | number) => [...all, "detail", String(id)] as const,
  };
}

export const queryKeys = {
  auth: createQueryKeys("auth"),
  catalog: createQueryKeys("catalog"),
  cart: createQueryKeys("cart"),
  checkout: createQueryKeys("checkout"),
  orders: createQueryKeys("orders"),
  payments: createQueryKeys("payments"),
  account: createQueryKeys("account"),
  addresses: createQueryKeys("addresses"),
  admin: createQueryKeys("admin"),
};

