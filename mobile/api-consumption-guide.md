# Guia de Consumo da API - ShopBank API

Este documento serve para alinhar todos os pontos e configurações necessárias para consumir corretamente a API do **ShopBank API** (v1.0.0).

## 1. Configurações Globais e Autenticação

- **Base URL:** `http://localhost:8080`
- **Segurança:** A API utiliza autenticação baseada em token JWT (`bearerAuth`). 
  - Você deve passar o header: `Authorization: Bearer <seu_token>` para as rotas protegidas.
- **Formato Padrão:** O tipo de dados consumido e recebido na maioria das requisições é `application/json`.
- **Rotas Públicas vs Privadas:** Rotas sob `/api/auth/login` e `/api/auth/register` provavelmente são públicas. O resto costuma requerer token JWT válido.

## 2. Visão Geral das Rotas e Headers Necessários

### Autenticação (`auth-controller`)
- `POST /api/auth/register`: Registrar um novo usuário. Requer payload com `email` e `password`.
- `POST /api/auth/login`: Fazer login para obter o token JWT.
  - **Payload:** `{"email": "string", "password": "string"}`
  - **Retorno:** `{ "token": "string" }`

### Produtos (`product-controller`)
- `GET /api/products`: Lista todos os produtos.
- `GET /api/products/{id}`: Detalhes de um produto.
- `POST /api/products`: Cria um produto.
- `PUT /api/products/{id}`: Atualiza um produto.
- `DELETE /api/products/{id}`: Deleta um produto.
  * *Campos obrigatórios de Produto*: `categoryId`, `name`, `price`, `storeId`.

### Clientes (`customer-controller`)
- `GET /api/customers` / `POST /api/customers`: Listagem e Criação.
  * O CPF tem validação de padrão (`\d{11}`).
- `GET /api/customers/{id}` / `PUT /api/customers/{id}` / `DELETE /api/customers/{id}`: Operações via ID numérico.

### Endereços (`address-controller` / `customer-address-controller`)
- `POST /api/customers/{customerId}/addresses`: Criar um endereço para um cliente específico.
  * Campos como `cep`, bairro, rua possuem validação rígida.
- `GET /api/addresses/customer/{customerId}`: Buscar todos os endereços de um cliente.
- `PATCH /api/addresses/{addressId}/favorite`: Favoritar endereço.
- `GET /api/addresses/postal-code/{postalCode}`: Integração inteligente para buscar detalhes do CEP (ViaCep).

### Pedidos (`order-controller`)
- `POST /api/orders`: Criar um pedido. Exige associação de um cliente, um endereço do cliente e array de `items` (produtos + quantidade).
- `GET /api/orders/my-orders`: Listar pedidos do usuário autenticado.
- `GET /api/orders/{id}`: Obter pedido por ID.
- `PATCH /api/orders/{id}/status`: Atualizar o status do pedido (`CREATED`, `PAID`, `SHIPPED`, etc).
- `PATCH /api/orders/{id}/cancel`: Cancelar um pedido.

### Pagamentos (`payment-controller`)
- As rotas de pagamento estão ligadas a transações externas:
- `POST /api/payments/abacatepay/checkout/{orderId}`: Cria um checkout AbacatePay atrelado a uma ORDEM de serviço.
- `POST /api/payments/abacatepay/webhook`: Webhook para notificar mudança de status.
- `POST /api/payments/{paymentId}/simulate-approval`: Para ambiente de desenvolvimento, simula a aprovação automática do pagamento.

### Estoque (`inventory-controller`)
- `POST /api/inventory/reserve`: Reserva quantidade no estoque antes do pagamento ser confirmado.
- `POST /api/inventory/replenish`: Reposição de estoque.
- `GET /api/inventory/product/{id}`: Confere o saldo do produto.

### Administração (`admin-controller`)
*Possivelmente exige um JWT com role = `ADMIN`.*
- `GET /api/admin/dashboard`: Visão consolidada (clientes, faturamento, pagamentos aprovados).
- `GET /api/admin/reports`: Relatórios de pedidos e pagamentos.

## 3. Boas Práticas ao Consumir
1. **Tratamento de Token:** Capture e armazene o token JWT do `/api/auth/login` persistindo-o adequadamente no seu Frontend (LocalStorage ou Secure Cookie).
2. **Ciclo de Compra:**
   - 1. Autenticar.
   - 2. Buscar/Criar o Customer (`/api/customers`).
   - 3. Escolher Produto (`/api/products`).
   - 4. Gerar Pedido (`/api/orders`).
   - 5. Gerar preferência de pagamento passando o Order ID gerado.
   - 6. Aguardar webhook de pagamento alterar status para `PAID` ou usar a simulação de dev.
3. **Validação:** Cuidado com payloads incorretos. A API possui regex patterns estritos como CPF `\d{11}` e CEP `\d{8}`. Nunca passe máscaras de formatação no payload.
