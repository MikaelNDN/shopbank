package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.application.dto.BoletoPaymentRequest;
import acc.br.shopbank.application.dto.CardPaymentRequest;
import acc.br.shopbank.application.dto.PaymentConfigResponse;
import acc.br.shopbank.application.dto.PaymentResponse;
import acc.br.shopbank.application.dto.PixPaymentRequest;
import acc.br.shopbank.application.dto.TransparentPaymentResponse;
import acc.br.shopbank.application.dto.WebhookLogResponse;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Set;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private static final Set<String> ALLOWED_MOBILE_RETURN_SCHEMES = Set.of("shopbank", "exp", "exps");

    private final PaymentService paymentService;
    private final CustomerAccessService customerAccessService;
    private final AbacatePayWebhookHandler webhookHandler;
    private final AbacatePayProperties abacatePayProperties;

    @GetMapping("/config")
    public ResponseEntity<PaymentConfigResponse> config() {
        return ResponseEntity.ok(new PaymentConfigResponse(
                null,
                abacatePayProperties.isSandbox()
        ));
    }

    @PostMapping("/orders/{orderId}/card")
    public ResponseEntity<TransparentPaymentResponse> payCard(
            @PathVariable Long orderId,
            @RequestBody @Valid CardPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.payWithCard(orderId, request));
    }

    @PostMapping("/orders/{orderId}/pix")
    public ResponseEntity<TransparentPaymentResponse> payPix(
            @PathVariable Long orderId,
            @RequestBody @Valid PixPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.payWithPix(orderId, request));
    }

    @PostMapping("/orders/{orderId}/boleto")
    public ResponseEntity<TransparentPaymentResponse> payBoleto(
            @PathVariable Long orderId,
            @RequestBody @Valid BoletoPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.payWithBoleto(orderId, request));
    }

    @GetMapping("/orders/{orderId}/transparent")
    public ResponseEntity<TransparentPaymentResponse> findTransparentByOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.findTransparentByOrderId(orderId));
    }

    @PostMapping("/orders/{orderId}/refresh")
    public ResponseEntity<TransparentPaymentResponse> refreshFromAbacatePay(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.refreshFromAbacatePay(orderId));
    }

    @PostMapping("/orders/{orderId}/simulate-abacatepay")
    public ResponseEntity<TransparentPaymentResponse> simulateAbacatePayPayment(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.simulateAbacatePayPayment(orderId));
    }

    @PostMapping("/abacatepay/checkout/{orderId}")
    public ResponseEntity<PaymentResponse> createAbacatePayCheckout(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.createAbacatePayCheckout(orderId));
    }

    @GetMapping("/mobile-return")
    public ResponseEntity<Void> mobileReturn(@RequestParam String redirect) {
        URI redirectUri = URI.create(redirect);
        String scheme = redirectUri.getScheme();
        if (scheme == null || !ALLOWED_MOBILE_RETURN_SCHEMES.contains(scheme.toLowerCase())) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }

    @PostMapping("/{paymentId}/simulate-approval")
    public ResponseEntity<PaymentResponse> simulateApproval(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertPaymentAccess(paymentId, userDetails);
        return ResponseEntity.ok(paymentService.simulateApproval(paymentId));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> findById(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertPaymentAccess(paymentId, userDetails);
        return ResponseEntity.ok(paymentService.findById(paymentId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> findByOrderId(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(orderId, userDetails);
        return ResponseEntity.ok(paymentService.findByOrderId(orderId));
    }

    @PostMapping({"/abacatepay/webhook", "/abacatepay/webhook/"})
    public ResponseEntity<WebhookLogResponse> webhook(
            @RequestBody(required = false) String rawPayload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestHeader(value = "X-Abacate-Signature", required = false) String abacateSignature,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String webhookSecretHeader,
            @RequestParam(value = "webhookSecret", required = false) String webhookSecret
    ) {
        return webhookHandler.handle(rawPayload, signature, abacateSignature, webhookSecret, webhookSecretHeader);
    }
}
