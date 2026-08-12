package acc.br.shopbank.application.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String entityName,
        Long entityId,
        String action,
        String oldValue,
        String newValue,
        Long userId,
        String description,
        LocalDateTime createdAt
) {
}
