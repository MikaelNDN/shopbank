package acc.br.shopbank.application.dto;

import acc.br.shopbank.domain.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(
        @NotNull OrderStatus status
) {
}
