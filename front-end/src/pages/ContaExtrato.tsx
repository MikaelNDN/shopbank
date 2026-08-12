import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Wallet } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  useAccountTransactions,
  useCheckingAccount,
  useDeposit,
  useWithdraw,
} from "@/features/account/application/useAccount";
import type { AccountTransaction, TransactionType } from "@/features/account/domain/account";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Operation = "deposit" | "withdraw";

const transactionUi: Record<TransactionType, { label: string; direction: "credit" | "debit" }> = {
  CREDIT: { label: "Credito", direction: "credit" },
  REFUND: { label: "Estorno", direction: "credit" },
  DEPOSIT: { label: "Deposito", direction: "credit" },
  DEBIT: { label: "Debito", direction: "debit" },
  WITHDRAWAL: { label: "Saque", direction: "debit" },
};

function isCredit(transaction: AccountTransaction): boolean {
  return transactionUi[transaction.type]?.direction === "credit";
}

function parseAmount(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export default function ContaExtrato() {
  const { user } = useAuth();
  const customerId = user?.customerId ?? user?.id;
  const accountQuery = useCheckingAccount(customerId);
  const account = accountQuery.data;
  const transactionsQuery = useAccountTransactions(account?.id);
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const [operation, setOperation] = useState<Operation | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (isCredit(transaction)) acc.credits += transaction.amount;
        else acc.debits += transaction.amount;
        return acc;
      },
      { credits: 0, debits: 0 },
    );
  }, [transactions]);

  function openOperation(next: Operation) {
    setOperation(next);
    setAmount("");
    setDescription("");
  }

  async function submitOperation() {
    if (!account || !operation) return;
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    try {
      const input = {
        amount: value,
        description: description.trim() || undefined,
      };
      if (operation === "deposit") {
        await deposit.mutateAsync({ accountId: account.id, input });
        toast.success("Deposito realizado");
      } else {
        await withdraw.mutateAsync({ accountId: account.id, input });
        toast.success("Saque realizado");
      }
      setOperation(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao processar operacao");
    }
  }

  const saving = deposit.isPending || withdraw.isPending;

  if (!customerId) {
    return (
      <Card>
        <CardContent>
          <ErrorState title="Sessão inválida" message="Entre novamente para acessar sua conta." />
        </CardContent>
      </Card>
    );
  }

  if (accountQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <LoadingState message="Carregando conta corrente..." />
        </CardContent>
      </Card>
    );
  }

  if (accountQuery.isError || !account) {
    return (
      <Card>
        <CardContent>
          <ErrorState
            title="Conta corrente não encontrada"
            message="Não foi possível carregar a conta do cliente autenticado."
            onRetry={() => accountQuery.refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Conta Corrente
          </h1>
          <p className="text-sm text-muted-foreground">Titular: {user?.nome}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openOperation("withdraw")}>
            <ArrowUpCircle className="h-4 w-4 mr-2" /> Sacar
          </Button>
          <Button onClick={() => openOperation("deposit")}>
            <ArrowDownCircle className="h-4 w-4 mr-2" /> Depositar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${account.balance < 0 ? "text-destructive" : ""}`}>
              {BRL.format(account.balance)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Ag. {account.agency} Conta {account.number}-{account.digit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Creditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-success">{BRL.format(totals.credits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Debitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{BRL.format(totals.debits)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico de lancamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactionsQuery.isLoading ? (
            <LoadingState message="Carregando lançamentos..." />
          ) : transactionsQuery.isError ? (
            <ErrorState onRetry={() => transactionsQuery.refetch()} />
          ) : transactions.length === 0 ? (
            <EmptyState title="Nenhum lançamento encontrado" description="As movimentações da API aparecem aqui." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const ui = transactionUi[transaction.type];
                  const credit = ui.direction === "credit";
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {new Date(transaction.createdAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div>{transaction.description ?? ui.label}</div>
                        {(transaction.orderId || transaction.paymentId) && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.orderId ? `Pedido ${transaction.orderId}` : ""}
                            {transaction.orderId && transaction.paymentId ? " - " : ""}
                            {transaction.paymentId ? `Pagamento ${transaction.paymentId}` : ""}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            credit
                              ? "bg-success/15 text-success border-success/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          }
                        >
                          {credit ? (
                            <ArrowDownCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                          )}
                          {ui.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${credit ? "text-success" : "text-destructive"}`}>
                        {credit ? "+ " : "- "}
                        {BRL.format(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!operation} onOpenChange={(open) => !open && setOperation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{operation === "deposit" ? "Depositar" : "Sacar"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={operation === "deposit" ? "Deposito em conta" : "Saque em conta"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOperation(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submitOperation} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
