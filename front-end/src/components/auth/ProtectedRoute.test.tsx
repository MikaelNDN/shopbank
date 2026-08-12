import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.Mock;
const toastError = toast.error as jest.Mock;

function authValue(overrides: Record<string, unknown>) {
  return {
    user: null,
    token: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    hasRole: jest.fn(),
    updateUser: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  };
}

function renderProtected(initialPath = "/admin") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<div>admin liberado</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/home" element={<div>client home</div>} />
        <Route path="/dashboard" element={<div>admin dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>admin via helper</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    toastError.mockReset();
  });

  it("shows a loading state while auth is being validated", () => {
    mockedUseAuth.mockReturnValue(authValue({ loading: true }));

    renderProtected();

    expect(screen.getByText("Validando sessao")).toBeInTheDocument();
  });

  it("redirects anonymous users to login", () => {
    mockedUseAuth.mockReturnValue(authValue({ loading: false }));

    renderProtected();

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the protected route for an allowed admin", () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        token: "token",
        user: { id: "1", nome: "Admin", email: "admin@shopbank.com", role: "ADMIN" },
      }),
    );

    renderProtected();

    expect(screen.getByText("admin liberado")).toBeInTheDocument();
  });

  it("supports the AdminRoute helper", () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        token: "token",
        user: { id: "1", nome: "Admin", email: "admin@shopbank.com", role: "ADMIN" },
      }),
    );

    renderAdminRoute();

    expect(screen.getByText("admin via helper")).toBeInTheDocument();
  });

  it("redirects denied client users and notifies access denial", async () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        token: "token",
        user: { id: "2", nome: "Cliente", email: "cliente@shopbank.com", role: "CLIENT" },
      }),
    );

    renderProtected();

    expect(screen.getByText("client home")).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Acesso negado para o seu perfil"));
  });
});
