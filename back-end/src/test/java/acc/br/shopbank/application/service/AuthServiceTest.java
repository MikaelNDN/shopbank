package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.LoginRequest;
import acc.br.shopbank.application.dto.RegisterRequest;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import acc.br.shopbank.infrastructure.security.JwtService;
import acc.br.shopbank.application.service.AuthService.RegisterResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, customerRepository, passwordEncoder, jwtService);
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest(
                "cliente@email.com",
                "123456",
                "Cliente Teste",
                "12345678900"
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            customer.setId(1L);
            return customer;
        });

        RegisterResult result = authService.register(request);

        assertNotNull(result);
        User user = result.user();
        Customer customer = result.customer();

        assertEquals("cliente@email.com", user.getEmail());
        assertEquals(UserRole.CLIENT, user.getRole());
        assertTrue(user.getActive());
        assertNotEquals("123456", user.getPasswordHash());

        assertNotNull(customer);
        assertEquals("Cliente Teste", customer.getFullName());
        assertEquals("12345678900", customer.getCpf());

        verify(userRepository).save(any(User.class));
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    void shouldThrowWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(
                "cliente@email.com",
                "123456",
                "Cliente Teste",
                "12345678900"
        );

        when(userRepository.findByEmail(request.email()))
                .thenReturn(Optional.of(new User()));

        assertThrows(BusinessException.class, () -> authService.register(request));
    }

    @Test
    void shouldLoginSuccessfully() {
        String password = "123456";

        User user = User.builder()
                .id(1L)
                .email("cliente@email.com")
                .passwordHash(passwordEncoder.encode(password))
                .role(UserRole.CLIENT)
                .active(true)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("fake-token");

        String token = authService.login(new LoginRequest(user.getEmail(), password));

        assertEquals("fake-token", token);
    }

    @Test
    void shouldThrowWhenLoginPasswordIsInvalid() {
        User user = User.builder()
                .email("cliente@email.com")
                .passwordHash(passwordEncoder.encode("123456"))
                .active(true)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(user.getEmail(), "wrong")));
    }

    @Test
    void shouldThrowWhenUserIsInactive() {
        User user = User.builder()
                .email("cliente@email.com")
                .passwordHash(passwordEncoder.encode("123456"))
                .active(false)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(user.getEmail(), "123456")));
    }
}
