# RELATÓRIO DE AUDITORIA FRONTEND — AuraPay / ShopBank

**Data:** 2026-05-15  
**Escopo:** Frontend React (Vite + TypeScript + TailwindCSS + shadcn/ui)  
**Auditor:** Análise estática completa de código-fonte (~120 arquivos, ~55 mil bytes de código autoral)

---

## Resumo Geral

| Critério | Avaliação |
|---|---|
| **Estado geral** | ⚠️ Funcional, mas com riscos estruturais e de segurança |
| **Qualidade arquitetural** | ✅ Boa — Feature-Sliced Design com domain/infra/application bem definido |
| **Qualidade React** | ✅ Boa — uso correto de hooks, memoização, TanStack Query |
| **Cobertura de testes** | 🔴 Crítica — apenas testes unitários mínimos, zero testes de integração/E2E |
| **Segurança** | 🔴 Problemas graves de exposição de token e falta de sanitização |
| **Performance** | ⚠️ Gargalos em N+1 de requests no catálogo e admin |
| **UX/UI** | ✅ Premium no dark mode; ⚠️ inconsistências de idioma e acessibilidade |
| **Acessibilidade** | 🔴 Deficiente — falta de aria-labels, skip-nav, focus trapping |
| **Risco técnico** | **MÉDIO-ALTO** |

### Top 5 Problemas Críticos
1. Token JWT armazenado em `localStorage` sem proteção
2. N+1 de requests no `fetchProducts()` (1 request de inventário por produto)
3. `strict: false` no TypeScript — qualquer tipo `any` passa silenciosamente
4. Zero testes de integração/E2E — sem rede de segurança para regressões
5. `clearAuthToken()` apaga todo o localStorage da chave auth mas não invalida o token no servidor

---

## 1. Bugs Encontrados

### BUG-01: Conflito de porta entre Vite e API (CRÍTICO)

- **Descrição:** `vite.config.ts` configura `port: 8080` e `.env.example` define `VITE_API_BASE_URL=http://localhost:8080`. Ambos competem pela mesma porta.
- **Gravidade:** 🔴 Crítica
- **Impacto:** A aplicação não consegue rodar se o backend já ocupa 8080, ou faz requests para si mesma.
- **Reproduzir:** `npm run dev` com backend rodando na 8080.
- **Causa:** Configuração copiada sem ajuste.
- **Correção:** Alterar Vite para porta 3000 ou 5173 (default Vite). Alterar `.env.example` para `VITE_API_BASE_URL=http://localhost:8080` (backend) e Vite para outra porta.

### BUG-02: `usePolling` nunca integra com refetch de queries (MÉDIO)

- **Descrição:** O hook `usePolling.ts` incrementa um `tick` state mas **nenhum componente** usa esse tick para disparar refetch. O polling é um no-op.
- **Gravidade:** ⚠️ Médio
- **Impacto:** Páginas admin que deveriam atualizar automaticamente (eventos, pedidos) não atualizam.
- **Correção:** Remover `usePolling` e usar `refetchInterval` do TanStack Query (já usado corretamente em `useOrders` e `usePayments`).

### BUG-03: `AuthContext.login` — `useCallback` com `loginMutation` na dep array (MÉDIO)

