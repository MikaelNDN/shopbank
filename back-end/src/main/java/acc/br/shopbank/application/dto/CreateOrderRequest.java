package acc.br.shopbank.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        @NotNull Long customerId,
        @NotNull Long customerAddressId,
        @NotEmpty List<@Valid OrderItemRequest> items
) {
}
