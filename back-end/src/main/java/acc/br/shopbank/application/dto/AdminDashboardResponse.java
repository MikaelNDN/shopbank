package acc.br.shopbank.application.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
        long totalCustomers,
        long totalOrders,
        long totalProducts,
        long lowStockItems,
        long approvedPayments,
        long pendingPayments,
        long canceledOrders,
        long totalUnitsSold,
        BigDecimal totalRevenue,
        BigDecimal monthRevenue,
        BigDecimal averageTicket,
        BestSellingProduct bestSellingProduct,
        List<MonthlyRevenue> revenueByMonth,
        List<TopProduct> topProducts,
        Map<String, Long> ordersByStatus,
        List<CategoryRevenue> revenueByCategory,
        List<LowStockEntry> lowStockList
) {

    public record BestSellingProduct(Long id, String name, long sold) {
    }

    public record MonthlyRevenue(String month, BigDecimal value) {
    }

    public record TopProduct(Long productId, String name, long sold) {
    }

    public record CategoryRevenue(Long categoryId, String category, BigDecimal value) {
    }

    public record LowStockEntry(Long productId, String name, Integer quantity) {
    }
}
