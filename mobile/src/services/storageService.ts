import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  AUTH: '@shopbank/auth',
  CART: '@shopbank/cart',
  ORDERS: '@shopbank/orders',
  PAYMENTS: '@shopbank/payments',
  PRODUCTS: '@shopbank/products',
  CATEGORIES: '@shopbank/categories',
  ADDRESSES: '@shopbank/addresses',
  USERS: '@shopbank/users',
  SEED_VERSION: '@shopbank/seedVersion',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const storageService = {
  async get<T>(key: StorageKey): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: StorageKey, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: StorageKey): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(StorageKeys));
  },

  async multiGet<T extends Record<string, unknown>>(
    keys: StorageKey[],
  ): Promise<Partial<T>> {
    const entries = await AsyncStorage.multiGet(keys);
    const result: Record<string, unknown> = {};
    for (const [key, raw] of entries) {
      if (raw === null) continue;
      try {
        result[key] = JSON.parse(raw);
      } catch {
        // ignore malformed entry
      }
    }
    return result as Partial<T>;
  },
};
