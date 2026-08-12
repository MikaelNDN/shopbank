import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
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

function getLoginErrorMessage(error: unknown) {
    if (error instanceof ApiError && error.status === 401) return "E-mail ou senha inválidos.";
    if (error instanceof ApiError && error.status === 403) return "Usuário sem permissão de administrador.";
    if (error instanceof Error) return error.message;
    return "Falha no login";
}

export default function AdminLogin() {
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
            if (user.role !== "ADMIN") {
                toast.error("Acesso restrito a administradores.");
                return;
            }
            toast.success(`Bem-vindo, ${user.nome}!`);
            const target = from && from.startsWith("/admin") || from === "/dashboard" ? from : "/dashboard";
            navigate(target, { replace: true });
        } catch (err) {
            toast.error(getLoginErrorMessage(err));
        }
    }

    function fillDemo() {
        form.setValue("email", "admin@shopbank.com", { shouldDirty: true, shouldValidate: true });
        form.setValue("senha", "123456", { shouldDirty: true, shouldValidate: true });
    }

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a administradores</p>
                </div>

                <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="admin@shopbank.com"
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
                                {...form.register("senha")}
                            />
                            {form.formState.errors.senha && (
                                <p className="text-xs text-destructive">{form.formState.errors.senha.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="h-11 w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar como administrador
                        </Button>
                    </form>

                    <div className="mt-4 rounded-lg border border-border bg-muted/60 p-3">
                        <p className="text-xs font-medium text-foreground">Conta demo</p>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-2 h-auto w-full justify-start px-3 py-2 text-left"
                            onClick={fillDemo}
                        >
                            <span className="flex flex-col items-start">
                                <span className="text-xs font-semibold">Admin</span>
                                <span className="text-xs font-normal text-muted-foreground">admin@shopbank.com · senha: 123456</span>
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}