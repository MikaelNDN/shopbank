import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/common/ProductImage";
import { useAuth } from "@/context/AuthContext";
import { useCategories, useFeaturedProducts, useProducts } from "@/features/catalog/application/useCatalog";
import type { Product } from "@/features/catalog/domain/catalog";
import { useEventsStore } from "@/store/events";
import { useWishlistStore } from "@/store/wishlist";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function getProductIdFromEventPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("productId" in payload)) return null;
  const productId = (payload as { productId?: unknown }).productId;
  return typeof productId === "string" ? productId : null;
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link key={product.id} to={`/produtos/${product.id}`} className="group block">
          <Card className="overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/40 hover:shadow-elevated">
            <ProductImage images={[product.imageUrl]} alt={product.name} />
            <CardContent className="p-4 space-y-1">
              <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h3>
              <div className="text-base font-semibold pt-1">{BRL.format(product.price)}</div>
              <div className="text-xs text-muted-foreground">
                {product.availableQuantity > 0 ? `${product.availableQuantity} em estoque` : "Indisponível"}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const wishlistIds = useWishlistStore((state) => state.items);
  const events = useEventsStore((state) => state.events);

  const featuredQuery = useFeaturedProducts(4);
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const recentlyViewed = useMemo(() => {
    const viewedIds = Array.from(
      new Set(
        events
          .filter((event) => event.type === "PRODUCT_VIEWED")
          .map((event) => getProductIdFromEventPayload(event.payload))
          .filter((productId): productId is string => productId !== null),
      ),
    ).slice(0, 4);

    return products.filter((product) => viewedIds.includes(product.id));
  }, [events, products]);

  const recommended = useMemo(() => {
    const favoriteCategoryIds = new Set(
      products.filter((product) => wishlistIds.includes(product.id)).map((product) => product.categoryId),
    );

    return products
      .filter((product) => favoriteCategoryIds.has(product.categoryId) && !wishlistIds.includes(product.id))
      .slice(0, 4);
  }, [products, wishlistIds]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/produtos?busca=${encodeURIComponent(query)}` : "/produtos");
  }

  return (
    <div className="space-y-10 pb-8">
      <section className="mx-auto w-full max-w-7xl space-y-5 px-4 md:px-6">
        <div className="pt-2 md:pt-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Olá, {user?.nome?.split(" ")[0] ?? "cliente"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">O que você quer comprar hoje?</p>

          <form onSubmit={submitSearch} className="mt-5 flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produtos"
                className="h-11 rounded-lg bg-card pl-9"
              />
            </div>
            <Button type="submit" className="h-11 rounded-lg px-5">
              Buscar
            </Button>
          </form>
        </div>

        <Link
          to="/produtos"
          className="group block overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-soft transition-colors hover:bg-primary/95 md:p-6"
        >
          <p className="text-xs font-semibold uppercase text-primary-foreground/80">Destaque da semana</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Frete grátis acima de R$ 199</h2>
            <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="mt-1 text-sm text-primary-foreground/90">Aproveite e abasteça seu carrinho.</p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Comprar agora
          </span>
        </Link>
      </section>

      <section className="px-4 md:px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Categorias</h2>
            <p className="text-sm text-muted-foreground">Explore por departamento</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(categoriesQuery.data ?? []).map((category) => (
            <Button key={category.id} asChild variant="outline" className="shrink-0">
              <Link to={`/produtos?categoria=${category.id}`}>{category.name}</Link>
            </Button>
          ))}
          {categoriesQuery.isLoading && Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-32 rounded-md" />
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="px-4 md:px-6 max-w-7xl mx-auto w-full animate-fade-in">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">Vistos recentemente</h2>
            <p className="text-sm text-muted-foreground">Continue de onde parou</p>
          </div>
          <ProductGrid products={recentlyViewed} />
        </section>
      )}

      {recommended.length > 0 && (
        <section className="px-4 md:px-6 max-w-7xl mx-auto w-full animate-fade-in">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Recomendados para você
            </h2>
            <p className="text-sm text-muted-foreground">Baseado nos seus favoritos</p>
          </div>
          <ProductGrid products={recommended} />
        </section>
      )}

      <section className="px-4 md:px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Destaques</h2>
            <p className="text-sm text-muted-foreground">Em alta na ShopBank</p>
          </div>
          <Link to="/produtos" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {featuredQuery.isLoading ? (
          <ProductGridSkeleton />
        ) : featuredQuery.isError ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os produtos em destaque.
            </CardContent>
          </Card>
        ) : (
          <ProductGrid products={featuredQuery.data ?? []} />
        )}
      </section>

      <div className="h-4" />
    </div>
  );
}
