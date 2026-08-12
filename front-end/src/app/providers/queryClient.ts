import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      // Retry idempotente para erros de rede (não para erros 4xx do servidor)
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        const status = (error as { status?: number })?.status;
        // Não retentar erros de negócio (4xx)
        if (status !== undefined && status >= 400 && status < 500) return false;
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});
