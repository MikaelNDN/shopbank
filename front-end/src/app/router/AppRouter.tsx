import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Home from "@/pages/Home";
import Produtos from "@/pages/Produtos";
import ProdutoDetalhes from "@/pages/ProdutoDetalhes";
import Wishlist from "@/pages/Wishlist";
import Carrinho from "@/pages/Carrinho";
import MeusPedidos from "@/pages/MeusPedidos";
import PedidoDetalhes from "@/pages/PedidoDetalhes";
import ContaExtrato from "@/pages/ContaExtrato";
import MeusEnderecos from "@/pages/MeusEnderecos";
import Perfil from "@/pages/Perfil";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/AdminLogin";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CheckoutEndereco = lazy(() => import("@/pages/CheckoutEndereco"));
const CheckoutPedido = lazy(() => import("@/pages/CheckoutPedido"));
const CheckoutPagamento = lazy(() => import("@/pages/CheckoutPagamento"));
const AdminProdutos = lazy(() => import("@/pages/AdminProdutos"));
const AdminCategorias = lazy(() => import("@/pages/AdminCategorias"));
const AdminEstoque = lazy(() => import("@/pages/AdminEstoque"));
const AdminClientes = lazy(() => import("@/pages/AdminClientes"));
const AdminPedidos = lazy(() => import("@/pages/AdminPedidos"));
const AdminPagamentos = lazy(() => import("@/pages/AdminPagamentos"));
const AdminFinanceiro = lazy(() => import("@/pages/AdminFinanceiro"));
const AdminRelatorios = lazy(() => import("@/pages/AdminRelatorios"));
const AdminEventos = lazy(() => import("@/pages/AdminEventos"));

function PageLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas de autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/register" element={<Navigate to="/cadastro" replace />} />

        {/* Rotas públicas com layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/products" element={<Navigate to="/produtos" replace />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produtos/:id" element={<ProdutoDetalhes />} />
        </Route>

        {/* Rotas protegidas — cliente */}
        <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/meus-pedidos/:id" element={<PedidoDetalhes />} />
            <Route path="/meus-enderecos" element={<MeusEnderecos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/conta/extrato" element={<ContaExtrato />} />
            <Route path="/checkout" element={<Navigate to="/checkout/endereco" replace />} />
            <Route path="/checkout/endereco" element={<LazyPage><CheckoutEndereco /></LazyPage>} />
            <Route path="/checkout/pedido" element={<LazyPage><CheckoutPedido /></LazyPage>} />
            <Route path="/checkout/pagamento" element={<LazyPage><CheckoutPagamento /></LazyPage>} />
            <Route path="/checkout/pagamento/:orderId" element={<LazyPage><CheckoutPagamento /></LazyPage>} />
          </Route>
        </Route>

        {/* Rotas protegidas — admin */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/clientes" element={<LazyPage><AdminClientes /></LazyPage>} />
            <Route path="/admin/produtos" element={<LazyPage><AdminProdutos /></LazyPage>} />
            <Route path="/admin/categorias" element={<LazyPage><AdminCategorias /></LazyPage>} />
            <Route path="/admin/estoque" element={<LazyPage><AdminEstoque /></LazyPage>} />
            <Route path="/admin/pedidos" element={<LazyPage><AdminPedidos /></LazyPage>} />
            <Route path="/admin/pagamentos" element={<LazyPage><AdminPagamentos /></LazyPage>} />
            <Route path="/admin/financeiro" element={<LazyPage><AdminFinanceiro /></LazyPage>} />
            <Route path="/admin/relatorios" element={<LazyPage><AdminRelatorios /></LazyPage>} />
            <Route path="/admin/eventos" element={<LazyPage><AdminEventos /></LazyPage>} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}