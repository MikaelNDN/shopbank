package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.CustomerRequest;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.CustomerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CustomerControllerTest {

    private MockMvc mockMvc;

    private CustomerService customerService;

    private CustomerAccessService customerAccessService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {

        customerService = Mockito.mock(CustomerService.class);
        customerAccessService = Mockito.mock(CustomerAccessService.class);

        CustomerController controller =
                new CustomerController(customerService, customerAccessService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();

        objectMapper.findAndRegisterModules();
    }

    @Test
    void shouldCreateCustomer() throws Exception {

        CustomerRequest request =
                new CustomerRequest(
                        1L,
                        "Maria Silva",
                        "12345678900",
                        "83999999999",
                        LocalDate.of(1995, 5, 10),
                        true
                );

        CustomerResponse response =
                new CustomerResponse(
                        1L,
                        1L,
                        "Maria Silva",
                        "12345678900",
                        "83999999999",
                        LocalDate.of(1995, 5, 10),
                        true,
                        true
                );

        when(customerService.create(any(CustomerRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName")
                        .value("Maria Silva"));
    }

    @Test
    void shouldFindAllCustomers() throws Exception {

        CustomerResponse response =
                new CustomerResponse(
                        1L,
                        1L,
                        "Maria Silva",
                        "12345678900",
                        "83999999999",
                        LocalDate.of(1995, 5, 10),
                        true,
                        true
                );

        when(customerService.findAll())
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/customers"))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName")
                        .value("Maria Silva"));
    }

    @Test
    void shouldFindCustomerById() throws Exception {

        CustomerResponse response =
                new CustomerResponse(
                        1L,
                        1L,
                        "Maria Silva",
                        "12345678900",
                        "83999999999",
                        LocalDate.of(1995, 5, 10),
                        true,
                        true
                );

        when(customerService.findById(1L))
                .thenReturn(response);

        mockMvc.perform(get("/api/customers/1"))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(1L));
    }
}
