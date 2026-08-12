import { apiClient } from "@/shared/http/apiClient";
import type { Address, AddressInput, AddressRepository, ViaCepAddress } from "../domain/address";
import type { BackendAddress, BackendViaCepAddress } from "./addressDtos";
import { mapAddressRequest, mapAddressResponse, mapViaCepResponse } from "./addressMapper";

export const AddressHttpRepository: AddressRepository = {
  async list(customerId: string): Promise<Address[]> {
    const { data } = await apiClient.get<BackendAddress[]>(`/api/customers/${customerId}/addresses`);
    return data.filter((address) => address.active).map(mapAddressResponse);
  },

  async getById(customerId, addressId): Promise<Address | null> {
    const list = await this.list(customerId);
    return list.find((address) => address.id === addressId) ?? null;
  },

  async create(customerId: string, input: AddressInput): Promise<Address> {
    const { data } = await apiClient.post<BackendAddress>(
      `/api/customers/${customerId}/addresses`,
      mapAddressRequest(customerId, input, input.recipientName),
    );
    return mapAddressResponse(data);
  },

  async update(customerId, addressId, input): Promise<Address> {
    const { data } = await apiClient.put<BackendAddress>(
      `/api/customers/${customerId}/addresses/${addressId}`,
      mapAddressRequest(customerId, input, input.recipientName),
    );
    return mapAddressResponse(data);
  },

  async remove(customerId, addressId): Promise<void> {
    await apiClient.delete(`/api/customers/${customerId}/addresses/${addressId}`);
  },

  async setFavorite(customerId, addressId): Promise<Address> {
    const { data } = await apiClient.patch<BackendAddress>(
      `/api/customers/${customerId}/addresses/${addressId}/favorite`,
    );
    return mapAddressResponse(data);
  },

  async lookupByZipCode(zipCode): Promise<ViaCepAddress | null> {
    const clean = zipCode.replace(/\D/g, "");
    if (clean.length !== 8) return null;

    try {
      const { data } = await apiClient.get<BackendViaCepAddress>(`/api/addresses/postal-code/${clean}`);
      return mapViaCepResponse(data);
    } catch {
      return null;
    }
  },
};

