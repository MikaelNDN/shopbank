import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CheckCircle2, Copy, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/features/orders/application/useOrders";
import {
  usePayWithBoleto,
  usePayWithCard,
  usePayWithPix,
  usePaymentConfig,
  useRefreshPaymentFromAbacatePay,
  useSimulateAbacatePayPayment,
  useSimulatePaymentApproval,
  useTransparentPaymentByOrder,
} from "@/features/payments/application/usePayments";
import type { BoletoPaymentInput, CardPaymentInput, Payment, PixPaymentInput } from "@/features/payments/domain/payment";
import { useCartStore } from "@/store/cart";
import { ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function onlyDigits(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function splitName(value?: string) {
  const parts = (value ?? "Cliente").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Cliente",
    lastName: parts.slice(1).join(" ") || "ShopBank",
  };
}

function statusLabel(payment?: Payment | null): string {
  switch (payment?.status) {
    case "APPROVED":
      return "APROVADO";
    case "REJECTED":
      return "REJEITADO";
    case "REFUNDED":
      return "ESTORNADO";
    case "PENDING":
      return "PENDENTE";
    default:
      return "SEM PAGAMENTO";
  }
}

function canSimulateWithAbacatePay(payment?: Payment | null): boolean {
  return payment?.method === "PIX" || payment?.method === "BOLETO";
}

function simulationButtonLabel(payment?: Payment | null): string {
  if (payment?.method === "PIX") return "Simular Pix na AbacatePay";
  if (payment?.method === "BOLETO") return "Aprovar boleto local";
  return "Simular aprovacao";
}

function simulationSuccessMessage(payment?: Payment | null): string {
  if (payment?.method === "BOLETO") {
    return "Boleto aprovado localmente no sandbox";
  }

  return "Pagamento aprovado no sandbox";
}

function qrImageUri(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("data:image/") ? trimmed : `data:image/png;base64,${trimmed}`;
}

export default function CheckoutPagamento() {
  const navigate = useNavigate();
  const params = useParams<{ orderId?: string }>();
  const { user } = useAuth();
  const cartPedidoId = useCartStore((state) => state.pedidoId);
  const limpar = useCartStore((state) => state.limpar);
  const orderId = params.orderId ?? cartPedidoId ?? undefined;

  const orderQuery = useOrder(orderId);
  const paymentQuery = useTransparentPaymentByOrder(orderId);
  const configQuery = usePaymentConfig();

  const payPix = usePayWithPix();
  const payCard = usePayWithCard();
  const payBoleto = usePayWithBoleto();
  const refreshPayment = useRefreshPaymentFromAbacatePay();
  const simulateApproval = useSimulatePaymentApproval();
  const simulateAbacatePay = useSimulateAbacatePayPayment();

  const { firstName, lastName } = useMemo(() => splitName(user?.nome), [user?.nome]);
  const [copied, setCopied] = useState(false);
  const [qrImageFailed, setQrImageFailed] = useState(false);
  const [payerEmail, setPayerEmail] = useState(user?.email ?? "");
  const [payerCpf, setPayerCpf] = useState(onlyDigits(user?.cpf));

  useEffect(() => {
    setPayerEmail(user?.email ?? "");
    setPayerCpf(onlyDigits(user?.cpf));
  }, [user?.cpf, user?.email]);

  useEffect(() => {
    setQrImageFailed(false);
  }, [paymentQuery.data?.qrCode, paymentQuery.data?.qrCodeBase64]);

  useEffect(() => {
    if (!orderId) navigate("/carrinho", { replace: true });
  }, [navigate, orderId]);

  useEffect(() => {
    if (orderQuery.data?.status === "PAID" || paymentQuery.data?.status === "APPROVED") {
      const paidOrderId = orderId;
      limpar();
      navigate(`/meus-pedidos/${paidOrderId}`, { replace: true });
    }
  }, [limpar, navigate, orderId, orderQuery.data?.status, paymentQuery.data?.status]);

  if (!orderId) return null;

  async function runPayment<T>(action: () => Promise<T>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao processar pagamento");
    }
  }

  function buildPayer(): PixPaymentInput {
    return {
      payerEmail,
      payerCpf: onlyDigits(payerCpf) || undefined,
      payerFirstName: firstName,
      payerLastName: lastName,
    };
  }

  function buildBoletoPayer(): BoletoPaymentInput {
    return {
      payerEmail,
      payerCpf: onlyDigits(payerCpf),
      payerFirstName: firstName,
      payerLastName: lastName,
    };
  }

  function buildCardInput(): CardPaymentInput {
    return {
      installments: 1,
      payerEmail,
      payerCpf: onlyDigits(payerCpf) || undefined,
      payerFirstName: firstName,
      payerLastName: lastName,
      returnUrl: window.location.href,
      completionUrl: `${window.location.origin}/meus-pedidos/${orderId}`,
    };
  }

  function copyPixCode() {
    const qrCode = paymentQuery.data?.qrCode;
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Codigo Pix copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDebitCardCheckout() {
    if (!payerEmail || onlyDigits(payerCpf).length !== 11) {
      toast.error("Informe e-mail e CPF validos");
      return;
    }

    try {
      const result = await payCard.mutateAsync({ orderId, input: buildCardInput() });
      toast.success("Checkout do cartao criado");
      if (result.redirectUrl) {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao processar pagamento");
    }
  }

  async function handleSimulate() {
    const payment = paymentQuery.data;
    if (!payment) return;

    await runPayment(
      () =>
        canSimulateWithAbacatePay(payment)
          ? simulateAbacatePay.mutateAsync(orderId)
          : simulateApproval.mutateAsync(payment.id),
      simulationSuccessMessage(payment),
    );
    limpar();
    navigate(`/meus-pedidos/${orderId}`);
  }

  const order = orderQuery.data;
  const payment = paymentQuery.data;
  const config = configQuery.data;
  const paymentBusy =
    payPix.isPending ||
    payCard.isPending ||
    payBoleto.isPending ||
    refreshPayment.isPending ||
    simulateApproval.isPending ||
    simulateAbacatePay.isPending;
  const isPayable = order?.status === "PENDING_PAYMENT";
  const qrImage = qrImageUri(payment?.qrCodeBase64);

  if (orderQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <LoadingState message="Carregando pedido..." />
        </CardContent>
      </Card>
    );
  }

  if (orderQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => orderQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent>
          <ErrorState title="Pedido não encontrado" message="Volte aos seus pedidos para escolher outro pedido." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> Pagamento
        </h1>
        <p className="text-sm text-muted-foreground">Pedido {order.id}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Status do pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-accent/40 p-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total a pagar</div>
                  <div className="text-2xl font-semibold">{BRL.format(order.total)}</div>
                </div>
                <Badge variant="outline">{statusLabel(payment)}</Badge>
              </div>

              {payment?.redirectUrl && (
                <Button asChild className="w-full">
                  <a href={payment.redirectUrl} target="_blank" rel="noreferrer">
                    Abrir checkout <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}

              {payment?.boletoUrl && (
                <Button asChild variant="outline" className="w-full">
                  <a href={payment.boletoUrl} target="_blank" rel="noreferrer">
                    Abrir boleto <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}

              {payment?.qrCode && (
                <div className="space-y-3">
                  <div className="flex justify-center rounded-md border bg-white p-4">
                    {qrImage && !qrImageFailed ? (
                      <img
                        src={qrImage}
                        alt="QR Code Pix"
                        className="h-48 w-48 object-contain"
                        onError={() => setQrImageFailed(true)}
                      />
                    ) : (
                      <QRCodeSVG value={payment.qrCode} size={192} level="M" includeMargin />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Pix copia e cola</Label>
                    <div className="flex gap-2">
                      <Input value={payment.qrCode} readOnly className="font-mono text-xs" />
                      <Button type="button" variant="secondary" onClick={copyPixCode}>
                        {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => runPayment(() => refreshPayment.mutateAsync(orderId), "Status atualizado")}
                  disabled={paymentBusy || !payment}
                >
                  {refreshPayment.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar status
                </Button>
                {config?.sandbox && payment && payment.status === "PENDING" && (
                  <Button type="button" onClick={handleSimulate} disabled={paymentBusy}>
                    {simulateApproval.isPending || simulateAbacatePay.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {simulationButtonLabel(payment)}
                  </Button>
                )}
                {(order.status === "PAID" || payment?.status === "APPROVED") && (
                  <Button asChild>
                    <Link to={`/meus-pedidos/${order.id}`}>Ver pedido</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isPayable ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metodo de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pix" className="space-y-4">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="pix">Pix</TabsTrigger>
                    <TabsTrigger value="boleto">Boleto</TabsTrigger>
                    <TabsTrigger value="card">Debito</TabsTrigger>
                  </TabsList>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>E-mail do pagador</Label>
                      <Input value={payerEmail} onChange={(event) => setPayerEmail(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CPF</Label>
                      <Input
                        value={payerCpf}
                        maxLength={11}
                        onChange={(event) => setPayerCpf(onlyDigits(event.target.value).slice(0, 11))}
                      />
                    </div>
                  </div>

                  <TabsContent value="pix" className="space-y-4">
                    <Button
                      className="w-full"
                      disabled={paymentBusy || !payerEmail || onlyDigits(payerCpf).length !== 11}
                      onClick={() =>
                        runPayment(
                          () => payPix.mutateAsync({ orderId, input: buildPayer() }),
                          "Pix gerado pelo back-end",
                        )
                      }
                    >
                      {payPix.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Gerar Pix
                    </Button>
                  </TabsContent>

                  <TabsContent value="boleto" className="space-y-4">
                    <Button
                      className="w-full"
                      disabled={paymentBusy || !payerEmail || onlyDigits(payerCpf).length !== 11}
                      onClick={() =>
                        runPayment(
                          () => payBoleto.mutateAsync({ orderId, input: buildBoletoPayer() }),
                          "Boleto gerado pelo back-end",
                        )
                      }
                    >
                      {payBoleto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Gerar boleto
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4">
                    <Button
                      className="w-full"
                      disabled={
                        paymentBusy ||
                        config?.abacatePayEnabled === false ||
                        !payerEmail ||
                        onlyDigits(payerCpf).length !== 11
                      }
                      onClick={handleDebitCardCheckout}
                    >
                      {payCard.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Abrir checkout do cartao
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Este pedido não está aguardando pagamento.
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{BRL.format(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{BRL.format(order.shipping)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-base">
              <span>Total</span>
              <span>{BRL.format(order.total)}</span>
            </div>
            <div className="pt-2 text-xs text-muted-foreground">
              {paymentQuery.isFetching ? "Atualizando pagamento..." : "Status sincronizado com o back-end."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
