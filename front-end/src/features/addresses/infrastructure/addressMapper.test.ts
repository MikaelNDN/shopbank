import { describe, expect, it } from "@jest/globals";
import { mapAddressRequest, mapAddressResponse, mapViaCepResponse } from "./addressMapper";

describe("addressMapper", () => {
  it("maps backend address responses", () => {
    expect(
      mapAddressResponse({
        id: 1,
        customerId: 2,
        label: null,
        recipientName: "Cliente",
        postalCode: "01001000",
        street: "Praca da Se",
        number: "100",
        district: "Se",
        city: "Sao Paulo",
        state: "SP",
        favorite: true,
        active: true,
      }),
    ).toMatchObject({
      id: "1",
      customerId: "2",
      label: "Endereco",
      zipCode: "01001000",
      neighborhood: "Se",
      isFavorite: true,
      active: true,
    });
  });

  it("preserves optional address response fields when present", () => {
    expect(
      mapAddressResponse({
        id: 1,
        customerId: 2,
        label: "Trabalho",
        recipientName: "Cliente",
        postalCode: "01001000",
        street: "Praca da Se",
        number: "100",
        complement: "Apto 1",
        district: "Se",
        city: "Sao Paulo",
        state: "SP",
        reference: "Portaria",
        favorite: false,
        active: false,
      }),
    ).toMatchObject({
      label: "Trabalho",
      complement: "Apto 1",
      reference: "Portaria",
      isFavorite: false,
      active: false,
    });
  });

  it("maps address writes and CEP responses", () => {
    expect(
      mapAddressRequest("2", {
        label: "Casa",
        zipCode: "01001-000",
        street: "Praca da Se",
        number: "100",
        neighborhood: "Se",
        city: "Sao Paulo",
        state: "sp",
        isFavorite: true,
      }),
    ).toMatchObject({
      customerId: 2,
      label: "Casa",
      recipientName: "Cliente",
      postalCode: "01001000",
      state: "SP",
      favorite: true,
    });

    expect(
      mapViaCepResponse({
        cep: "01001-000",
        logradouro: "Praca da Se",
        bairro: "Se",
        localidade: "Sao Paulo",
        uf: "SP",
      }),
    ).toEqual({
      zipCode: "01001-000",
      street: "Praca da Se",
      neighborhood: "Se",
      city: "Sao Paulo",
      state: "SP",
      complement: undefined,
    });
  });

  it("maps empty address writes with defaults", () => {
    expect(mapAddressRequest("2", {})).toEqual({
      customerId: 2,
      label: "Endereco",
      recipientName: "Cliente",
      postalCode: "",
      street: "",
      number: "",
      complement: undefined,
      district: "",
      city: "",
      state: "",
      reference: undefined,
      favorite: false,
    });
  });
});
