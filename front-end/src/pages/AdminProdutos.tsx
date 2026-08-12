import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useAdminCategories,
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useUpdateProductStock,
} from "@/features/admin/application/useAdminCatalog";
import {
  ProductFormDialog,
  type ProductFormValues,
} from "@/features/admin/presentation/ProductFormDialog";
import { StockBadge } from "@/features/admin/presentation/StockBadge";
import type { AdminProductFilters, Product } from "@/features/catalog/domain/catalog";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DEFAULT_STORE_ID = "1";

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminProdutos() {
  const categoriesQuery = useAdminCategories();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [stockStatus, setStockStatus] = useState<AdminProductFilters["stockStatus"]>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const productsQuery = useAdminProducts({ includeInactive: true, stockStatus });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateStock = useUpdateProductStock();

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const defaultStoreId = products.find((product) => product.storeId)?.storeId ?? DEFAULT_STORE_ID;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !`${product.name} ${product.description}`.toLowerCase().includes(term)) return false;
      if (categoryId !== "ALL" && product.categoryId !== categoryId) return false;
      if (activeFilter === "active" && !product.active) return false;
      if (activeFilter === "inactive" && product.active) return false;
      return true;
    });
  }, [activeFilter, categoryId, products, search]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  async function submitProduct(values: ProductFormValues) {
    try {
      if (editing) {
        await updateProduct.mutateAsync({
          id: editing.id,
          input: {
            categoryId: values.categoryId,
            name: values.name,
            description: values.description,
            price: values.price,
            imageUrl: values.imageUrl || undefined,
            active: values.active,
          },
        });
        const stockDelta = values.availableQuantity - editing.availableQuantity;
        if (stockDelta !== 0) {
          await updateStock.mutateAsync({ productId: editing.id, delta: stockDelta });
        }
        toast.success("Produto atualizado");
      } else {
        await createProduct.mutateAsync({
          categoryId: values.categoryId,
          storeId: defaultStoreId,
          name: values.name,
          description: values.description,
          price: values.price,
          imageUrl: values.imageUrl || undefined,
          active: values.active,
          availableQuantity: values.availableQuantity,
        });
        toast.success("Produto criado");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar produto");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteProduct.mutateAsync(deleting.id);
      toast.success("Produto inativado");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao inativar produto");
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending || updateStock.isPending;
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;
  const error = productsQuery.isError || categoriesQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> Produtos
          </h1>
          <p className="text-sm text-muted-foreground">Crie, edite e inative produtos do catalogo</p>
        </div>
        <Button onClick={openNew} disabled={categories.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Novo produto
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_160px_170px_auto]">
          <Input
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as ActiveFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
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
            {filteredProducts.length} produto(s)
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Carregando produtos..." />
          ) : error ? (
            <ErrorState onRetry={() => { productsQuery.refetch(); categoriesQuery.refetch(); }} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState title="Nenhum produto encontrado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preco</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{categoryById.get(product.categoryId) ?? "Sem categoria"}</TableCell>
                    <TableCell className="text-right font-medium">{BRL.format(product.price)}</TableCell>
                    <TableCell className="text-center">
                      <StockBadge quantity={product.availableQuantity} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={product.active ? "text-success" : "text-muted-foreground"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Inativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        categories={categories}
        saving={saving}
        onSubmit={submitProduct}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto deixa de aparecer no catalogo de clientes, mas permanece no admin para auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
