import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/shared/http/apiError";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(6, "Mínimo 6 caracteres").max(72),
});
type FormData = z.infer<typeof schema>;

const demoAccounts = [
  { label: "Cliente", email: "cliente@shopbank.com" },
];

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "E-mail ou senha inválidos.";
    if (error.status === 403) return "Usuário sem permissão de acesso.";
    if (error.status === 500) return "Erro interno. Tente novamente em instantes.";
    const msg = error.message.toLowerCase();
    if (msg.includes("not found") || msg.includes("invalid")) return "E-mail ou senha inválidos.";
  }
  return "Falha no login. Tente novamente.";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const from = (location.state as { from?: string } | null)?.from;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  async function onSubmit(values: FormData) {
    try {
      const user = await login({ email: values.email, senha: values.senha });
      toast.success(`Bem-vindo, ${user.nome}!`);
      const target =
        user.role === "ADMIN"
          ? "/dashboard"
          : from && !from.startsWith("/admin") && from !== "/dashboard"
            ? from
            : "/home";
      navigate(target, { replace: true });
    } catch (err) {
      toast.error(getLoginErrorMessage(err));
    }
  }

  function fillDemoAccount(email: string) {
    form.setValue("email", email, { shouldDirty: true, shouldValidate: true });
    form.setValue("senha", "123456", { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ShopBank</h1>
          <p className="mt-1 text-base text-muted-foreground">Entre na sua conta</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="123456"
              {...form.register("senha")}
            />
            {form.formState.errors.senha && (
              <p className="text-xs text-destructive">{form.formState.errors.senha.message}</p>
            )}
          </div>

          <Button type="submit" className="h-12 w-full rounded-lg text-base" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-1">
            É administrador?{" "}
            <Link to="/admin/login" className="font-medium text-muted-foreground hover:text-foreground underline underline-offset-2">
              Acesse o painel
            </Link>
          </p>

        </form>

        <div className="mt-6 rounded-lg border border-border bg-muted/60 p-3">
          <p className="text-xs font-medium text-foreground">Contas demo</p>
          {demoAccounts.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              className="mt-2 h-auto w-full justify-start px-3 py-2 text-left"
              onClick={() => fillDemoAccount(account.email)}
            >
              <span className="flex flex-col items-start">
                <span className="text-xs font-semibold">{account.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {account.email} · senha: 123456
                </span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
