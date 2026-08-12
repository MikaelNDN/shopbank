import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/admin/application/useAdminCatalog";
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from "@/features/admin/presentation/CategoryFormDialog";
import type { Category } from "@/features/catalog/domain/catalog";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

export default function AdminCategorias() {
  const categoriesQuery = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description ?? "").toLowerCase().includes(term),
    );
  }, [categories, search]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  async function submitCategory(values: CategoryFormValues) {
    const input = {
      name: values.name,
      description: values.description?.trim() || undefined,
      active: values.active,
    };

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, input });
        toast.success("Categoria atualizada");
      } else {
        await createCategory.mutateAsync(input);
        toast.success("Categoria criada");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar categoria");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCategory.mutateAsync(deleting.id);
      toast.success("Categoria inativada");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao inativar categoria");
    }
  }

  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Tags className="h-6 w-6" /> Categorias
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie as categorias usadas no catalogo</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nova categoria
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            className="max-w-sm"
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {filteredCategories.length} categoria(s)
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {categoriesQuery.isLoading ? (
            <LoadingState message="Carregando categorias..." />
          ) : categoriesQuery.isError ? (
            <ErrorState onRetry={() => categoriesQuery.refetch()} />
          ) : filteredCategories.length === 0 ? (
            <EmptyState title="Nenhuma categoria encontrada" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {category.description || "Sem descrição"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={category.active ? "text-success" : "text-muted-foreground"}>
                        {category.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(category)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(category)}
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

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        saving={saving}
        onSubmit={submitCategory}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria sera removida dos filtros do catalogo, mas o historico sera preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategory.isPending}
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
