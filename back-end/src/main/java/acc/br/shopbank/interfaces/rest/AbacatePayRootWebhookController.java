package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.WebhookLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AbacatePayRootWebhookController {

    private final AbacatePayWebhookHandler webhookHandler;

    @PostMapping({"/", "/webhook", "/webhook/"})
    public ResponseEntity<WebhookLogResponse> webhookFallback(
            @RequestBody(required = false) String rawPayload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestHeader(value = "X-Abacate-Signature", required = false) String abacateSignature,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String webhookSecretHeader,
            @RequestParam(value = "webhookSecret", required = false) String webhookSecret
    ) {
        return webhookHandler.handle(rawPayload, signature, abacateSignature, webhookSecret, webhookSecretHeader);
    }
}
