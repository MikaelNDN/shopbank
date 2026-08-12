import { describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "./AppProviders";

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("AppProviders", () => {
  it("renders children inside global providers", () => {
    render(
      <AppProviders>
        <div>conteudo protegido pelos providers</div>
      </AppProviders>,
    );

    expect(screen.getByText("conteudo protegido pelos providers")).toBeInTheDocument();
  });
});
