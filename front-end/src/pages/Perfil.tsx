import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, RefreshCw, ShieldCheck, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { maskCPF } from "@/lib/masks";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, loading, logout, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshUser();
      toast.success("Dados atualizados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o perfil");
    } finally {
      setRefreshing(false);
    }
  }

  function sair() {
    logout();
    toast.success("Sessão encerrada");
    navigate("/login", { replace: true });
  }

  if (loading || !user) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const initials = getInitials(user.nome || user.email);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Dados da conta autenticada</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={sair} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{user.nome}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
          </div>
          <Badge variant="secondary">{user.role}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="h-5 w-5" /> Dados pessoais
          </CardTitle>
          <CardDescription>Informações retornadas pela sua sessão atual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Nome completo</Label>
            <Input id="profile-name" value={user.nome} readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input id="profile-email" value={user.email} readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-cpf">CPF</Label>
            <Input id="profile-cpf" value={user.cpf ? maskCPF(user.cpf) : "Não informado"} readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-role">Perfil de acesso</Label>
            <Input id="profile-role" value={user.role === "ADMIN" ? "Administrador" : "Cliente"} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" /> Sessão
          </CardTitle>
          <CardDescription>Use esta ação para encerrar o acesso neste navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={sair}>
            <LogOut className="h-4 w-4 mr-2" /> Encerrar sessão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
