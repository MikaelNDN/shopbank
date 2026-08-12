package acc.br.shopbank.application.service;

import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.CustomerAddress;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerAddressRepository;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.OrderRepository;
import acc.br.shopbank.domain.repository.PaymentRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerAccessServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerAddressRepository addressRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    private CustomerAccessService accessService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        accessService = new CustomerAccessService(
                customerRepository,
                addressRepository,
                orderRepository,
                paymentRepository,
                userRepository
        );
    }

    @Test
    void shouldAllowAdminWithoutLookup() {
        accessService.assertCustomerAccess(99L, userDetails("admin@email.com", "ROLE_ADMIN"));

        verifyNoInteractions(customerRepository);
    }

    @Test
    void shouldAllowCustomerOwner() {
        Customer customer = Customer.builder().id(1L).build();

        when(customerRepository.findByUserEmail("cliente@email.com")).thenReturn(Optional.of(customer));

        accessService.assertCustomerAccess(1L, userDetails("cliente@email.com", "ROLE_CLIENT"));

        assertEquals(1L, accessService.currentCustomerId(userDetails("cliente@email.com", "ROLE_CLIENT")));
    }

    @Test
    void shouldDenyAnotherCustomerResource() {
        Customer customer = Customer.builder().id(1L).build();

        when(customerRepository.findByUserEmail("cliente@email.com")).thenReturn(Optional.of(customer));

        assertThrows(AccessDeniedException.class,
                () -> accessService.assertCustomerAccess(2L, userDetails("cliente@email.com", "ROLE_CLIENT")));
    }

    @Test
    void shouldAllowUserOwner() {
        User user = User.builder().id(7L).email("cliente@email.com").role(UserRole.CLIENT).active(true).build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        accessService.assertUserAccess(7L, userDetails("cliente@email.com", "ROLE_CLIENT"));
    }

    @Test
    void shouldDenyAnotherUserResource() {
        User user = User.builder().id(7L).email("outro@email.com").role(UserRole.CLIENT).active(true).build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThrows(AccessDeniedException.class,
                () -> accessService.assertUserAccess(7L, userDetails("cliente@email.com", "ROLE_CLIENT")));
    }

    @Test
    void shouldThrowWhenCustomerProfileDoesNotExist() {
        when(customerRepository.findByUserEmail("cliente@email.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> accessService.assertCustomerAccess(1L, userDetails("cliente@email.com", "ROLE_CLIENT")));
    }

    @Test
    void shouldValidateAddressOrderAndPaymentOwnership() {
        Customer customer = Customer.builder().id(1L).build();
        CustomerAddress address = CustomerAddress.builder().id(10L).customer(customer).build();
        Order order = Order.builder()
                .id(20L)
                .customer(customer)
                .status(OrderStatus.RESERVED)
                .totalAmount(BigDecimal.TEN)
                .build();
        Payment payment = Payment.builder()
                .id(30L)
                .order(order)
                .method(PaymentMethod.SIMULATED)
                .status(PaymentStatus.PENDING)
                .amount(BigDecimal.TEN)
                .build();

        when(customerRepository.findByUserEmail("cliente@email.com")).thenReturn(Optional.of(customer));
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(paymentRepository.findById(30L)).thenReturn(Optional.of(payment));

        UserDetails userDetails = userDetails("cliente@email.com", "ROLE_CLIENT");

        assertDoesNotThrow(() -> accessService.assertAddressAccess(10L, userDetails));
        assertDoesNotThrow(() -> accessService.assertOrderAccess(20L, userDetails));
        assertDoesNotThrow(() -> accessService.assertPaymentAccess(30L, userDetails));
    }

    private UserDetails userDetails(String email, String role) {
        return new org.springframework.security.core.userdetails.User(
                email,
                "password",
                List.of(new SimpleGrantedAuthority(role))
        );
    }
}
