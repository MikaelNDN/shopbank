export interface BackendAddress {
  id: number;
  customerId: number;
  label?: string | null;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  reference?: string | null;
  favorite: boolean;
  active: boolean;
}

export interface BackendAddressRequest {
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
}

export interface BackendViaCepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
}

