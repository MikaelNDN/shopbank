import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Carregando..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Não foi possível carregar os dados",
  message = "Tente novamente em alguns instantes.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm">
      <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

