export interface Address {
  id: string;
  customerId: string;
  label: string;
  recipientName?: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  isFavorite: boolean;
  active: boolean;
}

export interface ViaCepAddress {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export type AddressInput = Omit<Address, "id" | "customerId" | "active">;

export interface AddressRepository {
  list(customerId: string): Promise<Address[]>;
  getById(customerId: string, addressId: string): Promise<Address | null>;
  create(customerId: string, input: AddressInput): Promise<Address>;
  update(customerId: string, addressId: string, input: Partial<AddressInput>): Promise<Address>;
  remove(customerId: string, addressId: string): Promise<void>;
  setFavorite(customerId: string, addressId: string): Promise<Address>;
  lookupByZipCode(zipCode: string): Promise<ViaCepAddress | null>;
}

