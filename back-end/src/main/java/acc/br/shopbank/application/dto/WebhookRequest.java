package acc.br.shopbank.application.dto;

import jakarta.validation.constraints.NotBlank;

public record WebhookRequest(
        @NotBlank String provider,
        @NotBlank String eventId,
        @NotBlank String eventType,
        String payload
) {
}
