import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmptyState, ErrorState, LoadingState } from "./AsyncState";

describe("AsyncState", () => {
  it("renders the loading state with a default and custom message", () => {
    const { rerender } = render(<LoadingState />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    rerender(<LoadingState message="Buscando produtos..." />);

    expect(screen.getByText("Buscando produtos...")).toBeInTheDocument();
  });

  it("renders empty state content with and without optional elements", () => {
    const { rerender } = render(
      <EmptyState
        title="Nada encontrado"
        description="Ajuste os filtros e tente novamente."
        action={<button type="button">Limpar filtros</button>}
      />,
    );

    expect(screen.getByText("Nada encontrado")).toBeInTheDocument();
    expect(screen.getByText("Ajuste os filtros e tente novamente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeInTheDocument();

    rerender(<EmptyState title="Sem itens" />);

    expect(screen.getByText("Sem itens")).toBeInTheDocument();
  });

  it("renders error state and calls retry when available", () => {
    const onRetry = jest.fn();
    const { rerender } = render(<ErrorState message="Falha ao carregar." onRetry={onRetry} />);

    expect(screen.getByText("Nao foi possivel carregar os dados")).toBeInTheDocument();
    expect(screen.getByText("Falha ao carregar.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<ErrorState title="Erro" />);

    expect(screen.getByText("Erro")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});

