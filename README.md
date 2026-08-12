# ShopBank

Projeto final ShopBank com back-end Spring Boot, front-end React/Vite e app mobile Expo.

## Stack

- Back-end: Java 21, Spring Boot 3.5, Spring Web, Security, Data JPA, Validation, H2, Swagger/OpenAPI, ActiveMQ JMS e AbacatePay.
- Front-end: React 18, Vite, TypeScript, TanStack Query, Zustand, Tailwind, Radix/shadcn UI e Jest.
- Mobile: Expo SDK 54, React Native, Expo Router, TypeScript, NativeWind, AsyncStorage, Axios e Zustand.

## Pre-requisitos

- Java JDK 21.
- Node.js LTS e npm.
- ActiveMQ Classic 6.2.x.
- Expo Go ou emulador Android/iOS para o mobile.
- ngrok, Cloudflare Tunnel ou outro tunel HTTPS se for testar webhooks reais da AbacatePay.
- Chave de API da AbacatePay se for usar pagamentos reais.

## Ordem para rodar

1. Suba o ActiveMQ.
2. Configure as variaveis do back-end.
3. Suba o back-end.
4. Suba o front-end.
5. Suba o mobile, se precisar testar o app.

## ActiveMQ

Baixe o ActiveMQ Classic 6.2.x e rode:

```powershell
cd C:\Users\Matheus\apache-activemq-6.2.5\bin\win64
.\activemq.bat start
```

Console:

```text
http://127.0.0.1:8161/
usuario: admin
senha: admin
```

O back-end usa:

```text
tcp://localhost:61616
fila: pagamentos.queue
```

## Back-end

Pasta:

```powershell
cd back-end
```

Rodar testes:

```powershell
.\mvnw.cmd test
```

Subir API:

```powershell
.\mvnw.cmd spring-boot:run
```

URLs locais:

```text
API: http://localhost:8080
Swagger: http://localhost:8080/swagger-ui.html
H2 Console: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:shopbank
User: sa
Password: vazio
```

## Variaveis do back-end

Para rodar sem gateway real, nenhuma variavel da AbacatePay e obrigatoria. A API sobe em sandbox e usa dados mock quando nao ha `ABACATEPAY_API_KEY`.

Para pagamentos reais:

```powershell
$env:ABACATEPAY_API_KEY="sua-chave"
$env:ABACATEPAY_WEBHOOK_SECRET="um-segredo-forte"
$env:ABACATEPAY_SANDBOX="true"
$env:APP_PUBLIC_URL="https://sua-url-publica.ngrok-free.app"
```

Para expor o back-end local:

```powershell
ngrok http 8080
```

Use a URL HTTPS gerada pelo ngrok em `APP_PUBLIC_URL`. A AbacatePay nao envia webhook para `localhost`, HTTP ou IP privado.

O back-end tenta cadastrar automaticamente o webhook na AbacatePay quando:

- `ABACATEPAY_API_KEY` esta preenchida.
- `ABACATEPAY_WEBHOOK_SECRET` esta preenchido.
- `APP_PUBLIC_URL` e HTTPS publico.
- `ABACATEPAY_WEBHOOK_AUTO_REGISTRATION_ENABLED` nao foi definido como `false`.

Endpoint cadastrado:

```text
POST {APP_PUBLIC_URL}/api/payments/abacatepay/webhook?webhookSecret={ABACATEPAY_WEBHOOK_SECRET}
```

Eventos cadastrados:

```text
checkout.completed
checkout.refunded
checkout.disputed
checkout.lost
transparent.completed
transparent.refunded
transparent.disputed
transparent.lost
```

## Autenticacao e Swagger

Para usar rotas protegidas no Swagger:

1. Abra `POST /api/auth/login`.
2. Use um usuario seed.
3. Copie o token JWT da resposta.
4. Clique em `Authorize`.
5. Informe:

```text
Bearer SEU_TOKEN
```

Usuarios seed:

```text
admin@shopbank.com / 123456
cliente@shopbank.com / 123456
maria@shopbank.com / 123456
joao@shopbank.com / 123456
```

CPF de teste valido:

```text
52998224725
```

## Pagamentos

Metodos usados no projeto:

- Pix: checkout transparente AbacatePay. Mostra QR Code e copia e cola.
- Boleto: checkout transparente AbacatePay. Mostra URL do boleto e, em pagamento real, aguarda `transparent.completed`.
- Cartao de debito: abre checkout externo da AbacatePay, porque nao ha fluxo transparente no projeto.

### Pix, boleto e webhook da AbacatePay

Ponto importante: a documentacao da AbacatePay mostra eventos `transparent.completed` para Pix, boleto e cartao, mas esses exemplos sao payloads de webhook enviados pela AbacatePay quando ela considera o pagamento concluido. Isso nao significa que o endpoint de simulacao aceite todos os metodos.

