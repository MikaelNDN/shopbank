package acc.br.shopbank.application.dto;

import java.time.LocalDateTime;

public record WebhookLogResponse(
        Long id,
        String provider,
        String eventId,
        String eventType,
        Boolean processed,
        LocalDateTime receivedAt,
        LocalDateTime processedAt
) {
}
