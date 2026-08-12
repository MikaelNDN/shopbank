import { describe, expect, it } from "@jest/globals";
import { mapLoginSession, mapRegisterRequest, mapUserResponse } from "./authMapper";

describe("authMapper", () => {
  it("maps backend users using customer id when available", () => {
    expect(
      mapUserResponse({
        id: 1,
        email: "cliente@loja.com",
        role: "CLIENT",
        active: true,
        customerId: 55,
        fullName: "Cliente Loja",
        cpf: "12345678901",
      }),
    ).toEqual({
      id: "55",
      name: "Cliente Loja",
      email: "cliente@loja.com",
      cpf: "12345678901",
      role: "CLIENT",
      active: true,
      customerId: "55",
    });
  });

  it("falls back to user id and email prefix when customer profile fields are absent", () => {
    expect(
      mapUserResponse({
        id: 1,
        email: "semnome@loja.com",
        role: "ADMIN",
        active: true,
      }),
    ).toEqual({
      id: "1",
      name: "semnome",
      email: "semnome@loja.com",
      cpf: undefined,
      role: "ADMIN",
      active: true,
      customerId: undefined,
    });
  });

  it("maps register payload and strips CPF masks", () => {
    expect(
      mapRegisterRequest({
        name: " Cliente Loja ",
        email: "cliente@loja.com",
        cpf: "123.456.789-01",
        password: "123456",
      }),
    ).toEqual({
      fullName: "Cliente Loja",
      email: "cliente@loja.com",
      cpf: "12345678901",
      password: "123456",
    });
  });

  it("builds a fallback login session when /me is unavailable", () => {
    expect(mapLoginSession({ token: "jwt" }, { email: "admin@loja.com", password: "123456" })).toEqual({
      token: "jwt",
      user: {
        id: "admin@loja.com",
        name: "admin",
        email: "admin@loja.com",
        role: "CLIENT",
        active: true,
      },
    });
  });

  it("uses JWT claims only as login fallback when /me is unavailable", () => {
    const payload = btoa(
      JSON.stringify({
        sub: "admin@loja.com",
        role: "ADMIN",
        id: 9,
        fullName: "Admin Loja",
      }),
    );
    const token = `header.${payload}.signature`;

    expect(mapLoginSession({ token }, { email: "admin@loja.com", password: "123456" })).toEqual({
      token,
      user: {
        id: "9",
        name: "Admin Loja",
        email: "admin@loja.com",
        cpf: undefined,
        role: "ADMIN",
        active: true,
        customerId: undefined,
      },
    });
  });

  it("builds login sessions using /me data when available", () => {
    expect(
      mapLoginSession(
        { token: "jwt" },
        { email: "cliente@loja.com", password: "123456" },
        {
          id: 1,
          email: "cliente@loja.com",
          role: "CLIENT",
          active: true,
          customerId: 2,
          fullName: "Cliente",
        },
      ),
    ).toMatchObject({
      token: "jwt",
      user: {
        id: "2",
        name: "Cliente",
      },
    });
  });
});
