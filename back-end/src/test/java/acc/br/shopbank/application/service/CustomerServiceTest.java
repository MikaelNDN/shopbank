package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CustomerRequest;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    private CustomerService customerService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        customerService = new CustomerService(customerRepository, userRepository);
    }

    @Test
    void shouldCreateCustomer() {
        User user = User.builder().id(1L).email("cliente@email.com").build();

        CustomerRequest request = new CustomerRequest(
                1L,
                "Maria Silva",
                "12345678900",
                "83999999999",
                LocalDate.of(1995, 5, 10),
                true
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            customer.setId(1L);
            return customer;
        });

        CustomerResponse response = customerService.create(request);

        assertNotNull(response);
        assertEquals("Maria Silva", response.fullName());
        assertEquals(1L, response.userId());
        assertTrue(response.active());
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        CustomerRequest request = new CustomerRequest(
                99L,
                "Maria Silva",
                "12345678900",
                "83999999999",
                LocalDate.now(),
                true
        );

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> customerService.create(request));
    }

    @Test
    void shouldFindAllCustomers() {
        User user = User.builder().id(1L).build();

        Customer customer = Customer.builder()
                .id(1L)
                .user(user)
                .fullName("Maria Silva")
                .cpf("12345678900")
                .phone("83999999999")
                .birthDate(LocalDate.of(1995, 5, 10))
                .marketingOptIn(true)
                .active(true)
                .build();

        when(customerRepository.findAll()).thenReturn(List.of(customer));

        List<CustomerResponse> response = customerService.findAll();

        assertEquals(1, response.size());
        assertEquals("Maria Silva", response.get(0).fullName());
    }

    @Test
    void shouldFindCustomerById() {
        User user = User.builder().id(1L).build();

        Customer customer = Customer.builder()
                .id(1L)
                .user(user)
                .fullName("Maria Silva")
                .active(true)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        CustomerResponse response = customerService.findById(1L);

        assertEquals(1L, response.id());
        assertEquals("Maria Silva", response.fullName());
    }

    @Test
    void shouldUpdateCustomer() {
        User oldUser = User.builder().id(1L).build();
        User newUser = User.builder().id(2L).build();
        Customer customer = Customer.builder()
                .id(1L)
                .user(oldUser)
                .fullName("Old")
                .cpf("111")
                .active(true)
                .build();
        CustomerRequest request = new CustomerRequest(
                2L,
                "Maria Nova",
                "222",
                "83999999999",
                LocalDate.of(1990, 1, 1),
                false
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newUser));
        when(customerRepository.save(customer)).thenReturn(customer);

        CustomerResponse response = customerService.update(1L, request);

        assertEquals("Maria Nova", response.fullName());
        assertEquals(2L, response.userId());
        assertFalse(response.marketingOptIn());
    }

    @Test
    void shouldDeactivateCustomer() {
        Customer customer = Customer.builder()
                .id(1L)
                .user(User.builder().id(1L).build())
                .active(true)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        customerService.deactivate(1L);

        assertFalse(customer.getActive());
        verify(customerRepository).save(customer);
    }
}
