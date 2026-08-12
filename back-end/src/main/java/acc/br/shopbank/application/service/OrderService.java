package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.*;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final CheckingAccountService checkingAccountService;
    private final AuditLogService auditLogService;

    private static final EnumSet<OrderStatus> FULFILLMENT_STATUSES = EnumSet.of(
            OrderStatus.PREPARING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
    );

    public OrderResponse create(CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessException("Order must have at least one item");
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BusinessException("Inactive customer cannot create order");
        }

        CustomerAddress address = addressRepository.findById(request.customerAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        validateAddress(customer, address);

        Map<Long, Product> productsById = new java.util.LinkedHashMap<>();
        BigDecimal estimatedTotal = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            validateItemQuantity(itemRequest.quantity());

            Product product = productsById.computeIfAbsent(itemRequest.productId(), pid ->
                    productRepository.findById(pid)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found")));

            validateProduct(product);

            estimatedTotal = estimatedTotal.add(
                    product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()))
            );
        }

        if (!checkingAccountService.hasSufficientBalance(customer.getId(), estimatedTotal)) {
            throw new BusinessException("Insufficient account balance to place this order");
        }

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.RESERVED)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.items()) {
            Product product = productsById.get(itemRequest.productId());

            inventoryService.reserve(product.getId(), itemRequest.quantity());

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.quantity())
                    .unitPrice(product.getPrice())
                    .subtotal(subtotal)
                    .build();

            order.getItems().add(item);
            total = total.add(subtotal);
        }

        order.setTotalAmount(total);

        OrderShippingAddress shippingAddress = snapshotAddress(order, address);
        order.setShippingAddress(shippingAddress);

        Order savedOrder = orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(savedOrder)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.PENDING)
                .amount(savedOrder.getTotalAmount())
                .build();

        paymentRepository.save(payment);

        Long userId = customer.getUser() == null ? null : customer.getUser().getId();
        auditLogService.record("Order", savedOrder.getId(), "CREATED", null,
                savedOrder.getStatus().name(), userId, "Order created and inventory reserved");

        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findMyOrders(String email) {
        Customer customer = customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        return findByCustomer(customer.getId());
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return toResponse(findOrder(id));
    }

    public OrderResponse cancel(Long orderId) {
        Order order = findOrder(orderId);

        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new BusinessException("Order is already canceled");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BusinessException("Shipped or delivered order cannot be canceled");
        }

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);

        if (order.getStatus() == OrderStatus.PAID) {
            refundPaidOrder(order, payment);
        } else {
            releaseReservedStock(order);
            if (payment != null) {
                payment.setStatus(PaymentStatus.CANCELED);
                paymentRepository.save(payment);
            }
        }

        order.setStatus(OrderStatus.CANCELED);
        Order saved = orderRepository.save(order);

        Long userId = order.getCustomer().getUser() == null ? null : order.getCustomer().getUser().getId();
        auditLogService.record("Order", saved.getId(), "CANCELED", null,
                saved.getStatus().name(), userId, "Order canceled");

        return toResponse(saved);
    }

    public OrderResponse updateStatus(Long orderId, OrderStatusRequest request) {
        Order order = findOrder(orderId);
        OrderStatus target = request.status();

        if (order.getStatus() == target) {
            return toResponse(order);
        }

        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new BusinessException("Canceled order status cannot be changed");
        }

        if (target == OrderStatus.CANCELED) {
            return cancel(orderId);
        }

        if (target == OrderStatus.CREATED || target == OrderStatus.RESERVED) {
            throw new BusinessException("Order status cannot move backwards");
        }

        if (!isValidStatusTransition(order.getStatus(), target)) {
            if (!hasStartedFulfillment(order.getStatus()) && FULFILLMENT_STATUSES.contains(target)) {
                throw new BusinessException("Order must be paid before fulfillment");
            }
            throw new BusinessException("Invalid order status transition");
        }

        if (FULFILLMENT_STATUSES.contains(target) && !hasStartedFulfillment(order.getStatus())) {
            throw new BusinessException("Order must be paid before fulfillment");
        }

        order.setStatus(target);
        Order saved = orderRepository.save(order);

        auditLogService.record("Order", saved.getId(), "STATUS_UPDATED", null,
                saved.getStatus().name(), null, "Order status updated");

        return toResponse(saved);
    }

    private boolean isValidStatusTransition(OrderStatus current, OrderStatus target) {
        return switch (current) {
            case CREATED, RESERVED, WAITING_PAYMENT -> target == OrderStatus.PAID;
            case PAID -> target == OrderStatus.PREPARING
                    || target == OrderStatus.SHIPPED
                    || target == OrderStatus.DELIVERED;
            case PREPARING -> target == OrderStatus.SHIPPED
                    || target == OrderStatus.DELIVERED;
            case SHIPPED -> target == OrderStatus.DELIVERED;
            case DELIVERED, CANCELED -> false;
        };
    }

    private boolean hasStartedFulfillment(OrderStatus status) {
        return status == OrderStatus.PAID || FULFILLMENT_STATUSES.contains(status);
    }

    private void refundPaidOrder(Order order, Payment payment) {
        if (payment == null || payment.getStatus() != PaymentStatus.APPROVED) {
            throw new BusinessException("Paid order must have approved payment to refund");
        }

        Map<Long, BigDecimal> subtotalByStore = order.getItems()
                .stream()
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getStoreId(),
                        Collectors.reducing(BigDecimal.ZERO, OrderItem::getSubtotal, BigDecimal::add)
                ));

        for (Map.Entry<Long, BigDecimal> entry : subtotalByStore.entrySet()) {
            checkingAccountService.debitStoreForRefund(entry.getKey(), entry.getValue(), order, payment,
                    "Refund debit for canceled order");
        }

        checkingAccountService.refundCustomer(order.getCustomer().getId(), order.getTotalAmount(), order, payment,
                "Refund for canceled paid order");

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
    }

    private void releaseReservedStock(Order order) {
        for (OrderItem item : order.getItems()) {
            inventoryService.releaseReserved(item.getProduct().getId(), item.getQuantity());
        }
    }

    private void validateAddress(Customer customer, CustomerAddress address) {
        if (!address.getCustomer().getId().equals(customer.getId())) {
            throw new BusinessException("Address does not belong to customer");
        }

        if (!Boolean.TRUE.equals(address.getActive())) {
            throw new BusinessException("Inactive address cannot be used");
        }
    }

    private void validateProduct(Product product) {
        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new BusinessException("Inactive product cannot be purchased");
        }

        if (product.getStoreId() == null) {
            throw new BusinessException("Product must belong to a store");
        }

        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Product price must be greater than zero");
        }
    }

    private void validateItemQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Order item quantity must be greater than zero");
        }
    }

    private Order findOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    private OrderShippingAddress snapshotAddress(Order order, CustomerAddress address) {
        return OrderShippingAddress.builder()
                .order(order)
                .customerAddressIdOrigin(address.getId())
                .recipientName(address.getRecipientName())
                .postalCode(address.getPostalCode())
                .street(address.getStreet())
                .number(address.getNumber())
                .complement(address.getComplement())
                .district(address.getDistrict())
                .city(address.getCity())
                .state(address.getState())
                .reference(address.getReference())
                .build();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                ))
                .toList();

        OrderShippingAddressResponse shippingAddress = null;

        if (order.getShippingAddress() != null) {
            shippingAddress = new OrderShippingAddressResponse(
                    order.getShippingAddress().getCustomerAddressIdOrigin(),
                    order.getShippingAddress().getRecipientName(),
                    order.getShippingAddress().getPostalCode(),
                    order.getShippingAddress().getStreet(),
                    order.getShippingAddress().getNumber(),
                    order.getShippingAddress().getComplement(),
                    order.getShippingAddress().getDistrict(),
                    order.getShippingAddress().getCity(),
                    order.getShippingAddress().getState(),
                    order.getShippingAddress().getReference()
            );
        }

        return new OrderResponse(
                order.getId(),
                order.getCustomer().getId(),
                order.getStatus(),
                order.getTotalAmount(),
                items,
                shippingAddress,
                order.getCreatedAt()
        );
    }
}
