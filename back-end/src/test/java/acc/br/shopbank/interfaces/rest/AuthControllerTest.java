package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.LoginRequest;
import acc.br.shopbank.application.dto.RegisterRequest;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import acc.br.shopbank.application.service.AuthService;
import acc.br.shopbank.application.service.AuthService.RegisterResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private MockMvc mockMvc;

    private AuthService authService;
    private UserRepository userRepository;
    private CustomerRepository customerRepository;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {

        authService = Mockito.mock(AuthService.class);
        userRepository = Mockito.mock(UserRepository.class);
        customerRepository = Mockito.mock(CustomerRepository.class);

        AuthController controller =
                new AuthController(authService, userRepository, customerRepository);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldRegisterUser() throws Exception {

        User user = User.builder()
                .id(1L)
                .email("teste@email.com")
                .role(UserRole.CLIENT)
                .active(true)
                .build();

        Customer customer = Customer.builder()
                .id(1L)
                .user(user)
                .fullName("Teste Da Silva")
                .cpf("12345678900")
                .active(true)
                .build();

        RegisterRequest request =
                new RegisterRequest(
                        "teste@email.com",
                        "123456",
                        "Teste Da Silva",
                        "12345678900"
                );

        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new RegisterResult(user, customer));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email")
                        .value("teste@email.com"))
                .andExpect(jsonPath("$.fullName")
                        .value("Teste Da Silva"));
    }

    @Test
    void shouldLogin() throws Exception {

        LoginRequest request =
                new LoginRequest(
                        "teste@email.com",
                        "123456"
                );

        when(authService.login(any(LoginRequest.class)))
                .thenReturn("fake-jwt-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token")
                        .value("fake-jwt-token"));
    }
}
