import { NavLink, useLocation } from "react-router-dom";
import {
  Home, LayoutDashboard, ShoppingBag, ShoppingCart, MapPin, Package, CreditCard,
  Receipt, UserRound, Boxes, Tags, Users, BarChart3, Bell, Store, Wallet,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/store/auth";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const publicItems: NavItem[] = [
  { title: "Início", url: "/", icon: Home, roles: ["CLIENT"] },
  { title: "Produtos", url: "/produtos", icon: ShoppingBag, roles: ["CLIENT"] },
];

const clientItems: NavItem[] = [
  { title: "Carrinho", url: "/carrinho", icon: ShoppingCart, roles: ["CLIENT"] },
  { title: "Finalizar compra", url: "/checkout/endereco", icon: MapPin, roles: ["CLIENT"] },
  { title: "Meus Pedidos", url: "/meus-pedidos", icon: Receipt, roles: ["CLIENT"] },
  { title: "Meus Endereços", url: "/meus-enderecos", icon: MapPin, roles: ["CLIENT"] },
  { title: "Conta", url: "/conta/extrato", icon: Wallet, roles: ["CLIENT"] },
  { title: "Perfil", url: "/perfil", icon: UserRound, roles: ["CLIENT"] },
];

const adminItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { title: "Clientes", url: "/admin/clientes", icon: Users, roles: ["ADMIN"] },
  { title: "Produtos", url: "/admin/produtos", icon: ShoppingBag, roles: ["ADMIN"] },
  { title: "Categorias", url: "/admin/categorias", icon: Tags, roles: ["ADMIN"] },
  { title: "Estoque", url: "/admin/estoque", icon: Boxes, roles: ["ADMIN"] },
  { title: "Pedidos", url: "/admin/pedidos", icon: Package, roles: ["ADMIN"] },
  { title: "Pagamentos", url: "/admin/pagamentos", icon: CreditCard, roles: ["ADMIN"] },
  { title: "Financeiro", url: "/admin/financeiro", icon: Wallet, roles: ["ADMIN"] },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3, roles: ["ADMIN"] },
  { title: "Eventos", url: "/admin/eventos", icon: Bell, roles: ["ADMIN"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isClient = role === "CLIENT";
  const visibleClient = isAdmin ? [] : [...publicItems, ...(isClient ? clientItems : [])];
  const visibleAdmin = isAdmin ? adminItems : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent">
            <Store className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">ShopBank</span>
              <span className="text-[10px] text-sidebar-foreground/60">
                {isAdmin ? "Painel administrativo" : "Loja online"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleClient.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Loja</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleClient.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end={item.url === "/dashboard" || item.url === "/"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end={item.url === "/dashboard" || item.url === "/"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
