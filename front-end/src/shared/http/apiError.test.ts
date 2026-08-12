import { describe, expect, it } from "@jest/globals";
import { ApiError, getApiErrorMessage, normalizeApiError } from "./apiError";

describe("apiError", () => {
  it("prefers Spring message, error and title fields", () => {
    expect(getApiErrorMessage({ message: "Mensagem principal" })).toBe("Mensagem principal");
    expect(getApiErrorMessage({ error: "Erro textual" })).toBe("Erro textual");
    expect(getApiErrorMessage({ title: "Titulo do problema" })).toBe("Titulo do problema");
  });

  it("normalizes validation arrays and field maps", () => {
    expect(
      getApiErrorMessage({
        errors: [
          { field: "email", defaultMessage: "deve ser valido" },
          { field: "cpf", message: "deve conter 11 digitos" },
        ],
      }),
    ).toBe("email: deve ser valido; cpf: deve conter 11 digitos");

    expect(
      getApiErrorMessage({
        fieldErrors: {
          password: ["minimo de 6 caracteres"],
        },
      }),
    ).toBe("password: minimo de 6 caracteres");

    expect(
      getApiErrorMessage({
        violations: [{ property: "amount", message: "deve ser positivo" }],
      }),
    ).toBe("amount: deve ser positivo");
  });

  it("returns a typed ApiError with status and details", () => {
    const normalized = normalizeApiError({
      response: {
        status: 400,
        data: {
          errors: [{ field: "name", message: "obrigatorio" }],
        },
      },
    });

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.status).toBe(400);
    expect(normalized.message).toBe("name: obrigatorio");
    expect(normalized.details).toEqual([{ field: "name", message: "obrigatorio" }]);
  });

  it("falls back to Error messages and generic server errors", () => {
    expect(normalizeApiError(new Error("Falha de rede")).message).toBe("Falha de rede");
    expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
    expect(normalizeApiError({}).message).toBe("Erro ao comunicar com o servidor.");
  });
});
