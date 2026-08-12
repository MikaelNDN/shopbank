import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Boxes, Loader2, MinusCircle, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminInventory,
  useAdminProducts,
  useUpdateProductStock,
} from "@/features/admin/application/useAdminCatalog";
import { StockBadge } from "@/features/admin/presentation/StockBadge";
import type { AdminProductFilters, Product } from "@/features/catalog/domain/catalog";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

type StockAction = "replenish" | "reserve";

export default function AdminEstoque() {
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState<AdminProductFilters["stockStatus"]>("all");
  const [action, setAction] = useState<StockAction>("replenish");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");

  const productsQuery = useAdminProducts({ includeInactive: true, stockStatus });
  const inventoryQuery = useAdminInventory();
  const updateStock = useUpdateProductStock();

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const inventoryByProductId = useMemo(() => {
    return new Map((inventoryQuery.data ?? []).map((item) => [item.productId, item.quantity]));
  }, [inventoryQuery.data]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }, [products, search]);

  const lowStockCount = products.filter((product) => product.availableQuantity > 0 && product.availableQuantity <= 5).length;
  const zeroStockCount = products.filter((product) => product.availableQuantity === 0).length;

  function openAction(product: Product, nextAction: StockAction) {
    setSelected(product);
    setAction(nextAction);
    setQuantity("");
  }

  async function submitStock() {
    if (!selected) return;
    const parsed = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Informe uma quantidade maior que zero");
      return;
    }

    const delta = action === "replenish" ? parsed : -parsed;
    try {
      await updateStock.mutateAsync({ productId: selected.id, delta });
      toast.success(action === "replenish" ? "Estoque reposto" : "Estoque reservado");
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao ajustar estoque");
    }
  }

  const loading = productsQuery.isLoading || inventoryQuery.isLoading;
  const error = productsQuery.isError || inventoryQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6" /> Estoque
          </h1>
          <p className="text-sm text-muted-foreground">Ajuste reposicoes e reservas de produtos</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
            {lowStockCount} baixo(s)
          </Badge>
          <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
            {zeroStockCount} zerado(s)
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Produtos monitorados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Baixo estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sem estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{zeroStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_auto]">
          <Input
            placeholder="Buscar produto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={stockStatus ?? "all"} onValueChange={(value) => setStockStatus(value as AdminProductFilters["stockStatus"])}>
            <SelectTrigger>
              <SelectValue placeholder="Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo estoque</SelectItem>
              <SelectItem value="low">Baixo estoque</SelectItem>
              <SelectItem value="zero">Zerado</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="justify-center bg-accent text-accent-foreground">
            {filteredProducts.length} item(ns)
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Carregando estoque..." />
          ) : error ? (
            <ErrorState onRetry={() => { productsQuery.refetch(); inventoryQuery.refetch(); }} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState title="Nenhum item de estoque encontrado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Disponivel</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const adminQuantity = inventoryByProductId.get(product.id);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID {product.id} {product.active ? "" : "- inativo"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StockBadge quantity={product.availableQuantity} />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {adminQuantity ?? product.availableQuantity} un.
                      </TableCell>
                      <TableCell className="text-center">
                        {product.availableQuantity === 0 ? (
                          <Badge variant="outline" className="text-destructive">Zerado</Badge>
                        ) : product.availableQuantity <= 5 ? (
                          <Badge variant="outline" className="text-warning">Baixo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-success">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openAction(product, "replenish")}>
                          <PlusCircle className="h-4 w-4 mr-1" /> Repor
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openAction(product, "reserve")}>
                          <MinusCircle className="h-4 w-4 mr-1" /> Reservar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico de estoque</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          O back-end atual ainda não expõe histórico de ajustes. As operações desta tela chamam os endpoints reais de reposição e reserva.
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "replenish" ? "Repor estoque" : "Reservar estoque"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="font-medium">{selected?.name}</div>
              <div className="text-sm text-muted-foreground">
                Disponivel: {selected?.availableQuantity ?? 0} un.
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)} disabled={updateStock.isPending}>
              Cancelar
            </Button>
            <Button onClick={submitStock} disabled={updateStock.isPending}>
              {updateStock.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
