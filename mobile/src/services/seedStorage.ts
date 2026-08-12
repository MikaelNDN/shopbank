import { StorageKeys, storageService } from './storageService';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_USERS } from './mockData';

const SEED_VERSION = '1';

export async function seedStorage(force = false): Promise<void> {
  const current = await storageService.get<string>(StorageKeys.SEED_VERSION);
  if (!force && current === SEED_VERSION) return;

  await Promise.all([
    storageService.set(StorageKeys.PRODUCTS, MOCK_PRODUCTS),
    storageService.set(StorageKeys.CATEGORIES, MOCK_CATEGORIES),
    storageService.set(StorageKeys.USERS, MOCK_USERS),
  ]);

  await storageService.set(StorageKeys.SEED_VERSION, SEED_VERSION);
}
