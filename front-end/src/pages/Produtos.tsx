import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Heart, Loader2, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductImage } from "@/components/common/ProductImage";
import { useCategories, useProducts } from "@/features/catalog/application/useCatalog";
import type { Product, ProductFilters } from "@/features/catalog/domain/catalog";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parsePrice(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default function Produtos() {
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoria") ?? "ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ProductFilters["sortBy"]>("relevance");
  const [addingId, setAddingId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(busca);
  const addToCart = useCartStore((state) => state.add);
  const { toggleItem, isInWishlist } = useWishlistStore();

  const filters = useMemo<ProductFilters>(
    () => ({
      search: deferredSearch,
      categoryId: categoriaId === "ALL" ? undefined : categoriaId,
      minPrice: parsePrice(minPrice),
      maxPrice: parsePrice(maxPrice),
      inStockOnly,
      sortBy,
    }),
    [categoriaId, deferredSearch, inStockOnly, maxPrice, minPrice, sortBy],
  );

  const categoriesQuery = useCategories();
  const productsQuery = useProducts(filters);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const products = productsQuery.data ?? [];

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  async function adicionar(event: React.MouseEvent, product: Product) {
    event.preventDefault();
    event.stopPropagation();

    if (product.availableQuantity <= 0) {
      toast.error("Produto indisponível");
      return;
    }

    setAddingId(product.id);
    try {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        availableQuantity: product.availableQuantity,
        imageUrl: product.imageUrl,
      });
      toast.success(`${product.name} adicionado ao carrinho`);
    } catch {
      toast.error("Falha ao adicionar ao carrinho");
    } finally {
      setAddingId(null);
    }
  }

  function clearFilters() {
    setBusca("");
    setCategoriaId("ALL");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("relevance");
  }

  const loading = productsQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">Catálogo conectado ao back-end</p>
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {products.length} resultado(s)
        </Badge>
      </div>

      <Card className="border-border/60">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(240px,1fr)_220px_160px_160px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            inputMode="decimal"
            placeholder="Preço min."
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />

          <Input
            inputMode="decimal"
            placeholder="Preço max."
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as ProductFilters["sortBy"])}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="name-asc">Nome</SelectItem>
              <SelectItem value="newest">Novidades</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 lg:col-span-2">
            <Checkbox
              id="in-stock"
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(checked === true)}
            />
            <Label htmlFor="in-stock" className="text-sm font-normal">
              Somente em estoque
            </Label>
          </div>

          <Button type="button" variant="outline" onClick={clearFilters} className="lg:col-start-5">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : productsQuery.isError ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Não foi possível carregar o catálogo.
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} to={`/produtos/${product.id}`} className="group block animate-fade-in">
              <Card className="overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/40 hover:shadow-elevated">
                <div className="relative">
                  <ProductImage images={[product.imageUrl]} alt={product.name} />
                  {product.availableQuantity > 0 && product.availableQuantity <= 5 && (
                    <Badge variant="secondary" className="absolute right-3 top-3 bg-warning/90 text-warning-foreground">
                      Últimas unidades
                    </Badge>
                  )}
                  {product.availableQuantity === 0 && (
                    <Badge className="absolute right-3 top-3 bg-destructive text-destructive-foreground">
                      Esgotado
                    </Badge>
                  )}
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleItem(product);
                    }}
                    className="absolute right-3 bottom-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background/90 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                    aria-label={isInWishlist(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isInWishlist(product.id) ? "fill-destructive text-destructive" : "text-foreground"
                      }`}
                    />
                  </button>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {categoryById.get(product.categoryId) ?? "Sem categoria"}
                  </div>
                  <h3 className="font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="text-base font-semibold">{BRL.format(product.price)}</div>
                  <Button
                    size="sm"
                    className="w-full mt-2 transition-all duration-300 hover:shadow-md"
                    onClick={(event) => adicionar(event, product)}
                    disabled={addingId === product.id || product.availableQuantity === 0}
                  >
                    {addingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.availableQuantity === 0 ? "Esgotado" : "Adicionar"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