No sandbox, a simulacao oficial de pagamento transparente da AbacatePay funciona para Pix. Esse endpoint depende de um Pix QR Code; por isso, quando tentamos usa-lo para boleto, a propria AbacatePay retorna erro parecido com:

```text
Pix QR Code not found
```

Por causa disso, o comportamento no projeto e:

- Pix: gera o Pix na AbacatePay e o botao de simulacao chama a AbacatePay. Se ela enviar webhook, aparece nos logs do dashboard da AbacatePay.
- Boleto: gera o boleto na AbacatePay, mas o botao de aprovacao do app e local para desenvolvimento. Ele passa pelo parser local de webhook, grava `WebhookLog`, envia para a fila `pagamentos.queue` e baixa o pedido, mas nao aparece nos logs do dashboard da AbacatePay porque a chamada nao saiu da AbacatePay.
- Cartao de debito: abre checkout externo da AbacatePay. O projeto nao tem fluxo transparente de debito.

Para aparecer no dashboard da AbacatePay, o evento precisa ser enviado pela propria AbacatePay para a URL publica cadastrada. Uma aprovacao local do botao do app nunca aparece la.

Para testar webhook real de boleto:

1. Suba o back-end com `ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`, `ABACATEPAY_SANDBOX=true` e `APP_PUBLIC_URL` HTTPS publico.
2. Gere um boleto pelo front-end ou mobile.
3. Conclua o boleto por um fluxo que a AbacatePay reconheca como pago no ambiente dela.
4. Confira no dashboard da AbacatePay se chegou `transparent.completed`.
5. Confira no back-end se o evento entrou em `WebhookLog` e foi processado pela fila `pagamentos.queue`.

Fluxo do webhook:

```text
AbacatePay -> /api/payments/abacatepay/webhook -> WebhookLog -> ActiveMQ pagamentos.queue -> PaymentConsumer -> baixa pedido e conta
```

Se o boleto for pago e nada acontecer:

- Confirme que o ActiveMQ esta rodando na porta `61616`.
- Confirme que `APP_PUBLIC_URL` e uma URL HTTPS publica, nao `localhost`.
- Confirme que `ABACATEPAY_WEBHOOK_SECRET` no back-end e o mesmo cadastrado no webhook.
- Veja no log do back-end se apareceu `AbacatePay webhook registered`.
- Veja no console da AbacatePay se existe webhook com evento `transparent.completed`.
- Confira se a URL termina em `/api/payments/abacatepay/webhook?webhookSecret=...`.

## Front-end

Pasta:

```powershell
cd front-end
```

Instalar:

```powershell
npm.cmd install
```

Arquivo `.env`:

```env
VITE_API_BASE_URL=
```

Com `VITE_API_BASE_URL` vazio, o Vite usa proxy para `http://localhost:8080`.

Rodar:

```powershell
npm.cmd run dev
```

URL:

```text
http://localhost:5173
```

Qualidade:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test -- --runInBand
```

## Mobile

Pasta:

```powershell
cd mobile
```

Instalar:

```powershell
npm.cmd install
```

Para usar API real, configure `.env.development`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_USE_MOCK=false
```

Se estiver usando celular fisico, troque `localhost` pelo IP da sua maquina na rede:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:8080
EXPO_PUBLIC_USE_MOCK=false
```

Rodar:

```powershell
npm.cmd start
```

Atalhos:

```powershell
npm.cmd run android
npm.cmd run ios
npm.cmd run web
npm.cmd run typecheck
```

## Comandos de validacao

Back-end:

```powershell
cd back-end
.\mvnw.cmd test
```

Front-end:

```powershell
cd front-end
npm.cmd run build
```

Mobile:

```powershell
cd mobile
npm.cmd run typecheck
```

## Problemas comuns

`Could not connect to broker URL tcp://localhost:61616`:

- O ActiveMQ nao esta rodando.
- Suba com `.\activemq.bat start`.

Webhook da AbacatePay nao chega:

- A AbacatePay exige endpoint HTTPS publico.
- Use ngrok e atualize `APP_PUBLIC_URL`.
- Reinicie o back-end depois de mudar variaveis.
- Confira se o webhook foi cadastrado com `transparent.completed`.

Mobile nao conecta na API:

- Em celular fisico, `localhost` aponta para o proprio celular.
- Use o IP local do computador no `EXPO_PUBLIC_API_URL`.

Swagger retorna 401:

- Gere token em `/api/auth/login`.
- Use `Bearer <token>` no botao `Authorize`.

## Estrutura

```text
back-end/   API Spring Boot
front-end/  Web React/Vite
mobile/     App Expo/React Native
```
