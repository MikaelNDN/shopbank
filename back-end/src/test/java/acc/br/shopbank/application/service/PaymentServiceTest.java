package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.BoletoPaymentRequest;
import acc.br.shopbank.application.dto.CardPaymentRequest;
import acc.br.shopbank.application.dto.PaymentResponse;
import acc.br.shopbank.application.dto.PixPaymentRequest;
import acc.br.shopbank.application.dto.TransparentPaymentResponse;
import acc.br.shopbank.application.dto.WebhookLogResponse;
import acc.br.shopbank.application.dto.WebhookRequest;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.*;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway.AbacatePayPaymentResult;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway.PaymentPayerInput;
import acc.br.shopbank.domain.gateway.PaymentGateway;
import acc.br.shopbank.domain.gateway.PaymentGatewayPreference;
import acc.br.shopbank.domain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.jms.core.JmsTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private WebhookLogRepository webhookLogRepository;

    @Mock
    private CheckingAccountService checkingAccountService;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private AbacatePayPaymentsGateway paymentsGateway;

    @Mock
    private JmsTemplate jmsTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private PaymentService paymentService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        paymentService = new PaymentService(
                jmsTemplate,
                paymentRepository,
                orderRepository,
                paymentEventRepository,
                webhookLogRepository,
                checkingAccountService,
                inventoryService,
                auditLogService,
                paymentGateway,
                paymentsGateway,
                objectMapper
        );
    }

    @Test
    void shouldCreateAbacatePayCheckout() {
        Order order = reservedOrder();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        when(paymentGateway.createPreference(order))
                .thenReturn(new PaymentGatewayPreference("bill-1", "https://pay.abacatepay.com/checkout"));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(9L);
            return payment;
        });

        PaymentResponse response = paymentService.createAbacatePayCheckout(1L);

        assertEquals(9L, response.id());
        assertEquals(PaymentMethod.ABACATEPAY, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertTrue(response.checkoutUrl().contains("abacatepay"));
        verify(paymentGateway).createPreference(order);
        verify(paymentEventRepository).save(any(PaymentEvent.class));
    }

    @Test
    void shouldReusePendingAbacatePayCheckout() {
        Order order = reservedOrder();
        Payment existingPayment = Payment.builder()
                .id(9L)
                .order(order)
                .method(PaymentMethod.ABACATEPAY)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPreferenceId("bill-1")
                .gatewayPaymentId("bill-1")
                .checkoutUrl("https://pay.abacatepay.com/bill-1")
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(existingPayment));

        PaymentResponse response = paymentService.createAbacatePayCheckout(1L);

        assertEquals(9L, response.id());
        assertEquals(PaymentMethod.ABACATEPAY, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals("https://pay.abacatepay.com/bill-1", response.checkoutUrl());
        verify(paymentGateway, never()).createPreference(any());
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(paymentEventRepository, never()).save(any(PaymentEvent.class));
    }

    @Test
    void shouldThrowWhenAbacatePayGatewayIsNotConfigured() {
        Order order = reservedOrder();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        when(paymentGateway.createPreference(order))
                .thenThrow(new BusinessException("AbacatePay API key is not configured"));

        assertThrows(BusinessException.class, () -> paymentService.createAbacatePayCheckout(1L));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void shouldThrowWhenOrderIsNotReservedForPreference() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.PAID);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(BusinessException.class, () -> paymentService.createAbacatePayCheckout(1L));
    }

    @Test
    void shouldThrowWhenOrderIsMissingForPreference() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.createAbacatePayCheckout(99L));
    }

    @Test
    void shouldPayWithPix() {
        Order order = reservedOrder();
        PixPaymentRequest request = new PixPaymentRequest(
                "cliente@email.com",
                "12345678900",
                "Maria",
                "Silva"
        );

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        stubPaymentSaveWithId(8L);
        when(paymentsGateway.createPixPayment(eq(order), any(PaymentPayerInput.class), eq(BigDecimal.ZERO)))
                .thenReturn(new AbacatePayPaymentResult(
                        "pix-12345",
                        "PENDING",
                        "PENDING",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "PIX",
                        "1",
                        null,
                        "qr-code",
                        "qr-base64",
                        null,
                        null
                ));

        TransparentPaymentResponse response = paymentService.payWithPix(1L, request);

        assertEquals(8L, response.id());
        assertEquals(PaymentMethod.PIX, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals("pix-12345", response.gatewayPaymentId());
        assertEquals("qr-code", response.qrCode());
        assertEquals("qr-base64", response.qrCodeBase64());
        verify(paymentEventRepository).save(any(PaymentEvent.class));
        verifyNoInteractions(checkingAccountService);
    }

    @Test
    void shouldPayWithBoleto() {
        Order order = reservedOrder();
        BoletoPaymentRequest request = new BoletoPaymentRequest(
                "cliente@email.com",
                "12345678900",
                "Maria",
                "Silva"
        );

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        stubPaymentSaveWithId(8L);
        when(paymentsGateway.createBoletoPayment(eq(order), any(PaymentPayerInput.class), eq(BigDecimal.ZERO)))
                .thenReturn(new AbacatePayPaymentResult(
                        "boleto-12345",
                        "PENDING",
                        "PENDING",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "BOLETO",
                        "1",
                        null,
                        null,
                        null,
                        "https://boleto.test/12345",
                        "https://boleto.test/12345"
                ));

        TransparentPaymentResponse response = paymentService.payWithBoleto(1L, request);

        assertEquals(PaymentMethod.BOLETO, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals("https://boleto.test/12345", response.boletoUrl());
        assertEquals("https://boleto.test/12345", response.checkoutUrl());
    }

    @Test
    void shouldKeepCardCheckoutPendingWhenCreateReturnsPaid() {
        Order order = reservedOrder();
        CardPaymentRequest request = new CardPaymentRequest(
                "card-token",
                "visa",
                "123",
                1,
                "cliente@email.com",
                "12345678900",
                "Maria",
                "Silva",
                "shopbank://payment/1",
                "shopbank://payment/1"
        );

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        stubPaymentSaveWithId(8L);
        when(paymentsGateway.createCardPayment(eq(order), any(AbacatePayPaymentsGateway.CardPaymentInput.class)))
                .thenReturn(new AbacatePayPaymentResult(
                        "bill-12345",
                        "PAID",
                        "PAID",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "CARD",
                        "1",
                        "2026-05-09T19:00:00Z",
                        null,
                        null,
                        null,
                        "https://app.abacatepay.com/pay/bill-12345"
                ));

        TransparentPaymentResponse response = paymentService.payWithCard(1L, request);

        assertEquals(PaymentMethod.CREDIT_CARD, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals("checkout.created", response.statusDetail());
        assertEquals(OrderStatus.RESERVED, order.getStatus());
        assertNull(response.confirmedAt());
        assertEquals("https://app.abacatepay.com/pay/bill-12345", response.checkoutUrl());
        verifyNoInteractions(checkingAccountService);
        verify(inventoryService, never()).confirmReserved(anyLong(), anyInt());
    }

    @Test
    void shouldPayWithCardAndReturnHostedCheckout() {
        Order order = reservedOrder();
        CardPaymentRequest request = new CardPaymentRequest(
                null,
                null,
                null,
                1,
                "cliente@email.com",
                "52998224725",
                "Maria",
                "Silva",
                "shopbank://payment/1",
                "shopbank://payment/1"
        );

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        stubPaymentSaveWithId(8L);
        when(paymentsGateway.createCardPayment(eq(order), any(AbacatePayPaymentsGateway.CardPaymentInput.class)))
                .thenReturn(new AbacatePayPaymentResult(
                        "bill-card-12345",
                        "PENDING",
                        "PENDING",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "CARD",
                        "1",
                        "2026-05-09T19:00:00Z",
                        null,
                        null,
                        null,
                        "https://app.abacatepay.com/pay/bill-card-12345"
                ));

        TransparentPaymentResponse response = paymentService.payWithCard(1L, request);

        assertEquals(PaymentMethod.CREDIT_CARD, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals("bill-card-12345", response.gatewayPaymentId());
        assertEquals("https://app.abacatepay.com/pay/bill-card-12345", response.checkoutUrl());
        verifyNoInteractions(checkingAccountService);
        verify(inventoryService, never()).confirmReserved(anyLong(), anyInt());
    }

    @Test
    void shouldRefreshAbacatePayPaymentAsApproved() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(8L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("pix-12345")
                .build();

        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentsGateway.getPayment("pix-12345", PaymentMethod.PIX))
                .thenReturn(new AbacatePayPaymentResult(
                        "pix-12345",
                        "PAID",
                        "PAID",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "PIX",
                        "1",
                        "2026-05-09T19:00:00Z",
                        null,
                        null,
                        null,
                        null
                ));

        TransparentPaymentResponse response = paymentService.refreshFromAbacatePay(1L);

        assertEquals(PaymentStatus.APPROVED, response.status());
        assertEquals(OrderStatus.PAID, order.getStatus());
        verify(checkingAccountService).debitCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Payment debit for order");
    }

    @Test
    void shouldSimulateAbacatePayTransparentPaymentAsApproved() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(8L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("pix-12345")
                .build();

        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentsGateway.simulateTransparentPayment("pix-12345"))
                .thenReturn(new AbacatePayPaymentResult(
                        "pix-12345",
                        "PAID",
                        "PAID",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "PIX",
                        "1",
                        "2026-05-09T19:00:00Z",
                        "qr-code",
                        "qr-base64",
                        null,
                        null
                ));

        TransparentPaymentResponse response = paymentService.simulateAbacatePayPayment(1L);

        assertEquals(PaymentStatus.APPROVED, response.status());
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals("qr-code", response.qrCode());
        verify(paymentsGateway).simulateTransparentPayment("pix-12345");
        verify(checkingAccountService).debitCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Payment debit for order");
    }

    @Test
    void shouldSimulateBoletoPaymentThroughLocalWebhookWithoutCallingPixSimulationEndpoint() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(8L)
                .order(order)
                .method(PaymentMethod.BOLETO)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("boleto-12345")
                .boletoUrl("https://pay.abacatepay.com/boleto-12345")
                .build();
        AtomicReference<WebhookLog> savedWebhookLog = new AtomicReference<>();

        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByGatewayPaymentId("boleto-12345")).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "transparent.completed-boleto-12345"))
                .thenReturn(Optional.empty())
                .thenAnswer(invocation -> Optional.of(savedWebhookLog.get()));
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> {
            WebhookLog webhookLog = invocation.getArgument(0);
            if (webhookLog.getId() == null) {
                webhookLog.setId(1L);
            }
            savedWebhookLog.set(webhookLog);
            return webhookLog;
        });

        TransparentPaymentResponse response = paymentService.simulateAbacatePayPayment(1L);

        assertEquals(PaymentStatus.APPROVED, response.status());
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals("transparent.completed", response.statusDetail());
        assertEquals("https://pay.abacatepay.com/boleto-12345", response.boletoUrl());
        assertNotNull(savedWebhookLog.get());
        assertTrue(savedWebhookLog.get().getProcessed());
        verify(paymentsGateway, never()).simulateTransparentPayment(anyString());
        verify(jmsTemplate).convertAndSend(eq("pagamentos.queue"), contains("\"transparent.completed\""));
        verify(checkingAccountService).debitCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Payment debit for order");
    }

    @Test
    void shouldNotApproveHostedAbacatePayCheckoutOnRefresh() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(8L)
                .order(order)
                .method(PaymentMethod.ABACATEPAY)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("bill-12345")
                .checkoutUrl("https://pay.abacatepay.com/bill-12345")
                .build();

        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentsGateway.getPayment("bill-12345", PaymentMethod.ABACATEPAY))
                .thenReturn(new AbacatePayPaymentResult(
                        "bill-12345",
                        "PAID",
                        "PAID",
                        order.getTotalAmount(),
                        "Pedido 1",
                        "CHECKOUT",
                        "1",
                        "2026-05-09T19:00:00Z",
                        null,
                        null,
                        null,
                        null
                ));

        TransparentPaymentResponse response = paymentService.refreshFromAbacatePay(1L);

        assertEquals(PaymentMethod.ABACATEPAY, response.method());
        assertEquals(PaymentStatus.PENDING, response.status());
        assertEquals(OrderStatus.RESERVED, order.getStatus());
        verify(paymentsGateway).getPayment("bill-12345", PaymentMethod.ABACATEPAY);
        verifyNoInteractions(checkingAccountService);
    }

    @Test
    void shouldFindTransparentPaymentByOrderId() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(8L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("pix-12345")
                .qrCode("qr-code")
                .build();

        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));

        TransparentPaymentResponse response = paymentService.findTransparentByOrderId(1L);

        assertEquals(8L, response.id());
        assertEquals("qr-code", response.qrCode());
    }

    @Test
    void shouldApproveSimulatedPayment() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();

        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(orderRepository.save(order)).thenReturn(order);

        PaymentResponse response = paymentService.simulateApproval(5L);

        assertEquals(PaymentStatus.APPROVED, response.status());
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertNotNull(payment.getConfirmedAt());
        verify(checkingAccountService).debitCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Payment debit for order");
        verify(checkingAccountService, never()).creditMarketplace(any(BigDecimal.class), eq(order),
                eq(payment), anyString());
        verify(checkingAccountService).creditStore(2L, new BigDecimal("20.00"), order, payment,
                "Payment credit for order");
        verify(inventoryService).confirmReserved(100L, 2);
    }

    @Test
    void shouldReturnApprovedPaymentIdempotently() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.APPROVED)
                .amount(order.getTotalAmount())
                .build();

        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.simulateApproval(5L);

        assertEquals(PaymentStatus.APPROVED, response.status());
        verifyNoInteractions(checkingAccountService);
    }

    @Test
    void shouldThrowWhenPaymentCannotBeApproved() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.CANCELED)
                .amount(order.getTotalAmount())
                .build();

        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        assertThrows(BusinessException.class, () -> paymentService.simulateApproval(5L));
    }

    @Test
    void shouldThrowWhenOrderIsNotReservedForApproval() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.CANCELED);
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();

        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        assertThrows(BusinessException.class, () -> paymentService.simulateApproval(5L));
    }

    @Test
    void shouldRegisterWebhook() {
        WebhookRequest request = new WebhookRequest("abacatepay", "evt-1", "payment.approved", "{}");

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-1"))
                .thenReturn(Optional.empty());
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> {
            WebhookLog log = invocation.getArgument(0);
            log.setId(1L);
            return log;
        });

        WebhookLogResponse response = paymentService.registerWebhook(request);

        assertEquals(1L, response.id());
        assertTrue(response.processed());
        verify(auditLogService).record(eq("WebhookLog"), eq(1L), eq("RECEIVED"), isNull(),
                eq("payment.approved"), isNull(), eq("Webhook received"));
    }

    @Test
    void shouldReturnExistingWebhookWhenDuplicated() {
        WebhookLog existing = WebhookLog.builder()
                .id(1L)
                .provider("abacatepay")
                .eventId("evt-1")
                .eventType("payment.approved")
                .processed(true)
                .build();
        WebhookRequest request = new WebhookRequest("abacatepay", "evt-1", "payment.approved", "{}");

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-1"))
                .thenReturn(Optional.of(existing));

        WebhookLogResponse response = paymentService.registerWebhook(request);

        assertEquals(1L, response.id());
        verify(webhookLogRepository, never()).save(any(WebhookLog.class));
    }

    @Test
    void shouldQueueAbacatePayWebhookWithoutProcessingPaymentImmediately() {
        Map<String, Object> payload = Map.of(
                "id", "evt-queued",
                "event", "transparent.completed",
                "data", Map.of("transparent", Map.of(
                        "id", "pix-queued",
                        "externalId", "1",
                        "status", "PAID"
                ))
        );

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-queued"))
                .thenReturn(Optional.empty());
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> {
            WebhookLog log = invocation.getArgument(0);
            log.setId(1L);
            return log;
        });

        WebhookLogResponse response = paymentService.registerAbacatePayWebhook(payload);

        assertEquals(1L, response.id());
        assertFalse(response.processed());
        verify(jmsTemplate).convertAndSend(eq("pagamentos.queue"), anyString());
        verifyNoInteractions(paymentRepository);
        verify(auditLogService).record(eq("WebhookLog"), eq(1L), eq("RECEIVED"), isNull(),
                eq("transparent.completed"), isNull(), eq("AbacatePay webhook queued"));
    }

    @Test
    void shouldProcessAbacatePayApprovedWebhookFromQueue() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();
        Map<String, Object> payload = Map.of(
                "id", "evt-1",
                "event", "transparent.completed",
                "data", Map.of("transparent", Map.of(
                        "id", "pix-12345",
                        "externalId", "1",
                        "status", "PAID"
                ))
        );
        WebhookLog webhookLog = WebhookLog.builder()
                .id(1L)
                .provider("abacatepay")
                .eventId("evt-1")
                .eventType("transparent.completed")
                .processed(false)
                .build();

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-1"))
                .thenReturn(Optional.of(webhookLog));
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByGatewayPaymentId("pix-12345")).thenReturn(Optional.empty());
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(orderRepository.save(order)).thenReturn(order);

        paymentService.processAsynchronousWebhook(json(payload));

        assertTrue(webhookLog.getProcessed());
        assertEquals(PaymentStatus.APPROVED, payment.getStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals("pix-12345", payment.getGatewayPaymentId());
        verify(inventoryService).confirmReserved(100L, 2);
    }

    @Test
    void shouldMarkAbacatePayPaymentAsRejectedFromQueue() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();
        Map<String, Object> payload = Map.of(
                "id", "evt-2",
                "event", "transparent.disputed",
                "data", Map.of("transparent", Map.of(
                        "id", "pix-999",
                        "externalId", "1",
                        "status", "DISPUTED"
                ))
        );
        WebhookLog webhookLog = WebhookLog.builder()
                .id(2L)
                .provider("abacatepay")
                .eventId("evt-2")
                .eventType("transparent.disputed")
                .processed(false)
                .build();

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-2"))
                .thenReturn(Optional.of(webhookLog));
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByGatewayPaymentId("pix-999")).thenReturn(Optional.empty());
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.processAsynchronousWebhook(json(payload));

        assertTrue(webhookLog.getProcessed());
        assertEquals(PaymentStatus.REJECTED, payment.getStatus());
        verifyNoInteractions(checkingAccountService);
    }

    @Test
    void shouldProcessAbacatePayWebhookUsingMetadataOrderIdWhenExternalIdIsNullFromQueue() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("pix_char_CR4Erwc32Nzq0FcFRByc6xkJ")
                .build();

        Map<String, Object> transparent = new LinkedHashMap<>();
        transparent.put("id", "pix_char_CR4Erwc32Nzq0FcFRByc6xkJ");
        transparent.put("externalId", null);
        transparent.put("status", "PAID");
        transparent.put("metadata", Map.of("orderId", 1));

        Map<String, Object> payload = Map.of(
                "event", "transparent.completed",
                "data", Map.of("transparent", transparent)
        );
        WebhookLog webhookLog = WebhookLog.builder()
                .id(3L)
                .provider("abacatepay")
                .eventId("transparent.completed-pix_char_CR4Erwc32Nzq0FcFRByc6xkJ")
                .eventType("transparent.completed")
                .processed(false)
                .build();

        when(webhookLogRepository.findByProviderAndEventId(
                "abacatepay",
                "transparent.completed-pix_char_CR4Erwc32Nzq0FcFRByc6xkJ"
        )).thenReturn(Optional.of(webhookLog));
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByGatewayPaymentId("pix_char_CR4Erwc32Nzq0FcFRByc6xkJ"))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(orderRepository.save(order)).thenReturn(order);

        paymentService.processAsynchronousWebhook(json(payload));

        assertTrue(webhookLog.getProcessed());
        assertEquals(PaymentStatus.APPROVED, payment.getStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
        verify(paymentRepository).findByOrderId(1L);
    }

    @Test
    void shouldIgnoreStaleTransparentWebhookForCurrentCardPaymentFromQueue() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.CREDIT_CARD)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .gatewayPaymentId("bill-card-current")
                .build();

        Map<String, Object> payload = Map.of(
                "event", "transparent.completed",
                "data", Map.of("transparent", Map.of(
                        "id", "pix-old-12345",
                        "externalId", "1",
                        "status", "PAID"
                ))
        );
        WebhookLog webhookLog = WebhookLog.builder()
                .id(6L)
                .provider("abacatepay")
                .eventId("transparent.completed-pix-old-12345")
                .eventType("transparent.completed")
                .processed(false)
                .build();

        when(webhookLogRepository.findByProviderAndEventId(
                "abacatepay",
                "transparent.completed-pix-old-12345"
        )).thenReturn(Optional.of(webhookLog));
        when(webhookLogRepository.save(any(WebhookLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByGatewayPaymentId("pix-old-12345")).thenReturn(Optional.empty());
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));

        paymentService.processAsynchronousWebhook(json(payload));

        assertTrue(webhookLog.getProcessed());
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(OrderStatus.RESERVED, order.getStatus());
        assertEquals("bill-card-current", payment.getGatewayPaymentId());
        verify(paymentRepository, never()).save(payment);
        verifyNoInteractions(checkingAccountService);
    }

    @Test
    void shouldNotQueueAlreadyProcessedAbacatePayWebhookAgain() {
        WebhookLog existing = WebhookLog.builder()
                .id(1L)
                .provider("abacatepay")
                .eventId("evt-1")
                .eventType("transparent.completed")
                .processed(true)
                .build();
        Map<String, Object> payload = Map.of(
                "id", "evt-1",
                "event", "transparent.completed",
                "data", Map.of("transparent", Map.of("id", "pix-12345"))
        );

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-1"))
                .thenReturn(Optional.of(existing));

        WebhookLogResponse response = paymentService.registerAbacatePayWebhook(payload);

        assertEquals(1L, response.id());
        verify(jmsTemplate, never()).convertAndSend(eq("pagamentos.queue"), anyString());
        verifyNoInteractions(paymentGateway);
    }

    @Test
    void shouldIgnoreDuplicatedProcessedQueueMessage() {
        WebhookLog existing = WebhookLog.builder()
                .id(1L)
                .provider("abacatepay")
                .eventId("evt-1")
                .eventType("transparent.completed")
                .processed(true)
                .build();
        Map<String, Object> payload = Map.of(
                "id", "evt-1",
                "event", "transparent.completed",
                "data", Map.of("transparent", Map.of("id", "pix-12345"))
        );

        when(webhookLogRepository.findByProviderAndEventId("abacatepay", "evt-1"))
                .thenReturn(Optional.of(existing));

        paymentService.processAsynchronousWebhook(json(payload));

        verifyNoInteractions(paymentRepository);
        verify(webhookLogRepository, never()).save(any(WebhookLog.class));
    }

    private void stubPaymentSaveWithId(Long id) {
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            if (payment.getId() == null) {
                payment.setId(id);
            }
            return payment;
        });
    }

    private String json(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Order reservedOrder() {
        User user = User.builder().id(7L).email("cliente@email.com").active(true).role(UserRole.CLIENT).build();
        Customer customer = Customer.builder().id(1L).user(user).active(true).build();
        Product product = Product.builder()
                .id(100L)
                .storeId(2L)
                .name("Mouse")
                .price(new BigDecimal("10.00"))
                .active(true)
                .build();
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.RESERVED)
                .totalAmount(new BigDecimal("20.00"))
                .items(new ArrayList<>())
                .build();
        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("10.00"))
                .subtotal(new BigDecimal("20.00"))
                .build();
        order.getItems().add(item);
        return order;
    }
}
