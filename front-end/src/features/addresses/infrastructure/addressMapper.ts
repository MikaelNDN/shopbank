import { toId } from "@/shared/lib/number";
import type { Address, AddressInput, ViaCepAddress } from "../domain/address";
import type { BackendAddress, BackendAddressRequest, BackendViaCepAddress } from "./addressDtos";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function mapAddressResponse(dto: BackendAddress): Address {
  return {
    id: toId(dto.id),
    customerId: toId(dto.customerId),
    label: dto.label ?? "Endereco",
    recipientName: dto.recipientName,
    zipCode: dto.postalCode,
    street: dto.street,
    number: dto.number,
    complement: dto.complement ?? undefined,
    neighborhood: dto.district,
    city: dto.city,
    state: dto.state,
    reference: dto.reference ?? undefined,
    isFavorite: dto.favorite,
    active: dto.active,
  };
}

export function mapAddressRequest(
  customerId: string,
  input: Partial<AddressInput>,
  fallbackRecipientName = "Cliente",
): BackendAddressRequest {
  return {
    customerId: Number.parseInt(customerId, 10),
    label: input.label ?? "Endereco",
    recipientName: input.recipientName ?? fallbackRecipientName,
    postalCode: digits(input.zipCode ?? ""),
    street: input.street ?? "",
    number: input.number ?? "",
    complement: input.complement,
    district: input.neighborhood ?? "",
    city: input.city ?? "",
    state: input.state?.toUpperCase() ?? "",
    reference: input.reference,
    favorite: !!input.isFavorite,
  };
}

export function mapViaCepResponse(dto: BackendViaCepAddress): ViaCepAddress {
  return {
    zipCode: dto.cep,
    street: dto.logradouro,
    neighborhood: dto.bairro,
    city: dto.localidade,
    state: dto.uf,
    complement: dto.complemento,
  };
}

