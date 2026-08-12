import { StorageKeys, storageService } from '@/services/storageService';
import type { Address, ViaCepResponse } from '@/types/address';
import { unformatZipCode } from '@/utils/formatZipCode';

type AddressInput = Omit<Address, 'id' | 'customerId'>;

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function readAll(): Promise<Address[]> {
  return (await storageService.get<Address[]>(StorageKeys.ADDRESSES)) ?? [];
}

async function writeAll(addresses: Address[]): Promise<void> {
  await storageService.set(StorageKeys.ADDRESSES, addresses);
}

function ensureSingleFavorite(
  addresses: Address[],
  favoriteId?: string,
): Address[] {
  if (!favoriteId) return addresses;
  return addresses.map((a) => ({
    ...a,
    isFavorite: a.id === favoriteId,
  }));
}

export const addressApi = {
  async list(customerId: string): Promise<Address[]> {
    const all = await readAll();
    return delay(all.filter((a) => a.customerId === customerId));
  },

  async getById(addressId: string): Promise<Address | null> {
    const all = await readAll();
    return delay(all.find((a) => a.id === addressId) ?? null);
  },

  async create(
    customerId: string,
    input: AddressInput,
  ): Promise<Address> {
    const all = await readAll();
    const existing = all.filter((a) => a.customerId === customerId);
    const isFavorite = input.isFavorite || existing.length === 0;
    const newAddress: Address = {
      ...input,
      id: `addr-${Date.now()}`,
      customerId,
      isFavorite,
    };
    let next = [...all, newAddress];
    if (isFavorite) {
      next = next.map((a) =>
        a.customerId === customerId
          ? { ...a, isFavorite: a.id === newAddress.id }
          : a,
      );
    }
    await writeAll(next);
    return delay(newAddress);
  },

  async update(
    addressId: string,
    input: Partial<AddressInput>,
  ): Promise<Address> {
    const all = await readAll();
    const idx = all.findIndex((a) => a.id === addressId);
    if (idx === -1) throw new Error('Endereço não encontrado');
    const merged: Address = { ...all[idx], ...input } as Address;
    let next = [...all];
    next[idx] = merged;
    if (input.isFavorite) {
      next = next.map((a) =>
        a.customerId === merged.customerId
          ? { ...a, isFavorite: a.id === addressId }
          : a,
      );
    }
    await writeAll(next);
    return delay(merged);
  },

  async remove(addressId: string): Promise<void> {
    const all = await readAll();
    const target = all.find((a) => a.id === addressId);
    if (!target) return;
    let next = all.filter((a) => a.id !== addressId);
    const remaining = next.filter((a) => a.customerId === target.customerId);
    if (target.isFavorite && remaining.length > 0) {
      const firstId = remaining[0].id;
      next = ensureSingleFavorite(next, firstId);
    }
    await writeAll(next);
    return delay(undefined);
  },

  async setFavorite(addressId: string): Promise<Address> {
    const all = await readAll();
    const target = all.find((a) => a.id === addressId);
    if (!target) throw new Error('Endereço não encontrado');
    const next = all.map((a) =>
      a.customerId === target.customerId
        ? { ...a, isFavorite: a.id === addressId }
        : a,
    );
    await writeAll(next);
    return delay({ ...target, isFavorite: true });
  },

  async lookupByZipCode(zipCode: string): Promise<ViaCepResponse | null> {
    const cleaned = unformatZipCode(zipCode);
    if (cleaned.length !== 8) return null;
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleaned}/json/`,
      );
      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) return null;
      return data;
    } catch {
      return null;
    }
  },
};
