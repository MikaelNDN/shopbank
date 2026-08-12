package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.AdminDashboardResponse;
import acc.br.shopbank.application.dto.AdminDashboardResponse.BestSellingProduct;
import acc.br.shopbank.application.dto.AdminDashboardResponse.CategoryRevenue;
import acc.br.shopbank.application.dto.AdminDashboardResponse.LowStockEntry;
import acc.br.shopbank.application.dto.AdminDashboardResponse.MonthlyRevenue;
import acc.br.shopbank.application.dto.AdminDashboardResponse.TopProduct;
import acc.br.shopbank.application.dto.AdminInventoryResponse;
import acc.br.shopbank.application.dto.AdminReportResponse;
import acc.br.shopbank.domain.model.Inventory;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.OrderItem;
import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int LOW_STOCK_LIMIT = 5;
    private static final int MONTHS_HISTORY = 6;
    private static final int TOP_PRODUCTS_LIMIT = 5;
    private static final int LOW_STOCK_LIST_LIMIT = 10;
    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final List<OrderStatus> REVENUE_STATUSES =
            List.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final PaymentRepository paymentRepository;

    public AdminDashboardResponse dashboard() {
        return dashboard("30d");
    }

    public AdminDashboardResponse dashboard(String period) {
        List<Order> orders = orderRepository.findAll();
        List<Product> products = productRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        LocalDateTime periodStart = resolvePeriodStart(period);
        List<Order> filteredOrders = orders.stream()
                .filter(o -> isWithinPeriod(o.getCreatedAt(), periodStart))
                .toList();
        List<Payment> filteredPayments = payments.stream()
                .filter(p -> isWithinPeriod(p.getCreatedAt(), periodStart))
                .toList();

        List<Order> revenueOrders = filteredOrders.stream()
                .filter(o -> REVENUE_STATUSES.contains(o.getStatus()))
                .toList();
        List<Order> allRevenueOrders = orders.stream()
                .filter(o -> REVENUE_STATUSES.contains(o.getStatus()))
                .toList();

        BigDecimal totalRevenue = revenueOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthRevenue = allRevenueOrders.stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(monthStart))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long approvedPayments = filteredPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.APPROVED)
                .count();

        long pendingPayments = filteredPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count();

        long canceledOrders = filteredOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELED)
                .count();

        BigDecimal averageTicket = revenueOrders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(revenueOrders.size()), 2, java.math.RoundingMode.HALF_UP);

        Map<Long, Long> unitsByProduct = new HashMap<>();
        Map<Long, BigDecimal> revenueByProduct = new HashMap<>();
        for (Order order : revenueOrders) {
            for (OrderItem item : order.getItems()) {
                Long productId = item.getProduct().getId();
                unitsByProduct.merge(productId, (long) item.getQuantity(), Long::sum);
                revenueByProduct.merge(productId,
                        item.getSubtotal() == null ? BigDecimal.ZERO : item.getSubtotal(),
                        BigDecimal::add);
            }
        }

        long totalUnitsSold = unitsByProduct.values().stream().mapToLong(Long::longValue).sum();

        BestSellingProduct bestSelling = unitsByProduct.entrySet().stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(entry -> {
                    Product product = products.stream()
                            .filter(p -> p.getId().equals(entry.getKey()))
                            .findFirst()
                            .orElse(null);
                    return new BestSellingProduct(
                            entry.getKey(),
                            product != null ? product.getName() : "Produto " + entry.getKey(),
                            entry.getValue()
                    );
                })
                .orElse(null);

        List<TopProduct> topProducts = unitsByProduct.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(TOP_PRODUCTS_LIMIT)
                .map(entry -> {
                    Product product = products.stream()
                            .filter(p -> p.getId().equals(entry.getKey()))
                            .findFirst()
                            .orElse(null);
                    return new TopProduct(
                            entry.getKey(),
                            product != null ? product.getName() : "Produto " + entry.getKey(),
                            entry.getValue()
                    );
                })
                .toList();

        Map<Long, BigDecimal> revenueByCatId = new LinkedHashMap<>();
        Map<Long, String> catNames = new HashMap<>();
        for (Map.Entry<Long, BigDecimal> entry : revenueByProduct.entrySet()) {
            Product product = products.stream()
                    .filter(p -> p.getId().equals(entry.getKey()))
                    .findFirst()
                    .orElse(null);
            if (product == null || product.getCategory() == null) continue;
            Long catId = product.getCategory().getId();
            catNames.putIfAbsent(catId, product.getCategory().getName());
            revenueByCatId.merge(catId, entry.getValue(), BigDecimal::add);
        }
        List<CategoryRevenue> revenueByCategory = revenueByCatId.entrySet().stream()
                .map(e -> new CategoryRevenue(e.getKey(), catNames.getOrDefault(e.getKey(), "—"), e.getValue()))
                .sorted(Comparator.comparing(CategoryRevenue::value).reversed())
                .toList();

        List<MonthlyRevenue> revenueByMonth = buildMonthlyRevenue(allRevenueOrders);

        Map<String, Long> ordersByStatus = filteredOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

        List<LowStockEntry> lowStockList = inventories.stream()
                .filter(inv -> inv.getAvailableQuantity() != null
                        && inv.getAvailableQuantity() <= LOW_STOCK_LIMIT
                        && inv.getProduct() != null
                        && Boolean.TRUE.equals(inv.getProduct().getActive()))
                .sorted(Comparator.comparingInt(Inventory::getAvailableQuantity))
                .limit(LOW_STOCK_LIST_LIMIT)
                .map(inv -> new LowStockEntry(
                        inv.getProduct().getId(),
                        inv.getProduct().getName(),
                        inv.getAvailableQuantity()
                ))
                .toList();

        long lowStockItems = inventories.stream()
                .filter(inv -> inv.getAvailableQuantity() != null
                        && inv.getAvailableQuantity() <= LOW_STOCK_LIMIT
                        && inv.getProduct() != null
                        && Boolean.TRUE.equals(inv.getProduct().getActive()))
                .count();

        long activeProducts = products.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .count();

        return new AdminDashboardResponse(
                customerRepository.count(),
                filteredOrders.size(),
                activeProducts,
                lowStockItems,
                approvedPayments,
                pendingPayments,
                canceledOrders,
                totalUnitsSold,
                totalRevenue,
                monthRevenue,
                averageTicket,
                bestSelling,
                revenueByMonth,
                topProducts,
                ordersByStatus,
                revenueByCategory,
                lowStockList
        );
    }

    private LocalDateTime resolvePeriodStart(String period) {
        String normalized = period == null ? "30d" : period.toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now();

        return switch (normalized) {
            case "7d" -> today.minusDays(7).atStartOfDay();
            case "month" -> today.withDayOfMonth(1).atStartOfDay();
            case "all" -> null;
            case "30d" -> today.minusDays(30).atStartOfDay();
            default -> today.minusDays(30).atStartOfDay();
        };
    }

    private boolean isWithinPeriod(LocalDateTime date, LocalDateTime periodStart) {
        return periodStart == null || (date != null && !date.isBefore(periodStart));
    }

    private List<MonthlyRevenue> buildMonthlyRevenue(List<Order> revenueOrders) {
        List<MonthlyRevenue> series = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = MONTHS_HISTORY - 1; i >= 0; i--) {
            LocalDate cursor = now.minusMonths(i);
            LocalDateTime start = cursor.withDayOfMonth(1).atStartOfDay();
            LocalDateTime end = cursor.plusMonths(1).withDayOfMonth(1).atStartOfDay();
            BigDecimal value = revenueOrders.stream()
                    .filter(o -> o.getCreatedAt() != null
                            && !o.getCreatedAt().isBefore(start)
                            && o.getCreatedAt().isBefore(end))
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            String label = cursor.getMonth().getDisplayName(TextStyle.SHORT, PT_BR);
            series.add(new MonthlyRevenue(capitalize(label), value));
        }
        return series;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        String trimmed = s.replace(".", "");
        return Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1).toLowerCase();
    }

    public AdminReportResponse reports() {
        List<Order> orders = orderRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(order -> order.getStatus().name(), Collectors.counting()));

        Map<String, Long> paymentsByStatus = payments.stream()
                .collect(Collectors.groupingBy(payment -> payment.getStatus().name(), Collectors.counting()));

        return new AdminReportResponse(
                ordersByStatus,
                paymentsByStatus,
                totalRevenue(payments.stream()
                        .filter(payment -> payment.getStatus() == PaymentStatus.APPROVED)
                        .toList())
        );
    }

    public List<AdminInventoryResponse> inventory() {
        return inventoryRepository.findAll()
                .stream()
                .map(this::toInventoryResponse)
                .toList();
    }

    private BigDecimal totalRevenue(List<Payment> payments) {
        return payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private AdminInventoryResponse toInventoryResponse(Inventory inventory) {
        return new AdminInventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getProduct().getName(),
                inventory.getAvailableQuantity(),
                inventory.getReservedQuantity(),
                inventory.getProduct().getActive()
        );
    }
}
