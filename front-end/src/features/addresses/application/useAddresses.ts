import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { AddressInput } from "../domain/address";
import { AddressHttpRepository } from "../infrastructure/addressHttpRepository";

function requireCustomerId(customerId?: string): string {
  if (!customerId) throw new Error("Sessão inválida. Entre novamente para gerenciar endereços.");
  return customerId;
}

export function useAddresses(customerId?: string) {
  return useQuery({
    queryKey: queryKeys.addresses.list({ customerId }),
    queryFn: () => AddressHttpRepository.list(requireCustomerId(customerId)),
    enabled: !!customerId,
  });
}

export function useCreateAddress(customerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddressInput) => AddressHttpRepository.create(requireCustomerId(customerId), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useUpdateAddress(customerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, input }: { addressId: string; input: AddressInput }) =>
      AddressHttpRepository.update(requireCustomerId(customerId), addressId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useDeleteAddress(customerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => AddressHttpRepository.remove(requireCustomerId(customerId), addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useSetFavoriteAddress(customerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => AddressHttpRepository.setFavorite(requireCustomerId(customerId), addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useLookupPostalCode() {
  return useMutation({
    mutationFn: AddressHttpRepository.lookupByZipCode,
  });
}
