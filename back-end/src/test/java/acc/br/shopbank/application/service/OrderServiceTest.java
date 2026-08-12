package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CreateOrderRequest;
import acc.br.shopbank.application.dto.OrderItemRequest;
import acc.br.shopbank.application.dto.OrderResponse;
import acc.br.shopbank.application.dto.OrderStatusRequest;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerAddressRepository addressRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private CheckingAccountService checkingAccountService;

    @Mock
    private AuditLogService auditLogService;

    private OrderService orderService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        orderService = new OrderService(
                orderRepository,
                paymentRepository,
                customerRepository,
                addressRepository,
                productRepository,
                inventoryService,
                checkingAccountService,
                auditLogService
        );
    }

    @Test
    void shouldCreateOrderAndReserveInventory() {
        Customer customer = activeCustomer();
        CustomerAddress address = address(customer);
        Product product = product(true);
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of(new OrderItemRequest(100L, 2)));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(checkingAccountService.hasSufficientBalance(eq(1L), any(BigDecimal.class))).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(5L);
            return payment;
        });

        OrderResponse response = orderService.create(request);

        assertEquals(1L, response.id());
        assertEquals(OrderStatus.RESERVED, response.status());
        assertEquals(new BigDecimal("20.00"), response.totalAmount());
        assertEquals(1, response.items().size());
        assertEquals(10L, response.shippingAddress().customerAddressIdOrigin());

        verify(inventoryService).reserve(100L, 2);
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void shouldRejectOrderWhenInsufficientBalance() {
        Customer customer = activeCustomer();
        CustomerAddress address = address(customer);
        Product product = product(true);
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of(new OrderItemRequest(100L, 2)));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(checkingAccountService.hasSufficientBalance(eq(1L), any(BigDecimal.class))).thenReturn(false);

        assertThrows(BusinessException.class, () -> orderService.create(request));

        verify(inventoryService, never()).reserve(anyLong(), anyInt());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void shouldThrowWhenOrderHasNoItems() {
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of());

        assertThrows(BusinessException.class, () -> orderService.create(request));

        verifyNoInteractions(customerRepository);
    }

    @Test
    void shouldThrowWhenAddressDoesNotBelongToCustomer() {
        Customer customer = activeCustomer();
        Customer other = Customer.builder().id(2L).active(true).build();
        CustomerAddress address = address(other);
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of(new OrderItemRequest(100L, 1)));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));

        assertThrows(BusinessException.class, () -> orderService.create(request));

        verifyNoInteractions(productRepository);
    }

    @Test
    void shouldThrowWhenProductIsInactive() {
        Customer customer = activeCustomer();
        CustomerAddress address = address(customer);
        Product product = product(false);
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of(new OrderItemRequest(100L, 1)));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        assertThrows(BusinessException.class, () -> orderService.create(request));

        verify(inventoryService, never()).reserve(anyLong(), anyInt());
    }

    @Test
    void shouldThrowWhenCustomerNotFound() {
        CreateOrderRequest request = new CreateOrderRequest(1L, 10L, List.of(new OrderItemRequest(100L, 1)));

        when(customerRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.create(request));
    }

    @Test
    void shouldCancelReservedOrderAndReleaseStock() {
        Order order = reservedOrder();
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.cancel(1L);

        assertEquals(OrderStatus.CANCELED, response.status());
        assertEquals(PaymentStatus.CANCELED, payment.getStatus());
        verify(inventoryService).releaseReserved(100L, 2);
    }

    @Test
    void shouldCancelPaidOrderWithRefund() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.PAID);
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.APPROVED)
                .amount(order.getTotalAmount())
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.cancel(1L);

        assertEquals(OrderStatus.CANCELED, response.status());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(checkingAccountService).debitStoreForRefund(2L, new BigDecimal("20.00"), order, payment,
                "Refund debit for canceled order");
        verify(checkingAccountService).refundCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Refund for canceled paid order");
    }

    @Test
    void shouldThrowWhenCancelingShippedOrder() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(BusinessException.class, () -> orderService.cancel(1L));
    }

    @Test
    void shouldDeliverShippedOrder() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.updateStatus(
                1L,
                new OrderStatusRequest(OrderStatus.DELIVERED)
        );

        assertEquals(OrderStatus.DELIVERED, response.status());
    }

    @Test
    void shouldRejectFulfillmentBeforePayment() {
        Order order = reservedOrder();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orderService.updateStatus(1L, new OrderStatusRequest(OrderStatus.DELIVERED))
        );

        assertEquals("Order must be paid before fulfillment", exception.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void shouldRejectBackwardStatusTransition() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orderService.updateStatus(1L, new OrderStatusRequest(OrderStatus.PAID))
        );

        assertEquals("Invalid order status transition", exception.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void shouldCancelPaidOrderThroughStatusEndpointWithRefund() {
        Order order = reservedOrder();
        order.setStatus(OrderStatus.PAID);
        Payment payment = Payment.builder()
                .id(5L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.APPROVED)
                .amount(order.getTotalAmount())
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.updateStatus(
                1L,
                new OrderStatusRequest(OrderStatus.CANCELED)
        );

        assertEquals(OrderStatus.CANCELED, response.status());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(checkingAccountService).refundCustomer(1L, new BigDecimal("20.00"), order, payment,
                "Refund for canceled paid order");
    }

    private Customer activeCustomer() {
        User user = User.builder()
                .id(7L)
                .email("cliente@email.com")
                .role(UserRole.CLIENT)
                .active(true)
                .build();

        return Customer.builder()
                .id(1L)
                .user(user)
                .fullName("Maria")
                .active(true)
                .build();
    }

    private CustomerAddress address(Customer customer) {
        return CustomerAddress.builder()
                .id(10L)
                .customer(customer)
                .recipientName("Maria")
                .postalCode("58000000")
                .street("Rua A")
                .number("10")
                .district("Centro")
                .city("Campina Grande")
                .state("PB")
                .active(true)
                .build();
    }

    private Product product(boolean active) {
        return Product.builder()
                .id(100L)
                .storeId(2L)
                .name("Mouse")
                .price(new BigDecimal("10.00"))
                .active(active)
                .build();
    }

    private Order reservedOrder() {
        Customer customer = activeCustomer();
        Product product = product(true);
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.RESERVED)
                .totalAmount(new BigDecimal("20.00"))
                .items(new ArrayList<>())
                .build();
        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .product(product)
                .quantity(2)
                .unitPrice(new BigDecimal("10.00"))
                .subtotal(new BigDecimal("20.00"))
                .build();
        order.getItems().add(item);
        order.setShippingAddress(OrderShippingAddress.builder()
                .order(order)
                .customerAddressIdOrigin(10L)
                .recipientName("Maria")
                .build());
        return order;
    }
}
