import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { maskCPF, isValidCPF } from "@/lib/masks";
import { ApiError } from "@/shared/http/apiError";

const schema = z
  .object({
    nome: z.string().trim().min(2, "Nome muito curto").max(100),
    email: z.string().trim().email("E-mail inválido").max(255),
    cpf: z.string().trim().min(1, "Informe seu CPF").refine(isValidCPF, "CPF inválido"),
    senha: z.string().min(6, "Mínimo de 6 caracteres").max(72),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { path: ["confirmar"], message: "Senhas não conferem" });

type FormData = z.infer<typeof schema>;

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details.some((d) => d.field === "cpf")) return "CPF inválido. Verifique os números informados.";
    const msg = error.message.toLowerCase();
    if (msg.includes("email already exists") || msg.includes("email")) return "Este e-mail já está cadastrado.";
    if (msg.includes("cpf already exists") || msg.includes("cpf")) return "Este CPF já está cadastrado.";
    if (msg.includes("password")) return "Senha inválida. Verifique os requisitos.";
    if (error.status === 400) return "Dados inválidos. Verifique as informações e tente novamente.";
    if (error.status === 500) return "Erro interno. Tente novamente em instantes.";
  }
  return "Falha no cadastro. Tente novamente.";
}

export default function Cadastro() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", email: "", cpf: "", senha: "", confirmar: "" },
  });

  async function onSubmit(values: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const user = await register({
        nome: values.nome,
        email: values.email,
        cpf: values.cpf,
        senha: values.senha,
      });
      toast.success("Conta criada com sucesso!");
      navigate(user.role === "ADMIN" ? "/dashboard" : "/home", { replace: true });
    } catch (err) {
      toast.error(getRegisterErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/40 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <CardDescription>É rápido e gratuito</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                inputMode="numeric"
                autoComplete="off"
                value={form.watch("cpf")}
                onChange={(event) => {
                  form.setValue("cpf", maskCPF(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
              {form.formState.errors.cpf && (
                <p className="text-xs text-destructive">{form.formState.errors.cpf.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" autoComplete="new-password" {...form.register("senha")} />
                {form.formState.errors.senha && (
                  <p className="text-xs text-destructive">{form.formState.errors.senha.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input id="confirmar" type="password" autoComplete="new-password" {...form.register("confirmar")} />
                {form.formState.errors.confirmar && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmar.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
              {(loading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}