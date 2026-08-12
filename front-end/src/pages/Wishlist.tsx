import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/common/ProductImage";
import { useProducts } from "@/features/catalog/application/useCatalog";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Wishlist() {
  const { items: favoriteIds, removeItem } = useWishlistStore();
  const addToCart = useCartStore((state) => state.add);
  const productsQuery = useProducts();
  const products = (productsQuery.data ?? []).filter((product) => favoriteIds.includes(product.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-destructive fill-destructive" /> Meus Favoritos
        </h1>
        <p className="text-sm text-muted-foreground">Produtos que você amou e salvou para depois.</p>
      </div>

      {favoriteIds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
            <div className="space-y-1">
              <h3 className="font-medium text-lg">Sua lista está vazia</h3>
              <p className="text-sm text-muted-foreground">Explore nossos produtos e clique no coração para salvá-los.</p>
            </div>
            <Button asChild className="mt-4">
              <Link to="/produtos">Explorar Produtos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : productsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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
            Não foi possível carregar seus favoritos.
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
            <div className="space-y-1">
              <h3 className="font-medium text-lg">Favoritos indisponíveis</h3>
              <p className="text-sm text-muted-foreground">Os produtos salvos não estão disponíveis no catálogo atual.</p>
            </div>
            <Button variant="outline" onClick={() => favoriteIds.forEach(removeItem)}>
              Limpar lista
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden border-border/60 transition-all duration-300 hover:border-primary/40 flex flex-col">
              <div className="relative aspect-square">
                <ProductImage images={[product.imageUrl]} alt={product.name} />
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute right-3 top-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background/90 text-destructive transition-all hover:scale-110"
                  aria-label="Remover dos favoritos"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="p-4 flex flex-col flex-1 gap-2">
                <Link to={`/produtos/${product.id}`} className="hover:underline font-medium text-sm line-clamp-2">
                  {product.name}
                </Link>
                <div className="text-lg font-semibold mt-auto">{BRL.format(product.price)}</div>
                <Button
                  onClick={() =>
                    addToCart({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      availableQuantity: product.availableQuantity,
                      imageUrl: product.imageUrl,
                    })
                  }
                  disabled={product.availableQuantity === 0}
                  className="w-full mt-2"
                  variant="secondary"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.availableQuantity === 0 ? "Esgotado" : "Mover para o carrinho"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
