import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Heart, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/common/ProductImage";
import { useProduct, useRelatedProducts } from "@/features/catalog/application/useCatalog";
import type { Product } from "@/features/catalog/domain/catalog";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useEventsStore } from "@/store/events";
import { useWishlistStore } from "@/store/wishlist";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Produtos relacionados</h2>
        <p className="text-sm text-muted-foreground">Outras opções da mesma categoria</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <Link key={product.id} to={`/produtos/${product.id}`} className="group block">
            <Card className="overflow-hidden border-border/60 transition-all hover:border-primary/40">
              <ProductImage images={[product.imageUrl]} alt={product.name} />
              <CardContent className="p-4 space-y-1">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary">{product.name}</h3>
                <div className="font-semibold">{BRL.format(product.price)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ProdutoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productQuery = useProduct(id);
  const relatedQuery = useRelatedProducts(id, 4);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const addToCart = useCartStore((state) => state.add);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const logEvent = useEventsStore((state) => state.logEvent);

  const product = productQuery.data ?? null;
  const maxQuantity = Math.max(product?.availableQuantity ?? 0, 0);
  const imageUrl = product?.imageUrl ?? "";

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    logEvent("PRODUCT_VIEWED", { productId: product.id, productName: product.name });
  }, [logEvent, product?.id, product?.name]);

  const services = useMemo(
    () => [
      { icon: Truck, title: "Entrega rápida", desc: "Frete em todo o Brasil" },
      { icon: ShieldCheck, title: "Pagamento seguro", desc: "Pagamento protegido" },
      { icon: RotateCcw, title: "Trocas fáceis", desc: "30 dias de garantia" },
    ],
    [],
  );

  function handleZoom(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoom({ active: true, x, y });
  }

  function adicionar() {
    if (!product) return;
    if (product.availableQuantity <= 0) {
      toast.error("Produto indisponível");
      return;
    }

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        availableQuantity: product.availableQuantity,
        imageUrl: product.imageUrl,
      },
      quantity,
    );
    toast.success(`${product.name} adicionado ao carrinho`);
  }

  if (productQuery.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/produtos">Voltar ao catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div
            className="relative aspect-square overflow-hidden rounded-2xl border bg-muted cursor-zoom-in shadow-sm"
            onMouseMove={imageUrl ? handleZoom : undefined}
            onMouseLeave={() => setZoom({ active: false, x: 50, y: 50 })}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-300 ease-out",
                  zoom.active ? "scale-150" : "scale-100",
                )}
                style={zoom.active ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            ) : (
              <ProductImage images={[]} alt={product.name} />
            )}
            {product.availableQuantity === 0 && (
              <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground">
                Esgotado
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Badge variant="outline" className="mb-3">ShopBank Store</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground mt-2">{product.description || "Produto sem descrição."}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">{BRL.format(product.price)}</span>
          </div>

          <div className="text-sm">
            {product.availableQuantity > 0 ? (
              <span className="text-success font-medium">
                Em estoque ({product.availableQuantity} disponíveis)
              </span>
            ) : (
              <span className="text-destructive font-medium">Produto indisponível</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex h-11 items-center rounded-md border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1 hover:shadow-elevated transition-shadow"
              onClick={adicionar}
              disabled={product.availableQuantity === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Adicionar ao carrinho
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0"
              onClick={() => toggleItem(product)}
              aria-label={isInWishlist(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isInWishlist(product.id) && "fill-destructive text-destructive",
                )}
              />
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {services.map((service) => (
              <div key={service.title} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <service.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{service.title}</div>
                  <div className="text-xs text-muted-foreground">{service.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {relatedQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <RelatedProducts products={relatedQuery.data ?? []} />
      )}
    </div>
  );
}
