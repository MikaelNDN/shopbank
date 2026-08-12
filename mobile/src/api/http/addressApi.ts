import { apiClient } from '@/api/apiClient';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Address, ViaCepResponse } from '@/types/address';
import type { AuthResponse } from '@/types/user';
import { unformatZipCode } from '@/utils/formatZipCode';

interface BackendAddress {
  id: number;
  customerId: number;
  label?: string;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  reference?: string;
  favorite: boolean;
  active: boolean;
}

interface BackendViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

function toAddress(b: BackendAddress): Address {
  return {
    id: String(b.id),
    customerId: String(b.customerId),
    label: b.label ?? 'Endereço',
    zipCode: b.postalCode,
    street: b.street,
    number: b.number,
    complement: b.complement,
    neighborhood: b.district,
    city: b.city,
    state: b.state,
    isFavorite: !!b.favorite,
  };
}

async function getRecipientName(): Promise<string> {
  const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
  return auth?.user?.name ?? 'Cliente';
}

function buildPayload(
  customerId: string,
  input: Partial<Omit<Address, 'id' | 'customerId'>>,
  recipientName: string,
) {
  return {
    customerId: Number.parseInt(customerId, 10),
    label: input.label ?? 'Endereço',
    recipientName,
    postalCode: input.zipCode ? unformatZipCode(input.zipCode) : undefined,
    street: input.street,
    number: input.number,
    complement: input.complement,
    district: input.neighborhood,
    city: input.city,
    state: input.state?.toUpperCase(),
    favorite: !!input.isFavorite,
  };
}

export const addressApiHttp = {
  async list(customerId: string): Promise<Address[]> {
    const id = Number.parseInt(customerId, 10);
    const { data } = await apiClient.get<BackendAddress[]>(
      `/api/customers/${id}/addresses`,
    );
    return data.filter((a) => a.active).map(toAddress);
  },

  async getById(addressId: string): Promise<Address | null> {
    const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
    if (!auth?.user) return null;
    const list = await this.list(auth.user.id);
    return list.find((a) => a.id === addressId) ?? null;
  },

  async create(
    customerId: string,
    input: Omit<Address, 'id' | 'customerId'>,
  ): Promise<Address> {
    const recipientName = await getRecipientName();
    const id = Number.parseInt(customerId, 10);
    const { data } = await apiClient.post<BackendAddress>(
      `/api/customers/${id}/addresses`,
      buildPayload(customerId, input, recipientName),
    );
    return toAddress(data);
  },

  async update(
    addressId: string,
    input: Partial<Omit<Address, 'id' | 'customerId'>>,
  ): Promise<Address> {
    const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
    if (!auth?.user) throw new Error('Sessão inválida');
    const recipientName = await getRecipientName();
    const customerIdNum = Number.parseInt(auth.user.id, 10);
    const { data } = await apiClient.put<BackendAddress>(
      `/api/customers/${customerIdNum}/addresses/${addressId}`,
      buildPayload(auth.user.id, input, recipientName),
    );
    return toAddress(data);
  },

  async remove(addressId: string): Promise<void> {
    const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
    if (!auth?.user) throw new Error('Sessão inválida');
    const customerIdNum = Number.parseInt(auth.user.id, 10);
    await apiClient.delete(
      `/api/customers/${customerIdNum}/addresses/${addressId}`,
    );
  },

  async setFavorite(addressId: string): Promise<Address> {
    const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
    if (!auth?.user) throw new Error('Sessão inválida');
    const customerIdNum = Number.parseInt(auth.user.id, 10);
    const { data } = await apiClient.patch<BackendAddress>(
      `/api/customers/${customerIdNum}/addresses/${addressId}/favorite`,
    );
    return toAddress(data);
  },

  async lookupByZipCode(zipCode: string): Promise<ViaCepResponse | null> {
    const cleaned = unformatZipCode(zipCode);
    if (cleaned.length !== 8) return null;
    try {
      const { data } = await apiClient.get<BackendViaCep>(
        `/api/addresses/postal-code/${cleaned}`,
      );
      return {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        complemento: '',
      };
    } catch {
      return null;
    }
  },
};
