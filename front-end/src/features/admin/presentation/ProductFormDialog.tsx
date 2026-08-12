import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/features/catalog/domain/catalog";

const productSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto").max(120),
  description: z.string().trim().min(3, "Informe a descrição").max(500),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  price: z.coerce.number().positive("Preço inválido"),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  availableQuantity: z.coerce.number().int().min(0, "Quantidade inválida"),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Product | null;
  categories: Category[];
  saving?: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

function valuesFromProduct(product?: Product | null, categories: Category[] = []): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? categories.find((category) => category.active)?.id ?? categories[0]?.id ?? "",
    price: product?.price ?? 0,
    imageUrl: product?.imageUrl ?? "",
    availableQuantity: product?.availableQuantity ?? 0,
    active: product?.active ?? true,
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  categories,
  saving = false,
  onSubmit,
}: ProductFormDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: valuesFromProduct(initial, categories),
  });

  useEffect(() => {
    if (open) form.reset(valuesFromProduct(initial, categories));
  }, [categories, form, initial, open]);

  const imageUrl = form.watch("imageUrl");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="space-y-2">
                <FormLabel>Imagem</FormLabel>
                <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Pré-visualização da imagem do produto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            {!category.active ? " (inativa)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preco</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{initial ? "Estoque atual" : "Quantidade inicial"}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <FormLabel>Produto ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">Produtos inativos não aparecem na loja.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || categories.length === 0}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
