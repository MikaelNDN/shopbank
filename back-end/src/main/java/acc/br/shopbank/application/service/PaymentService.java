package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.BoletoPaymentRequest;
import acc.br.shopbank.application.dto.CardPaymentRequest;
import acc.br.shopbank.application.dto.PaymentResponse;
import acc.br.shopbank.application.dto.PixPaymentRequest;
import acc.br.shopbank.application.dto.TransparentPaymentResponse;
import acc.br.shopbank.application.dto.WebhookLogResponse;
import acc.br.shopbank.application.dto.WebhookRequest;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway.AbacatePayPaymentResult;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway.CardPaymentInput;
import acc.br.shopbank.infrastructure.integration.payment.AbacatePayPaymentsGateway.PaymentPayerInput;
import acc.br.shopbank.domain.gateway.PaymentGateway;
import acc.br.shopbank.domain.gateway.PaymentGatewayPreference;
import acc.br.shopbank.domain.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import org.springframework.jms.core.JmsTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {


    private final JmsTemplate jmsTemplate;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentEventRepository paymentEventRepository;
    private final WebhookLogRepository webhookLogRepository;
    private final CheckingAccountService checkingAccountService;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;
    private final PaymentGateway paymentGateway;
    private final AbacatePayPaymentsGateway paymentsGateway;
    private final ObjectMapper objectMapper;

    @Value("${shopbank.marketplace.fee-rate:0.00}")
    private BigDecimal marketplaceFeeRate = BigDecimal.ZERO;

    public TransparentPaymentResponse payWithCard(Long orderId, CardPaymentRequest request) {
        Order order = loadAndValidateOrder(orderId);
        Payment payment = upsertPayment(order, PaymentMethod.CREDIT_CARD);

        PaymentPayerInput payer = new PaymentPayerInput(
                request.payerEmail(),
                request.payerFirstName(),
                request.payerLastName(),
                request.payerCpf()
        );
        CardPaymentInput input = new CardPaymentInput(
                request.token(),
                request.paymentMethodId(),
                request.issuerId(),
                request.installments(),
                payer,
                calculateMarketplaceFee(order),
                request.returnUrl(),
                request.completionUrl()
        );

        AbacatePayPaymentResult result = paymentsGateway.createCardPayment(order, input);
        applyHostedCheckoutResult(payment, order, result);
        return toTransparentResponse(payment);
    }

    public TransparentPaymentResponse payWithPix(Long orderId, PixPaymentRequest request) {
        Order order = loadAndValidateOrder(orderId);
        Payment payment = upsertPayment(order, PaymentMethod.PIX);

        PaymentPayerInput payer = new PaymentPayerInput(
                request.payerEmail(),
                request.payerFirstName(),
                request.payerLastName(),
                request.payerCpf()
        );
        AbacatePayPaymentResult result = paymentsGateway.createPixPayment(order, payer, calculateMarketplaceFee(order));
        applyAbacatePayResult(payment, order, result);
        return toTransparentResponse(payment);
    }

    public TransparentPaymentResponse payWithBoleto(Long orderId, BoletoPaymentRequest request) {
        Order order = loadAndValidateOrder(orderId);
        Payment payment = upsertPayment(order, PaymentMethod.BOLETO);

        PaymentPayerInput payer = new PaymentPayerInput(
                request.payerEmail(),
                request.payerFirstName(),
                request.payerLastName(),
                request.payerCpf()
        );
        AbacatePayPaymentResult result = paymentsGateway.createBoletoPayment(order, payer, calculateMarketplaceFee(order));
        applyAbacatePayResult(payment, order, result);
        return toTransparentResponse(payment);
    }

    private Order loadAndValidateOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.RESERVED && order.getStatus() != OrderStatus.WAITING_PAYMENT) {
            throw new BusinessException("Order must be reserved to create payment");
        }
        return order;
    }

    private Payment upsertPayment(Order order, PaymentMethod method) {
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .status(PaymentStatus.PENDING)
                        .method(method)
                        .build());
        payment.setMethod(method);
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setStatusDetail(null);
        payment.setGatewayPreferenceId(null);
        payment.setGatewayPaymentId(null);
        payment.setCheckoutUrl(null);
        payment.setQrCode(null);
        payment.setQrCodeBase64(null);
        payment.setBoletoUrl(null);
        payment.setConfirmedAt(null);
        return paymentRepository.save(payment);
    }

    private void applyAbacatePayResult(Payment payment, Order order, AbacatePayPaymentResult result) {
        if (result == null || result.id() == null) {
            throw new BusinessException("AbacatePay did not return payment id");
        }
        payment.setGatewayPaymentId(result.id());
        payment.setStatusDetail(result.statusDetail());

        if (StringUtils.hasText(result.qrCode())) {
            payment.setQrCode(result.qrCode());
        }
        if (StringUtils.hasText(result.qrCodeBase64())) {
            payment.setQrCodeBase64(result.qrCodeBase64());
        }
        if (StringUtils.hasText(result.boletoUrl())) {
            payment.setBoletoUrl(result.boletoUrl());
        }
        if (StringUtils.hasText(result.checkoutUrl())) {
            payment.setCheckoutUrl(result.checkoutUrl());
        }

        PaymentStatus mappedStatus = mapAbacatePayStatus(result.status(), result.statusDetail());
        payment.setStatus(mappedStatus);

        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, "payment.created", "orderId=" + order.getId());

        if (mappedStatus == PaymentStatus.APPROVED) {
            settleApprovedPayment(saved, order, "AbacatePay payment approved");
        }
    }

    private void applyHostedCheckoutResult(Payment payment, Order order, AbacatePayPaymentResult result) {
        if (result == null || result.id() == null) {
            throw new BusinessException("AbacatePay did not return payment id");
        }

        payment.setGatewayPaymentId(result.id());
        payment.setStatusDetail("checkout.created");
        payment.setStatus(PaymentStatus.PENDING);

        if (StringUtils.hasText(result.checkoutUrl())) {
            payment.setCheckoutUrl(result.checkoutUrl());
        }

        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, "payment.created", "orderId=" + order.getId());
    }

    private PaymentStatus mapAbacatePayStatus(String status, String eventType) {
        String normalizedStatus = status == null ? "" : status.toUpperCase();
        String normalizedEvent = eventType == null ? "" : eventType.toLowerCase();

        if (normalizedEvent.endsWith(".completed") || "PAID".equals(normalizedStatus)) {
            return PaymentStatus.APPROVED;
        }

        if (normalizedEvent.endsWith(".refunded") || "REFUNDED".equals(normalizedStatus)) {
            return PaymentStatus.REFUNDED;
        }

        if (normalizedEvent.endsWith(".disputed") || "DISPUTED".equals(normalizedStatus)) {
            return PaymentStatus.REJECTED;
        }

        return switch (normalizedStatus) {
            case "APPROVED" -> PaymentStatus.APPROVED;
            case "REJECTED" -> PaymentStatus.REJECTED;
            case "EXPIRED", "CANCELLED", "CANCELED" -> PaymentStatus.CANCELED;
            default -> PaymentStatus.PENDING;
        };
    }

    private void settleApprovedPayment(Payment payment, Order order, String auditDescription) {
        if (order.getStatus() == OrderStatus.PAID) return;

        settleAccountBalances(payment, order);

        for (OrderItem item : order.getItems()) {
            inventoryService.confirmReserved(item.getProduct().getId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        payment.setConfirmedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, "payment.approved", "orderId=" + order.getId());

        Long userId = order.getCustomer().getUser() == null ? null : order.getCustomer().getUser().getId();
        auditLogService.record("Payment", saved.getId(), "APPROVED", null,
                saved.getStatus().name(), userId, auditDescription);
    }

    private BigDecimal calculateMarketplaceFee(Order order) {
        BigDecimal total = order.getTotalAmount();
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal rate = marketplaceFeeRate == null ? BigDecimal.ZERO : marketplaceFeeRate;
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal fee = total.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        return fee.compareTo(total) > 0 ? total : fee;
    }

    private void settleAccountBalances(Payment payment, Order order) {
        checkingAccountService.debitCustomer(order.getCustomer().getId(), order.getTotalAmount(), order, payment,
                "Payment debit for order");

        Map<Long, BigDecimal> subtotalByStore = order.getItems()
                .stream()
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getStoreId(),
                        Collectors.reducing(BigDecimal.ZERO, OrderItem::getSubtotal, BigDecimal::add)
                ));

        BigDecimal marketplaceFee = calculateMarketplaceFee(order);
        BigDecimal subtotalTotal = subtotalByStore.values()
                .stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (marketplaceFee.compareTo(BigDecimal.ZERO) > 0) {
            checkingAccountService.creditMarketplace(marketplaceFee, order, payment,
                    "Marketplace fee for order");
        }

        var storeEntries = subtotalByStore.entrySet().stream().toList();
        BigDecimal remainingFee = marketplaceFee;
        for (int i = 0; i < storeEntries.size(); i++) {
            Map.Entry<Long, BigDecimal> entry = storeEntries.get(i);
            BigDecimal storeFee = BigDecimal.ZERO;
            if (marketplaceFee.compareTo(BigDecimal.ZERO) > 0 && subtotalTotal.compareTo(BigDecimal.ZERO) > 0) {
                storeFee = i == storeEntries.size() - 1
                        ? remainingFee
                        : entry.getValue().multiply(marketplaceFee).divide(subtotalTotal, 2, RoundingMode.HALF_UP);
                remainingFee = remainingFee.subtract(storeFee);
            }

            BigDecimal netAmount = entry.getValue().subtract(storeFee);
            if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
                checkingAccountService.creditStore(entry.getKey(), netAmount, order, payment,
                        "Payment credit for order");
            }
        }
    }

    private TransparentPaymentResponse toTransparentResponse(Payment payment) {
        return new TransparentPaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getStatusDetail(),
                payment.getAmount(),
                payment.getGatewayPaymentId(),
                payment.getQrCode(),
                payment.getQrCodeBase64(),
                payment.getBoletoUrl(),
                payment.getCheckoutUrl(),
                payment.getCreatedAt(),
                payment.getConfirmedAt()
        );
    }

    @Transactional(readOnly = true)
    public TransparentPaymentResponse findTransparentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return toTransparentResponse(payment);
    }

    public TransparentPaymentResponse refreshFromAbacatePay(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (payment.getGatewayPaymentId() == null) {
            return toTransparentResponse(payment);
        }

        if (payment.getStatus() == PaymentStatus.APPROVED
                || payment.getStatus() == PaymentStatus.REFUNDED) {
            return toTransparentResponse(payment);
        }

        AbacatePayPaymentResult result;
        try {
            result = paymentsGateway.getPayment(payment.getGatewayPaymentId(), payment.getMethod());
        } catch (BusinessException ex) {
            log.warn("Failed to refresh payment {} from AbacatePay: {}",
                    payment.getGatewayPaymentId(), ex.getMessage());
            return toTransparentResponse(payment);
        }

        PaymentStatus mappedStatus = mapAbacatePayStatus(result.status(), result.statusDetail());
        payment.setStatusDetail(result.statusDetail());

        if (mappedStatus == PaymentStatus.APPROVED
                && isHostedCheckoutPayment(payment)
                && payment.getStatus() != PaymentStatus.APPROVED) {
            log.warn("Ignoring hosted checkout approval from refresh for payment {}. Waiting for checkout webhook.",
                    payment.getGatewayPaymentId());
            paymentRepository.save(payment);
            return toTransparentResponse(payment);
        }

        if (mappedStatus == PaymentStatus.APPROVED
                && payment.getStatus() != PaymentStatus.APPROVED) {
            payment.setStatus(PaymentStatus.APPROVED);
            paymentRepository.save(payment);
            settleApprovedPayment(payment, payment.getOrder(), "AbacatePay refresh approved");
        } else if (mappedStatus != payment.getStatus()) {
            payment.setStatus(mappedStatus);
            paymentRepository.save(payment);
        }

        return toTransparentResponse(payment);
    }

    public TransparentPaymentResponse simulateAbacatePayPayment(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (payment.getMethod() != PaymentMethod.PIX && payment.getMethod() != PaymentMethod.BOLETO) {
            throw new BusinessException("AbacatePay dev simulation is only available for transparent PIX or Boleto payments");
        }

        if (!StringUtils.hasText(payment.getGatewayPaymentId())) {
            throw new BusinessException("Payment does not have an AbacatePay payment id");
        }

        if (payment.getMethod() == PaymentMethod.BOLETO) {
            return simulateBoletoPaymentThroughLocalWebhook(payment);
        }

        AbacatePayPaymentResult result = paymentsGateway.simulateTransparentPayment(payment.getGatewayPaymentId());
        updateTransparentPaymentData(payment, result);

        PaymentStatus mappedStatus = mapAbacatePayStatus(result.status(), result.statusDetail());
        payment.setStatus(mappedStatus);

        if (mappedStatus == PaymentStatus.APPROVED) {
            paymentRepository.save(payment);
            settleApprovedPayment(payment, payment.getOrder(), "AbacatePay dev payment simulated");
        } else {
            paymentRepository.save(payment);
        }

        return toTransparentResponse(payment);
    }

    private TransparentPaymentResponse simulateBoletoPaymentThroughLocalWebhook(Payment payment) {
        if (payment.getStatus() != PaymentStatus.APPROVED) {
            String rawPayload = toJson(simulatedTransparentCompletedPayload(payment, "BOLETO"));
            registerAbacatePayWebhook(rawPayload);
            processAsynchronousWebhook(rawPayload);
        }

        return toTransparentResponse(payment);
    }

    private Map<String, Object> simulatedTransparentCompletedPayload(Payment payment, String method) {
        Map<String, Object> transparent = new LinkedHashMap<>();
        transparent.put("id", payment.getGatewayPaymentId());
        transparent.put("externalId", payment.getOrder().getId().toString());
        transparent.put("amount", payment.getAmount() == null ? null : payment.getAmount().movePointRight(2).longValue());
        transparent.put("paidAmount", payment.getAmount() == null ? null : payment.getAmount().movePointRight(2).longValue());
        transparent.put("status", "PAID");
        transparent.put("methods", List.of(method));
        transparent.put("receiptUrl", StringUtils.hasText(payment.getCheckoutUrl())
                ? payment.getCheckoutUrl()
                : payment.getBoletoUrl());
        transparent.put("updatedAt", LocalDateTime.now().toString());
        transparent.put("metadata", Map.of("orderId", payment.getOrder().getId()));

        return Map.of(
                "event", "transparent.completed",
                "apiVersion", 2,
                "devMode", true,
                "data", Map.of("transparent", transparent)
        );
    }

    private void updateTransparentPaymentData(Payment payment, AbacatePayPaymentResult result) {
        if (StringUtils.hasText(result.id())) {
            payment.setGatewayPaymentId(result.id());
        }
        payment.setStatusDetail(result.statusDetail());

        if (StringUtils.hasText(result.qrCode())) {
            payment.setQrCode(result.qrCode());
        }
        if (StringUtils.hasText(result.qrCodeBase64())) {
            payment.setQrCodeBase64(result.qrCodeBase64());
        }
        if (StringUtils.hasText(result.boletoUrl())) {
            payment.setBoletoUrl(result.boletoUrl());
        }
        if (StringUtils.hasText(result.checkoutUrl())) {
            payment.setCheckoutUrl(result.checkoutUrl());
        }
    }

    public PaymentResponse createAbacatePayCheckout(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.RESERVED && order.getStatus() != OrderStatus.WAITING_PAYMENT) {
            throw new BusinessException("Order must be reserved to create payment");
        }

        Optional<Payment> existingPayment = paymentRepository.findByOrderId(orderId);
        if (existingPayment.isPresent()
                && existingPayment.get().getMethod() == PaymentMethod.ABACATEPAY
                && existingPayment.get().getStatus() == PaymentStatus.PENDING
                && StringUtils.hasText(existingPayment.get().getGatewayPaymentId())
                && StringUtils.hasText(existingPayment.get().getCheckoutUrl())) {
            return toResponse(existingPayment.get());
        }

        Payment payment = existingPayment
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .build());

        payment.setMethod(PaymentMethod.ABACATEPAY);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(order.getTotalAmount());

        PaymentGatewayPreference preference = paymentGateway.createPreference(order);
        payment.setGatewayPreferenceId(preference.preferenceId());
        payment.setGatewayPaymentId(preference.preferenceId());
        payment.setCheckoutUrl(preference.checkoutUrl());

        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, "payment.created", "orderId=" + order.getId());
        auditLogService.record("Payment", saved.getId(), "CREATED", null,
                saved.getStatus().name(), null, "AbacatePay checkout created");

        return toResponse(saved);
    }

    public PaymentResponse simulateApproval(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        return approvePayment(payment, "Simulated payment approved");
    }

    @Transactional(readOnly = true)
    public PaymentResponse findById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse findByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return toResponse(payment);
    }

    private PaymentResponse approvePayment(Payment payment, String auditDescription) {
        if (payment.getStatus() == PaymentStatus.APPROVED) {
            return toResponse(payment);
        }

        if (payment.getStatus() == PaymentStatus.CANCELED || payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new BusinessException("Payment cannot be approved");
        }

        Order order = payment.getOrder();

        if (order.getStatus() != OrderStatus.RESERVED && order.getStatus() != OrderStatus.WAITING_PAYMENT) {
            throw new BusinessException("Order must be reserved to approve payment");
        }

        settleAccountBalances(payment, order);

        for (OrderItem item : order.getItems()) {
            inventoryService.confirmReserved(item.getProduct().getId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        payment.setStatus(PaymentStatus.APPROVED);
        payment.setConfirmedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, "payment.approved", "orderId=" + order.getId());

        Long userId = order.getCustomer().getUser() == null ? null : order.getCustomer().getUser().getId();
        auditLogService.record("Payment", saved.getId(), "APPROVED", null,
                saved.getStatus().name(), userId, auditDescription);

        return toResponse(saved);
    }

    public WebhookLogResponse registerWebhook(WebhookRequest request) {
        WebhookLog webhookLog = webhookLogRepository.findByProviderAndEventId(request.provider(), request.eventId())
                .orElseGet(() -> WebhookLog.builder()
                        .provider(request.provider())
                        .eventId(request.eventId())
                        .eventType(request.eventType())
                        .payload(request.payload())
                        .processed(true)
                        .processedAt(LocalDateTime.now())
                        .build());

        if (webhookLog.getId() == null) {
            webhookLog = webhookLogRepository.save(webhookLog);
            auditLogService.record("WebhookLog", webhookLog.getId(), "RECEIVED", null,
                    webhookLog.getEventType(), null, "Webhook received");
        }

        return toWebhookResponse(webhookLog);
    }

    public WebhookLogResponse logRawWebhook(Map<String, Object> payload, String reason) {
        String rawPayload = toJson(payload);
        WebhookLog webhookLog = WebhookLog.builder()
                .provider("abacatepay")
                .eventId("raw-" + System.currentTimeMillis())
                .eventType(reason)
                .payload(rawPayload)
                .processed(false)
                .build();
        webhookLog = webhookLogRepository.save(webhookLog);
        return toWebhookResponse(webhookLog);
    }

    public WebhookLogResponse logRawWebhook(String rawPayload, String reason) {
        WebhookLog webhookLog = WebhookLog.builder()
                .provider("abacatepay")
                .eventId("raw-" + System.currentTimeMillis())
                .eventType(reason)
                .payload(StringUtils.hasText(rawPayload) ? rawPayload : "{}")
                .processed(false)
                .build();
        webhookLog = webhookLogRepository.save(webhookLog);
        return toWebhookResponse(webhookLog);
    }

    public WebhookLogResponse registerAbacatePayWebhook(String rawPayload) {
        String safePayload = StringUtils.hasText(rawPayload) ? rawPayload : "{}";
        Map<String, Object> payload = parseJsonObject(safePayload);
        AbacatePayWebhook webhook = AbacatePayWebhook.from(payload, safePayload);

        Optional<WebhookLog> existingWebhookLog = webhookLogRepository.findByProviderAndEventId(
                webhook.provider(),
                webhook.eventId()
        );
        if (existingWebhookLog.isPresent()) {
            WebhookLog webhookLog = existingWebhookLog.get();
            if (!Boolean.TRUE.equals(webhookLog.getProcessed())) {
                publishWebhookAfterCommit(safePayload);
            }
            return toWebhookResponse(webhookLog);
        }

        WebhookLog webhookLog = WebhookLog.builder()
                .provider(webhook.provider())
                .eventId(webhook.eventId())
                .eventType(webhook.eventType())
                .payload(webhook.rawPayload())
                .processed(false)
                .build();

        webhookLog = webhookLogRepository.save(webhookLog);

        auditLogService.record("WebhookLog", webhookLog.getId(), "RECEIVED", null,
                webhookLog.getEventType(), null, "AbacatePay webhook queued");

        publishWebhookAfterCommit(safePayload);

        return toWebhookResponse(webhookLog);
    }

    public WebhookLogResponse registerAbacatePayWebhook(Map<String, Object> payload) {
        return registerAbacatePayWebhook(toJson(payload));
    }

    private void processAbacatePayWebhook(AbacatePayWebhook webhook) {
        if (!webhook.hasPaymentData()) {
            return;
        }

        Payment payment = findPaymentForAbacatePayWebhook(webhook);
        if (!webhook.matchesPaymentMethod(payment.getMethod())) {
            log.warn("Ignoring AbacatePay webhook {} for incompatible payment method {}",
                    webhook.eventType(), payment.getMethod());
            return;
        }
        if (StringUtils.hasText(webhook.gatewayPaymentId())
                && StringUtils.hasText(payment.getGatewayPaymentId())
                && !webhook.gatewayPaymentId().equals(payment.getGatewayPaymentId())) {
            log.warn("Ignoring stale AbacatePay webhook {} for gateway id {}. Current payment {} has gateway id {}",
                    webhook.eventType(), webhook.gatewayPaymentId(), payment.getId(), payment.getGatewayPaymentId());
            return;
        }

        if (StringUtils.hasText(webhook.gatewayPaymentId())) {
            payment.setGatewayPaymentId(webhook.gatewayPaymentId());
        }
        payment.setStatusDetail(webhook.eventType());
        if (StringUtils.hasText(webhook.receiptUrl())) {
            payment.setCheckoutUrl(webhook.receiptUrl());
        }

        PaymentStatus mappedStatus = mapAbacatePayStatus(webhook.status(), webhook.eventType());

        if (mappedStatus == PaymentStatus.APPROVED) {
            payment.setStatus(PaymentStatus.APPROVED);
            paymentRepository.save(payment);
            settleApprovedPayment(payment, payment.getOrder(), "AbacatePay webhook approved");
            return;
        }

        if (mappedStatus == PaymentStatus.REJECTED) {
            updatePaymentStatus(payment, PaymentStatus.REJECTED, "payment.rejected");
            return;
        }

        if (mappedStatus == PaymentStatus.CANCELED) {
            updatePaymentStatus(payment, PaymentStatus.CANCELED, "payment.canceled");
            return;
        }

        if (mappedStatus == PaymentStatus.REFUNDED) {
            updatePaymentStatus(payment, PaymentStatus.REFUNDED, "payment.refunded");
        }
    }

    public void processAsynchronousWebhook(String rawPayload) {
        log.info("Processando webhook da fila de forma assíncrona");

        String safePayload = StringUtils.hasText(rawPayload) ? rawPayload : "{}";
        Map<String, Object> payload = parseJsonObject(safePayload);

        AbacatePayWebhook webhook = AbacatePayWebhook.from(payload, safePayload);

        WebhookLog webhookLog = webhookLogRepository.findByProviderAndEventId(webhook.provider(), webhook.eventId())
                .orElseGet(() -> webhookLogRepository.save(WebhookLog.builder()
                        .provider(webhook.provider())
                        .eventId(webhook.eventId())
                        .eventType(webhook.eventType())
                        .payload(webhook.rawPayload())
                        .processed(false)
                        .build()));

        if (Boolean.TRUE.equals(webhookLog.getProcessed())) {
            log.info("Webhook {} já processado. Ignorando mensagem duplicada.", webhook.eventId());
            return;
        }

        this.processAbacatePayWebhook(webhook);

        webhookLog.setProcessed(true);
        webhookLog.setProcessedAt(LocalDateTime.now());
        webhookLogRepository.save(webhookLog);
    }

    private void publishWebhookAfterCommit(String rawPayload) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publishWebhook(rawPayload);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publishWebhook(rawPayload);
            }
        });
    }

    private void publishWebhook(String rawPayload) {
        jmsTemplate.convertAndSend("pagamentos.queue", rawPayload);
    }

    private Payment findPaymentForAbacatePayWebhook(AbacatePayWebhook webhook) {
        if (StringUtils.hasText(webhook.gatewayPaymentId())) {
            Optional<Payment> byGatewayId = paymentRepository.findByGatewayPaymentId(webhook.gatewayPaymentId());
            if (byGatewayId.isPresent()) {
                return byGatewayId.get();
            }
        }

        Long orderId = parseLong(webhook.externalReference());
        if (orderId == null) {
            throw new ResourceNotFoundException("Payment not found for AbacatePay event");
        }
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    private boolean isHostedCheckoutPayment(Payment payment) {
        return payment.getMethod() == PaymentMethod.CREDIT_CARD
                || payment.getMethod() == PaymentMethod.ABACATEPAY;
    }

    private void updatePaymentStatus(Payment payment, PaymentStatus status, String eventType) {
        payment.setStatus(status);
        Payment saved = paymentRepository.save(payment);
        savePaymentEvent(saved, eventType, "paymentId=" + saved.getId());
    }

    private void savePaymentEvent(Payment payment, String eventType, String payload) {
        PaymentEvent event = PaymentEvent.builder()
                .payment(payment)
                .eventType(eventType)
                .payload(payload)
                .build();

        paymentEventRepository.save(event);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCheckoutUrl(),
                payment.getCreatedAt(),
                payment.getConfirmedAt()
        );
    }

    private WebhookLogResponse toWebhookResponse(WebhookLog log) {
        return new WebhookLogResponse(
                log.getId(),
                log.getProvider(),
                log.getEventId(),
                log.getEventType(),
                log.getProcessed(),
                log.getReceivedAt(),
                log.getProcessedAt()
        );
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            return payload.toString();
        }
    }

    private Map<String, Object> parseJsonObject(String rawPayload) {
        if (!StringUtils.hasText(rawPayload)) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(rawPayload, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            log.warn("Failed to parse AbacatePay webhook payload: {}", exception.getMessage());
            return Map.of();
        }
    }

    private Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        try {
            return Long.valueOf(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private record AbacatePayWebhook(
            String provider,
            String eventId,
            String eventType,
            String gatewayPaymentId,
            String externalReference,
            String status,
            String receiptUrl,
            String rawPayload
    ) {

        static AbacatePayWebhook from(Map<String, Object> payload, String rawPayload) {
            String eventType = firstText(payload.get("event"), payload.get("type"), payload.get("eventType"));
            Map<String, Object> charge = chargePayload(payload);
            String gatewayPaymentId = firstText(charge.get("id"), payload.get("data_id"), payload.get("resource"));
            Map<String, Object> metadata = objectMap(charge.get("metadata"));
            String externalReference = firstText(
                    charge.get("externalId"),
                    metadata.get("orderId"),
                    payload.get("externalId")
            );
            String status = firstText(charge.get("status"), payload.get("status"));
            String receiptUrl = firstText(charge.get("receiptUrl"), charge.get("url"));
            String eventId = firstText(payload.get("id"), payload.get("event_id"), payload.get("eventId"));

            if (!StringUtils.hasText(eventId)) {
                eventId = (StringUtils.hasText(eventType) ? eventType : "abacatepay.event")
                        + "-"
                        + (StringUtils.hasText(gatewayPaymentId) ? gatewayPaymentId : "unknown");
            }

            return new AbacatePayWebhook(
                    "abacatepay",
                    eventId,
                    StringUtils.hasText(eventType) ? eventType : "abacatepay.event",
                    gatewayPaymentId,
                    externalReference,
                    status,
                    receiptUrl,
                    rawPayload
            );
        }

        boolean hasPaymentData() {
            return StringUtils.hasText(gatewayPaymentId) || StringUtils.hasText(externalReference);
        }

        boolean matchesPaymentMethod(PaymentMethod method) {
            if (eventType.startsWith("transparent.")) {
                return method == PaymentMethod.PIX || method == PaymentMethod.BOLETO;
            }
            if (eventType.startsWith("checkout.")) {
                return method == PaymentMethod.CREDIT_CARD || method == PaymentMethod.ABACATEPAY;
            }
            return true;
        }

        @SuppressWarnings("unchecked")
        private static Map<String, Object> chargePayload(Map<String, Object> payload) {
            Object data = payload.get("data");

            if (!(data instanceof Map<?, ?> dataMap)) {
                return Map.of();
            }

            Map<String, Object> typedData = (Map<String, Object>) dataMap;
            Object checkout = typedData.get("checkout");
            if (checkout instanceof Map<?, ?> checkoutMap) {
                return (Map<String, Object>) checkoutMap;
            }

            Object transparent = typedData.get("transparent");
            if (transparent instanceof Map<?, ?> transparentMap) {
                return (Map<String, Object>) transparentMap;
            }

            Object billing = typedData.get("billing");
            if (billing instanceof Map<?, ?> billingMap) {
                return (Map<String, Object>) billingMap;
            }

            if (typedData.containsKey("id")) {
                return typedData;
            }

            return Map.of();
        }

        @SuppressWarnings("unchecked")
        private static Map<String, Object> objectMap(Object value) {
            if (value instanceof Map<?, ?> map) {
                return (Map<String, Object>) map;
            }

            return Map.of();
        }

        private static String firstText(Object... values) {
            for (Object value : values) {
                if (value != null && StringUtils.hasText(value.toString())) {
                    return value.toString();
                }
            }

            return null;
        }
    }
}