- **Descrição:** Em [AuthContext.tsx:92](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/context/AuthContext.tsx#L92), `loginMutation` é passado como dependência de `useCallback`. Como `useMutation` retorna um novo objeto a cada render, esse callback é recriado a cada render, invalidando a memoização.
- **Gravidade:** ⚠️ Médio
- **Impacto:** Re-renders desnecessários em toda a árvore de componentes que consome `useAuth()`.
- **Correção:** Usar `loginMutation.mutateAsync` diretamente (referência estável) ou extrair com `useRef`.

### BUG-04: Header search input é decorativo (BAIXO)

- **Descrição:** O `<Input>` de busca no [AppHeader.tsx:35](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/components/layout/AppHeader.tsx#L35) não tem `onChange`, `onSubmit` nem lógica alguma. É puramente visual.
- **Gravidade:** 🟡 Baixo
- **Impacto:** Usuário digita mas nada acontece. Frustração.
- **Correção:** Implementar busca global ou remover o input.

### BUG-05: Notificação Bell é decorativa (BAIXO)

- **Descrição:** O botão de notificações ([AppHeader.tsx:61](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/components/layout/AppHeader.tsx#L61)) não tem `onClick` nem mostra nada.
- **Correção:** Implementar ou remover.

### BUG-06: `logEvent("PRODUCT_VIEWED")` dispara em loop se `product` muda referência (MÉDIO)

- **Descrição:** Em [ProdutoDetalhes.tsx:66-68](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/pages/ProdutoDetalhes.tsx#L66), o `useEffect` depende de `product`. Se o TanStack Query refaz a query (refetchInterval, window focus), um novo objeto `product` é criado e o evento é logado novamente.
- **Correção:** Depender apenas de `product?.id` ao invés de `product`.

### BUG-07: `listAll` do `OrderHttpRepository` chama `getMyOrders()` para admin (MÉDIO)

- **Descrição:** Em [orderHttpRepository.ts:57](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/features/orders/infrastructure/orderHttpRepository.ts#L57), quando não há `customerId` no filtro, `listAll` chama `getMyOrders()`. Para admins, deveria listar todos os pedidos da plataforma, não apenas os do admin.
- **Impacto:** Admin vê apenas seus próprios pedidos na listagem geral.
- **Correção:** Implementar endpoint `/api/orders` (listagem global) ou usar `AdminHttpRepository.listOrders()`.

---

## 2. Problemas Arquiteturais

### ARCH-01: TypeScript `strict: false` (CRÍTICO)

- **Arquivo:** [tsconfig.app.json:18](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/tsconfig.app.json#L18)
- **Problema:** `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`. Isso anula 80% da utilidade do TypeScript.
- **Impacto:** Bugs silenciosos por tipos `any` implícitos, parâmetros não utilizados acumulam, null safety desabilitada.
- **Correção:** Ativar `strict: true` gradualmente. Priorizar `strictNullChecks`.

### ARCH-02: Duplicação do tipo `UserRole` (MÉDIO)

- **Locais:** `store/auth.ts` E `features/auth/domain/auth.ts` ambos exportam `type UserRole`.
- **Impacto:** Risco de dessincronização. Imports misturados no projeto.
- **Correção:** Single source of truth em `features/auth/domain/auth.ts`, re-exportar no store.

### ARCH-03: Páginas são monolíticas — lógica de negócio misturada com UI (MÉDIO)

- **Exemplos:**
  - `CheckoutPagamento.tsx` (477 linhas) — contém lógica de checkout, UI de Pix/Cartão/Boleto, e gerenciamento de estado em um único componente.
  - `AdminPedidos.tsx` (14.6KB), `AdminPagamentos.tsx` (12.2KB)
- **Correção:** Extrair custom hooks (`useCheckoutPayment`), separar sub-componentes (`PixPaymentTab`, `CardPaymentTab`).

### ARCH-04: N+1 HTTP no catálogo (CRÍTICO para performance)

- **Arquivo:** [catalogHttpRepository.ts:62-67](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/features/catalog/infrastructure/catalogHttpRepository.ts#L62)
- **Problema:** `fetchProducts()` faz 1 GET para listar produtos + 1 GET de inventário **por produto**. Para 100 produtos = 101 requests.
- **Impacto:** Latência proporcional ao nº de produtos. Possível rate limiting.
- **Correção:** Solicitar ao backend um endpoint que retorne produtos com estoque embarcado, ou fazer batch de inventário.

### ARCH-05: Admin `listOrders` e `listPayments` fazem chamadas cascata O(n²) (CRÍTICO)

- **Arquivo:** [adminHttpRepository.ts:127-148](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/features/admin/infrastructure/adminHttpRepository.ts#L127)
- **Problema:** `listOrders` primeiro lista todos os clientes, depois para cada cliente busca pedidos. `listPayments` faz o mesmo + busca pagamento por pedido.
- **Impacto:** Para 50 clientes com 10 pedidos cada = 50 + 500 + 500 = ~1050 requests HTTP.
- **Correção:** Criar endpoints backend dedicados (`/api/admin/orders`, `/api/admin/payments`).

### ARCH-06: Dupla camada de toast providers (BAIXO)

- **Arquivo:** [AppProviders.tsx:19-20](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/app/providers/AppProviders.tsx#L19)
- **Problema:** Tanto `<Toaster />` (Radix) quanto `<Sonner />` estão montados. O código usa `sonner` em toda parte. O `<Toaster />` do Radix é desnecessário.
- **Correção:** Remover `<Toaster />` e `hooks/use-toast.ts` + `components/ui/toaster.tsx`.

### ARCH-07: `lovable-tagger` em devDependencies (BAIXO)

- **Problema:** Dependency `lovable-tagger` sugere geração por IA (Lovable.dev). Pode adicionar atributos de debug no DOM em dev.
- **Correção:** Avaliar se é necessário manter.

### ARCH-08: Código e rotas duplicados

| Rota duplicada | Componente |
|---|---|
| `/cadastro` e `/register` | Ambos renderizam `<Cadastro />` |
| `/` e `/home` | Ambos renderizam `Home` |
| `/produtos` e `/products` | Ambos renderizam `<Produtos />` |
| `/checkout` e `/checkout/endereco` | Ambos renderizam `<CheckoutEndereco />` |

**Correção:** Usar `<Navigate>` para redirect canônico ao invés de montar o mesmo componente em duas rotas.

---

## 3. Problemas de Segurança

### SEC-01: Token JWT em localStorage (CRÍTICO)

- **Arquivo:** [authTokenStorage.ts](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/shared/http/authTokenStorage.ts) + [store/auth.ts](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/store/auth.ts)
- **Problema:** Token persistido em `localStorage` via Zustand `persist`. Vulnerável a XSS.
- **Impacto:** Qualquer script injetado pode roubar o token.
- **Correção:** Migrar para `httpOnly` cookie no backend. Se impossível, usar `sessionStorage` como mitigação parcial.

### SEC-02: `decodeJwtPayload` duplicado e sem validação de expiração

- **Locais:** `store/auth.ts:31` e `authMapper.ts:8`
- **Problema:** Decodifica JWT mas não verifica `exp`. Tokens expirados continuam sendo usados.
- **Correção:** Verificar `exp` e fazer logout automático quando expirado.

### SEC-03: Interceptor 401 não dispara redirect (MÉDIO)

- **Arquivo:** [apiClient.ts:26](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/shared/http/apiClient.ts#L26)
- **Problema:** O interceptor limpa o token no 401 via `clearAuthToken()` e dispara `auth:unauthorized`, mas o `AuthContext` só escuta esse evento. Se o contexto não estiver montado (ex: rotas públicas), o redirect não acontece.
- **Correção:** Garantir redirect centralizado ou usar middleware de roteamento.

### SEC-04: Sem proteção contra XSS em inputs (MÉDIO)

- **Problema:** Inputs como descrição de produto, nome, etc. não são sanitizados antes de renderizar. React escapa por padrão em JSX, mas `dangerouslySetInnerHTML` poderia ser introduzido sem guardrails.
- **Mitigação atual:** React auto-escapa. Risco baixo no estado atual.

### SEC-05: `navigator.clipboard.writeText` sem fallback (BAIXO)

- **Arquivo:** [CheckoutPagamento.tsx:156](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/pages/CheckoutPagamento.tsx#L156)
- **Problema:** `navigator.clipboard` requer HTTPS ou localhost. Em HTTP, falha silenciosamente.
- **Correção:** Adicionar try/catch com fallback (`document.execCommand`).

---

## 4. Problemas de UX/UI

### UX-01: Inconsistência de idioma (MÉDIO)

- **Problema:** Mistura pesada de Português e Inglês na mesma interface.
  - Hero: "Smart Shopping. Smarter Payments." / "Shop now" / "Explore products"
  - Botões: "Buscar" / "Adicionar" / "Continuar"
  - Seções: "Trending now" / "Vistos recentemente"
  - Textos de erro: "Nao foi possivel" (sem acentos em vários locais)
- **Impacto:** Experiência confusa e não profissional.
- **Correção:** Definir idioma primário e aplicar consistentemente. Implementar i18n se necessário.

### UX-02: Falta de acentos em textos em vários arquivos

- **Exemplos:** "Nao foi possivel", "Sessao invalida", "Endereco de entrega", "Metodo de pagamento", "Codigo Pix", "Simular aprovacao".
- **Correção:** Corrigir todos os textos para Português correto com acentos.

### UX-03: ForgotPassword, ResetPassword e VerifyEmail são placeholders (MÉDIO)

- **Problema:** Todas as 3 páginas são stubs que dizem "não disponível". Rotas existem mas funcionalidade não.
- **Impacto:** Usuário chega a essas páginas e se frustra.
- **Correção:** Implementar ou remover rotas + links. Não expor funcionalidade inexistente.

### UX-04: Empty states inconsistentes

- **Problema:** Algumas páginas têm empty states bem desenhados (Carrinho, CheckoutEndereco), outras não têm nenhum (Wishlist sem tratamento de lista vazia para produtos que não existem mais).
- **Correção:** Padronizar usando o componente `EmptyState` de `shared/ui/AsyncState.tsx`.

### UX-05: 404 page sem layout (BAIXO)

- **Problema:** `NotFound.tsx` usa texto em inglês ("Oops! Page not found") e link `<a href="/">` ao invés de `<Link>`, causando full page reload.
- **Correção:** Usar `<Link to="/">`, adicionar ao layout, traduzir.

### UX-06: Sidebar não mostra links para usuário não autenticado

- **Problema:** Quando `user` é `null`, `visibleClient` e `visibleAdmin` são vazios. Sidebar fica completamente vazia nas rotas públicas (`/`, `/home`, `/produtos`).
- **Correção:** Mostrar itens públicos (Home, Produtos) independente de auth.

---

## 5. Problemas de Acessibilidade

### A11Y-01: Sem skip navigation link (CRÍTICO a11y)

- **Correção:** Adicionar `<a href="#main-content" class="sr-only focus:not-sr-only">Ir para conteúdo</a>`.

### A11Y-02: Inputs sem `aria-describedby` para erros de validação

- **Problema:** Erros de formulário são exibidos em `<p>` mas sem ligação `aria-describedby` ao input.
- **Impacto:** Screen readers não anunciam o erro.
- **Correção:** Usar `aria-describedby` linkando ao id do `<p>` de erro, ou usar `FormField` do shadcn (que já faz isso).

### A11Y-03: Imagens sem `alt` descritivo

- **Problema:** `ProductImage` recebe `alt` do produto, mas a imagem secundária tem `alt=""` e `aria-hidden` (correto). Porém em `Home.tsx`, o hero image usa `alt="Aura Pay"` — genérico demais.

### A11Y-04: Contraste insuficiente no dark mode

- **Problema:** `--muted-foreground: 240 5% 60%` sobre `--background: 240 10% 4%` pode não atingir ratio WCAG AA 4.5:1.
- **Correção:** Validar com ferramenta de contraste e ajustar.

### A11Y-05: Tabelas sem `<caption>` ou `aria-label`

- **Problema:** Tabelas no Carrinho e Checkout não têm caption descritivo.

### A11Y-06: Quantidade no carrinho — input `type="number"` sem label

- **Arquivo:** [Carrinho.tsx:87-91](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/pages/Carrinho.tsx#L87)
- **Problema:** `<Input type="number">` sem `<Label>` ou `aria-label`.

---

## 6. Problemas de Performance

### PERF-01: N+1 requests no catálogo (CRÍTICO)

- Já descrito em ARCH-04. Cada listagem de produtos faz 1+N requests.

### PERF-02: N² requests no admin (CRÍTICO)

- Já descrito em ARCH-05.

### PERF-03: Sem lazy loading de rotas (MÉDIO)

- **Problema:** Todas as 30 páginas são importadas estaticamente em `AppRouter.tsx`. O bundle initial carrega tudo.
- **Impacto:** Bundle size aumentado, tempo de first load maior.
- **Correção:** Usar `React.lazy()` + `Suspense` para rotas admin e checkout.

### PERF-04: Sem code splitting por feature (MÉDIO)

- **Problema:** Sem dynamic imports. Recharts (pesado ~200KB) é carregado mesmo que o usuário nunca acesse o Dashboard.
- **Correção:** Lazy load do Dashboard e componentes que usam Recharts.

### PERF-05: `BRL` formatter recriado em cada página (BAIXO)

- **Problema:** `new Intl.NumberFormat("pt-BR", ...)` é instanciado em 8+ arquivos distintos.
- **Correção:** Centralizar em `shared/lib/format.ts`.

### PERF-06: `useIsMobile` retorna `false` na primeira renderização SSR-like

- **Arquivo:** [use-mobile.tsx:18](file:///c:/Users/matheus.ksouza/Downloads/shopbank-feat-react/shopbank-feat-react/front-end/src/hooks/use-mobile.tsx#L18)
- **Problema:** `!!undefined` retorna `false`, causando flash de layout desktop em mobile na primeira renderização.
- **Correção:** Retornar `undefined` ou usar media query CSS.

---

## 7. Qualidade React

### REACT-01: `useCallback` com instabilidade de dependências no AuthContext

- Já descrito em BUG-03. `loginMutation` e `registerMutation` são instáveis.

### REACT-02: `formatZipCode` duplicado

- **Locais:** `CheckoutEndereco.tsx:15` e `CheckoutPedido.tsx:24` — mesma função copiada.
- **Correção:** Mover para `lib/masks.ts`.

### REACT-03: `main.tsx` sem `<StrictMode>` (BAIXO)

- **Problema:** Sem `<React.StrictMode>`, efeitos colaterais duplicados e bugs de cleanup não são detectados em dev.
- **Correção:** Envolver em `<StrictMode>`.

### REACT-04: Hooks `use-toast.ts` duplicados

- **Locais:** `hooks/use-toast.ts` (3.9KB) e `components/ui/use-toast.ts` (82B, re-export).
- **Problema:** O hook Radix toast não é utilizado em nenhum componente (tudo usa Sonner).
- **Correção:** Remover ambos + `components/ui/toaster.tsx` + `components/ui/toast.tsx`.

### REACT-05: Sem Error Boundaries (MÉDIO)

- **Problema:** Nenhum Error Boundary no projeto. Um erro em qualquer componente derruba toda a aplicação.
- **Correção:** Adicionar `ErrorBoundary` global em `AppProviders` e por rota.

### REACT-06: `decodeJwtPayload` duplicado

- **Locais:** `store/auth.ts:31-38` e `authMapper.ts:8-19`.
- **Correção:** Extrair para `shared/lib/jwt.ts`.

---

## 8. Integração com API

### API-01: Tratamento de erro 403 ausente no interceptor

- **Problema:** O interceptor só trata 401. Erros 403 (forbidden) não limpam sessão nem redirecionam.
- **Correção:** Adicionar tratamento de 403.

### API-02: Sem retry configurado para mutations

- **Problema:** Queries têm `retry: 1`, mas mutations não têm retry. Falhas de rede em POST de pedido = pedido perdido.
- **Correção:** Adicionar retry com backoff para mutations idempotentes.

### API-03: Timeout de 15s pode ser insuficiente para admin

- **Problema:** Com o N+1/N² de requests do admin, o timeout global de 15s pode causar cascata de falhas.

### API-04: Cache incorreto para `listAll` no `OrderHttpRepository`

- **Problema:** `listAll` sem `customerId` chama `getMyOrders()` (retorna pedidos do user logado), mas é usado pelo admin que espera ver TODOS os pedidos. Query key não diferencia.

---

## 9. Cobertura de Testes

| Tipo | Quantidade | Qualidade |
|---|---|---|
| Unit tests (mappers) | 5 arquivos | ✅ Bom — `authMapper.test.ts`, `accountMapper.test.ts`, etc. |
| Component tests | 2 arquivos | ⚠️ Básico — `AppProviders.test.tsx`, `ProtectedRoute.test.tsx` |
| Integration tests | 0 | 🔴 Inexistente |
| E2E tests | 0 | 🔴 Inexistente |
| Total coverage estimada | ~5-8% | 🔴 Crítico |

**Correção:** Priorizar testes para: Auth flow, Checkout flow, Cart operations, Protected routes.

---

## 10. Melhorias Recomendadas

### Plano de Ação Priorizado

#### 🔴 P0 — Imediato (Segurança e Bloqueadores)

1. **Corrigir conflito de porta** Vite vs API
2. **Ativar `strict: true`** no TypeScript (incremental)
3. **Mover token para httpOnly cookie** ou adicionar expiração client-side
4. **Adicionar Error Boundary global**
5. **Adicionar `<StrictMode>`**

#### 🟠 P1 — Curto Prazo (Performance e Qualidade)

1. **Lazy loading de rotas** — especialmente admin e checkout
2. **Resolver N+1 de requests** no catálogo (endpoint backend ou batch)
3. **Resolver N² de requests** no admin (endpoints dedicados)
4. **Consolidar `UserRole` type** em single source of truth
5. **Remover código morto** — `usePolling`, `use-toast`, `Toaster` Radix, rotas duplicadas
6. **Extrair custom hooks** das páginas monolíticas (CheckoutPagamento, Admin*)

#### 🟡 P2 — Médio Prazo (UX e Manutenibilidade)

1. **Padronizar idioma** — definir PT-BR como primário, corrigir acentos
2. **Implementar ou remover** ForgotPassword/ResetPassword/VerifyEmail
3. **Implementar busca global** no header ou remover input decorativo
4. **Centralizar formatters** (BRL, formatZipCode, etc.)
5. **Adicionar testes de integração** para fluxos críticos
6. **Adicionar i18n** se o público for internacional

#### 🟢 P3 — Longo Prazo (Excelência)

1. **Acessibilidade WCAG AA** — skip nav, aria-describedby, contrast audit
2. **Lighthouse audit** — Web Vitals optimization
3. **E2E tests** com Playwright/Cypress
4. **Design tokens centralizados** — extrair BRL formatter, spacing, etc.
5. **Monitoramento de erros** — Sentry ou similar
6. **PWA capabilities** — offline support, push notifications

---

## Conclusão

O projeto demonstra **boa arquitetura base** com Feature-Sliced Design, uso correto de TanStack Query, Zustand para estado local, e um design system coerente com shadcn/ui. A separação domain/infrastructure/application é sólida e escalável.

Os **riscos principais** são: segurança do token (localStorage), performance do admin (N² requests), e a ausência quase total de testes automatizados. O TypeScript com `strict: false` anula grande parte da segurança de tipos.

A UI é **visualmente premium** no dark mode, mas a inconsistência de idiomas (PT/EN) e a presença de funcionalidades stub (forgot password, busca no header, notificações) prejudicam a percepção de qualidade.

**Recomendação:** Priorizar os itens P0 e P1 antes de qualquer nova feature. O risco técnico atual é **médio-alto** e tende a crescer conforme novas features são adicionadas sem a rede de segurança de testes e type safety.
