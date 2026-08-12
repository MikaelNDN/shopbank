import { LogOut, ShoppingCart, UserCircle2, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const cartCount = useCartStore((s) => s.itens.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const isCliente = user?.role === "CLIENT";

  function handleLogout() {
    logout();
    toast.success("Sessão encerrada");
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-2">
        {isCliente && (
          <>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Favoritos">
              <Link to="/wishlist">
                <Heart className="h-5 w-5 text-destructive" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">{wishlistCount}</Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Carrinho">
              <Link to="/carrinho">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">{cartCount}</Badge>
                )}
              </Link>
            </Button>
          </>
        )}
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <UserCircle2 className="h-5 w-5" />
                <span className="hidden sm:inline text-sm">{user.nome}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm">{user.nome}</div>
                <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                <div className="text-[10px] text-primary mt-0.5">{user.role}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
