package acc.br.shopbank.application.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AdminReportResponse(
        Map<String, Long> ordersByStatus,
        Map<String, Long> paymentsByStatus,
        BigDecimal totalRevenue
) {
}
