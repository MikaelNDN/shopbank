package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.AdminDashboardResponse;
import acc.br.shopbank.application.dto.AdminInventoryResponse;
import acc.br.shopbank.application.dto.AdminReportResponse;
import acc.br.shopbank.domain.model.Inventory;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.InventoryRepository;
import acc.br.shopbank.domain.repository.OrderRepository;
import acc.br.shopbank.domain.repository.PaymentRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private PaymentRepository paymentRepository;

    private AdminService adminService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        adminService = new AdminService(
                customerRepository,
                orderRepository,
                productRepository,
                inventoryRepository,
                paymentRepository
        );
    }

    @Test
    void shouldBuildDashboard() {
        Inventory lowStock = inventory(1L, "Mouse", 3, 1, true);
        Inventory regularStock = inventory(2L, "Teclado", 10, 0, true);
        Payment approved = payment(PaymentStatus.APPROVED, new BigDecimal("50.00"));
        Order paid = Order.builder()
                .id(1L)
                .status(OrderStatus.PAID)
                .totalAmount(new BigDecimal("50.00"))
                .createdAt(LocalDateTime.now())
                .build();

        when(customerRepository.count()).thenReturn(2L);
        when(orderRepository.count()).thenReturn(3L);
        when(orderRepository.findAll()).thenReturn(List.of(paid));
        when(productRepository.count()).thenReturn(4L);
        when(productRepository.findAll()).thenReturn(List.of());
        when(inventoryRepository.findAll()).thenReturn(List.of(lowStock, regularStock));
        when(paymentRepository.findAll()).thenReturn(List.of(approved));

        AdminDashboardResponse response = adminService.dashboard();

        assertEquals(2L, response.totalCustomers());
        assertEquals(1L, response.lowStockItems());
        assertEquals(new BigDecimal("50.00"), response.totalRevenue());
    }

    @Test
    void shouldBuildReports() {
        Order paid = Order.builder().id(1L).status(OrderStatus.PAID).totalAmount(BigDecimal.TEN).build();
        Order canceled = Order.builder().id(2L).status(OrderStatus.CANCELED).totalAmount(BigDecimal.ONE).build();
        Payment approved = payment(PaymentStatus.APPROVED, new BigDecimal("20.00"));
        Payment pending = payment(PaymentStatus.PENDING, BigDecimal.TEN);

        when(orderRepository.findAll()).thenReturn(List.of(paid, canceled));
        when(paymentRepository.findAll()).thenReturn(List.of(approved, pending));

        AdminReportResponse response = adminService.reports();

        assertEquals(1L, response.ordersByStatus().get("PAID"));
        assertEquals(1L, response.paymentsByStatus().get("PENDING"));
        assertEquals(new BigDecimal("20.00"), response.totalRevenue());
    }

    @Test
    void shouldListInventory() {
        Inventory inventory = inventory(1L, "Mouse", 5, 2, true);

        when(inventoryRepository.findAll()).thenReturn(List.of(inventory));

        List<AdminInventoryResponse> response = adminService.inventory();

        assertEquals(1, response.size());
        assertEquals("Mouse", response.get(0).productName());
        assertEquals(5, response.get(0).availableQuantity());
    }

    private Inventory inventory(Long productId, String productName, int available, int reserved, boolean active) {
        Product product = Product.builder()
                .id(productId)
                .name(productName)
                .active(active)
                .build();

        return Inventory.builder()
                .id(productId)
                .product(product)
                .availableQuantity(available)
                .reservedQuantity(reserved)
                .build();
    }

    private Payment payment(PaymentStatus status, BigDecimal amount) {
        return Payment.builder()
                .id(1L)
                .method(PaymentMethod.SIMULATED)
                .status(status)
                .amount(amount)
                .build();
    }
}
