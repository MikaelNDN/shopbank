package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.AccountTransactionResponse;
import acc.br.shopbank.application.dto.AdminDashboardResponse;
import acc.br.shopbank.application.dto.AdminInventoryResponse;
import acc.br.shopbank.application.dto.AdminReportResponse;
import acc.br.shopbank.application.dto.AuditLogResponse;
import acc.br.shopbank.application.dto.BankRequest;
import acc.br.shopbank.application.dto.BankResponse;
import acc.br.shopbank.application.dto.CategoryRequest;
import acc.br.shopbank.application.dto.CategoryResponse;
import acc.br.shopbank.application.dto.CheckingAccountRequest;
import acc.br.shopbank.application.dto.CheckingAccountResponse;
import acc.br.shopbank.application.dto.CreateOrderRequest;
import acc.br.shopbank.application.dto.CustomerAddressRequest;
import acc.br.shopbank.application.dto.CustomerAddressResponse;
import acc.br.shopbank.application.dto.CustomerRequest;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.application.dto.InventoryRequest;
import acc.br.shopbank.application.dto.InventoryResponse;
import acc.br.shopbank.application.dto.LoginRequest;
import acc.br.shopbank.application.dto.OrderItemRequest;
import acc.br.shopbank.application.dto.OrderItemResponse;
import acc.br.shopbank.application.dto.OrderResponse;
import acc.br.shopbank.application.dto.OrderShippingAddressResponse;
import acc.br.shopbank.application.dto.OrderStatusRequest;
import acc.br.shopbank.application.dto.PaymentResponse;
import acc.br.shopbank.application.dto.ProductRequest;
import acc.br.shopbank.application.dto.ProductResponse;
import acc.br.shopbank.application.dto.RegisterRequest;
import acc.br.shopbank.application.dto.StoreRequest;
import acc.br.shopbank.application.dto.StoreResponse;
import acc.br.shopbank.application.dto.ViaCepResponse;
import acc.br.shopbank.application.dto.WebhookLogResponse;
import acc.br.shopbank.infrastructure.config.AbacatePayProperties;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.AccountType;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.enums.TransactionType;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.infrastructure.web.GlobalExceptionHandler;
import acc.br.shopbank.infrastructure.integration.cep.ViaCepClient;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import acc.br.shopbank.application.service.AdminService;
import acc.br.shopbank.application.service.AuditLogService;
import acc.br.shopbank.application.service.AuthService;
import acc.br.shopbank.application.service.AuthService.RegisterResult;
import acc.br.shopbank.application.service.BankService;
import acc.br.shopbank.application.service.CategoryService;
import acc.br.shopbank.application.service.CheckingAccountService;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.CustomerAddressService;
import acc.br.shopbank.application.service.CustomerService;
import acc.br.shopbank.application.service.InventoryService;
import acc.br.shopbank.application.service.OrderService;
import acc.br.shopbank.application.service.PaymentService;
import acc.br.shopbank.application.service.ProductService;
import acc.br.shopbank.application.service.StoreService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.DynamicTest.dynamicTest;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AllEndpointsSmokeTest {

    private static final String USER_EMAIL = "cliente@email.com";

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private AdminService adminService;
    private AuditLogService auditLogService;
    private AuthService authService;
    private BankService bankService;
    private CategoryService categoryService;
    private CheckingAccountService checkingAccountService;
    private CustomerAccessService customerAccessService;
    private CustomerAddressService addressService;
    private CustomerService customerService;
    private InventoryService inventoryService;
    private OrderService orderService;
    private PaymentService paymentService;
    private ProductService productService;
    private StoreService storeService;
    private ViaCepClient viaCepClient;
    private UserRepository userRepository;
    private CustomerRepository customerRepository;
    private AbacatePayWebhookHandler webhookHandler;
    private AbacatePayProperties abacatePayProperties;

    @BeforeEach
    void setup() {
        adminService = Mockito.mock(AdminService.class);
        auditLogService = Mockito.mock(AuditLogService.class);
        authService = Mockito.mock(AuthService.class);
        bankService = Mockito.mock(BankService.class);
        categoryService = Mockito.mock(CategoryService.class);
        checkingAccountService = Mockito.mock(CheckingAccountService.class);
        customerAccessService = Mockito.mock(CustomerAccessService.class);
        addressService = Mockito.mock(CustomerAddressService.class);
        customerService = Mockito.mock(CustomerService.class);
        inventoryService = Mockito.mock(InventoryService.class);
        orderService = Mockito.mock(OrderService.class);
        paymentService = Mockito.mock(PaymentService.class);
        productService = Mockito.mock(ProductService.class);
        storeService = Mockito.mock(StoreService.class);
        viaCepClient = Mockito.mock(ViaCepClient.class);
        userRepository = Mockito.mock(UserRepository.class);
        customerRepository = Mockito.mock(CustomerRepository.class);
        webhookHandler = Mockito.mock(AbacatePayWebhookHandler.class);
        abacatePayProperties = new AbacatePayProperties();

        mockMvc = MockMvcBuilders.standaloneSetup(
                        new AdminController(adminService, customerService),
                        new AddressController(viaCepClient, addressService, customerAccessService),
                        new AuditController(auditLogService),
                        new AuthController(authService, userRepository, customerRepository),
                        new BankController(bankService),
                        new CheckingAccountController(checkingAccountService),
                        new CustomerAddressController(addressService, customerAccessService),
                        new CustomerController(customerService, customerAccessService),
                        new InventoryController(inventoryService),
                        new OrderController(orderService, customerAccessService),
                        new PaymentController(paymentService, customerAccessService, webhookHandler, abacatePayProperties),
                        new AbacatePayRootWebhookController(webhookHandler),
                        new ProductController(productService, categoryService),
                        new StoreController(storeService)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @TestFactory
    Stream<DynamicTest> shouldRespondOnEveryRestEndpoint() {
        return Stream.of(
                endpoint("GET /api/admin/dashboard", () -> {
                    when(adminService.dashboard(any())).thenReturn(adminDashboardResponse());

                    mockMvc.perform(get("/api/admin/dashboard"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.totalCustomers").value(1));
                }),
                endpoint("GET /api/admin/reports", () -> {
                    when(adminService.reports()).thenReturn(adminReportResponse());

                    mockMvc.perform(get("/api/admin/reports"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.totalRevenue").value(100.0));
                }),
                endpoint("GET /api/admin/customers", () -> {
                    when(customerService.findAll()).thenReturn(List.of(customerResponse()));

                    mockMvc.perform(get("/api/admin/customers"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].fullName").value("Maria Silva"));
                }),
                endpoint("GET /api/admin/inventory", () -> {
                    when(adminService.inventory()).thenReturn(List.of(adminInventoryResponse()));

                    mockMvc.perform(get("/api/admin/inventory"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].productName").value("Mouse Gamer"));
                }),
                endpoint("GET /api/addresses/postal-code/{postalCode}", () -> {
                    when(viaCepClient.findAddress("58015000")).thenReturn(viaCepResponse());

                    mockMvc.perform(get("/api/addresses/postal-code/58015000"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.cep").value("58015000"));
                }),
                endpoint("POST /api/addresses", () -> authenticated(() -> {
                    when(addressService.create(any(CustomerAddressRequest.class))).thenReturn(addressResponse());

                    mockMvc.perform(json(post("/api/addresses"), addressRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.recipientName").value("Maria Silva"));
                })),
                endpoint("GET /api/addresses/customer/{customerId}", () -> authenticated(() -> {
                    when(addressService.findByCustomer(1L)).thenReturn(List.of(addressResponse()));

                    mockMvc.perform(get("/api/addresses/customer/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].customerId").value(1));
                })),
                endpoint("PATCH /api/addresses/{addressId}/favorite", () -> authenticated(() -> {
                    when(addressService.setFavorite(1L)).thenReturn(addressResponse());

                    mockMvc.perform(patch("/api/addresses/1/favorite"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.favorite").value(true));
                })),
                endpoint("PUT /api/addresses/{addressId}", () -> authenticated(() -> {
                    when(addressService.update(any(Long.class), any(CustomerAddressRequest.class))).thenReturn(addressResponse());

                    mockMvc.perform(json(put("/api/addresses/1"), addressRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.id").value(1));
                })),
                endpoint("DELETE /api/addresses/{addressId}", () -> authenticated(() ->
                        mockMvc.perform(delete("/api/addresses/1"))
                                .andExpect(status().isNoContent())
                )),
                endpoint("GET /api/audit-logs", () -> {
                    when(auditLogService.findAll()).thenReturn(List.of(auditLogResponse()));

                    mockMvc.perform(get("/api/audit-logs"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].entityName").value("Order"));
                }),
                endpoint("POST /api/auth/register", () -> {
                    when(authService.register(any(RegisterRequest.class))).thenReturn(new RegisterResult(user(), customer()));

                    mockMvc.perform(json(post("/api/auth/register"), registerRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.email").value(USER_EMAIL));
                }),
                endpoint("POST /api/auth/login", () -> {
                    when(authService.login(any(LoginRequest.class))).thenReturn("fake-token");

                    mockMvc.perform(json(post("/api/auth/login"), loginRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.token").value("fake-token"));
                }),
                endpoint("POST /api/banks", () -> {
                    when(bankService.create(any(BankRequest.class))).thenReturn(bankResponse());

                    mockMvc.perform(json(post("/api/banks"), bankRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.code").value("001"));
                }),
                endpoint("GET /api/banks", () -> {
                    when(bankService.findAll()).thenReturn(List.of(bankResponse()));

                    mockMvc.perform(get("/api/banks"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].name").value("ShopBank"));
                }),
                endpoint("GET /api/banks/{id}", () -> {
                    when(bankService.findById(1L)).thenReturn(bankResponse());

                    mockMvc.perform(get("/api/banks/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.id").value(1));
                }),
                endpoint("PUT /api/banks/{id}", () -> {
                    when(bankService.update(any(Long.class), any(BankRequest.class))).thenReturn(bankResponse());

                    mockMvc.perform(json(put("/api/banks/1"), bankRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.active").value(true));
                }),
                endpoint("DELETE /api/banks/{id}", () ->
                        mockMvc.perform(delete("/api/banks/1"))
                                .andExpect(status().isNoContent())
                ),
                endpoint("POST /api/checking-accounts", () -> {
                    when(checkingAccountService.create(any(CheckingAccountRequest.class))).thenReturn(checkingAccountResponse());

                    mockMvc.perform(json(post("/api/checking-accounts"), checkingAccountRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.number").value("12345"));
                }),
                endpoint("GET /api/checking-accounts", () -> {
                    when(checkingAccountService.findAll()).thenReturn(List.of(checkingAccountResponse()));

                    mockMvc.perform(get("/api/checking-accounts"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].agency").value("0001"));
                }),
                endpoint("GET /api/checking-accounts/{id}", () -> {
                    when(checkingAccountService.findById(1L)).thenReturn(checkingAccountResponse());

                    mockMvc.perform(get("/api/checking-accounts/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.id").value(1));
                }),
                endpoint("GET /api/checking-accounts/{id}/transactions", () -> {
                    when(checkingAccountService.findTransactions(1L)).thenReturn(List.of(transactionResponse()));

                    mockMvc.perform(get("/api/checking-accounts/1/transactions"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].description").value("Payment approved"));
                }),
                endpoint("DELETE /api/checking-accounts/{id}", () ->
                        mockMvc.perform(delete("/api/checking-accounts/1"))
                                .andExpect(status().isNoContent())
                ),
                endpoint("POST /api/customers/{customerId}/addresses", () -> authenticated(() -> {
                    when(addressService.createForCustomer(any(Long.class), any(CustomerAddressRequest.class))).thenReturn(addressResponse());

                    mockMvc.perform(json(post("/api/customers/1/addresses"), addressRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.customerId").value(1));
                })),
                endpoint("GET /api/customers/{customerId}/addresses", () -> authenticated(() -> {
                    when(addressService.findByCustomer(1L)).thenReturn(List.of(addressResponse()));

                    mockMvc.perform(get("/api/customers/1/addresses"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].id").value(1));
                })),
                endpoint("PUT /api/customers/{customerId}/addresses/{addressId}", () -> authenticated(() -> {
                    when(addressService.updateForCustomer(any(Long.class), any(Long.class), any(CustomerAddressRequest.class)))
                            .thenReturn(addressResponse());

                    mockMvc.perform(json(put("/api/customers/1/addresses/1"), addressRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.street").value("Rua Central"));
                })),
                endpoint("DELETE /api/customers/{customerId}/addresses/{addressId}", () -> authenticated(() ->
                        mockMvc.perform(delete("/api/customers/1/addresses/1"))
                                .andExpect(status().isNoContent())
                )),
                endpoint("PATCH /api/customers/{customerId}/addresses/{addressId}/favorite", () -> authenticated(() -> {
                    when(addressService.setFavoriteForCustomer(1L, 1L)).thenReturn(addressResponse());

                    mockMvc.perform(patch("/api/customers/1/addresses/1/favorite"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.favorite").value(true));
                })),
                endpoint("POST /api/customers", () -> authenticated(() -> {
                    when(customerService.create(any(CustomerRequest.class))).thenReturn(customerResponse());

                    mockMvc.perform(json(post("/api/customers"), customerRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.fullName").value("Maria Silva"));
                })),
                endpoint("GET /api/customers", () -> {
                    when(customerService.findAll()).thenReturn(List.of(customerResponse()));

                    mockMvc.perform(get("/api/customers"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].cpf").value("12345678900"));
                }),
                endpoint("GET /api/customers/{id}", () -> authenticated(() -> {
                    when(customerService.findById(1L)).thenReturn(customerResponse());

                    mockMvc.perform(get("/api/customers/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.id").value(1));
                })),
                endpoint("PUT /api/customers/{id}", () -> authenticated(() -> {
                    when(customerService.update(any(Long.class), any(CustomerRequest.class))).thenReturn(customerResponse());

                    mockMvc.perform(json(put("/api/customers/1"), customerRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.phone").value("83999999999"));
                })),
                endpoint("DELETE /api/customers/{id}", () -> authenticated(() ->
                        mockMvc.perform(delete("/api/customers/1"))
                                .andExpect(status().isNoContent())
                )),
                endpoint("POST /api/inventory/reserve", () -> {
                    when(inventoryService.reserve(any(InventoryRequest.class))).thenReturn(inventoryResponse());

                    mockMvc.perform(json(post("/api/inventory/reserve"), inventoryRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.reservedQuantity").value(1));
                }),
                endpoint("POST /api/inventory/replenish", () -> {
                    when(inventoryService.replenish(any(InventoryRequest.class))).thenReturn(inventoryResponse());

                    mockMvc.perform(json(post("/api/inventory/replenish"), inventoryRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.availableQuantity").value(9));
                }),
                endpoint("GET /api/inventory/product/{id}", () -> {
                    when(inventoryService.findByProductId(1L)).thenReturn(inventoryResponse());

                    mockMvc.perform(get("/api/inventory/product/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.productId").value(1));
                }),
                endpoint("POST /api/orders", () -> authenticated(() -> {
                    when(orderService.create(any(CreateOrderRequest.class))).thenReturn(orderResponse());

                    mockMvc.perform(json(post("/api/orders"), createOrderRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.status").value("CREATED"));
                })),
                endpoint("GET /api/orders/customer/{customerId}", () -> authenticated(() -> {
                    when(orderService.findByCustomer(1L)).thenReturn(List.of(orderResponse()));

                    mockMvc.perform(get("/api/orders/customer/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].customerId").value(1));
                })),
                endpoint("GET /api/orders/my-orders", () -> authenticated(() -> {
                    when(orderService.findMyOrders(USER_EMAIL)).thenReturn(List.of(orderResponse()));

                    mockMvc.perform(get("/api/orders/my-orders"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].id").value(1));
                })),
                endpoint("GET /api/orders/{id}", () -> authenticated(() -> {
                    when(orderService.findById(1L)).thenReturn(orderResponse());

                    mockMvc.perform(get("/api/orders/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.totalAmount").value(100.0));
                })),
                endpoint("PATCH /api/orders/{id}/cancel", () -> authenticated(() -> {
                    when(orderService.cancel(1L)).thenReturn(orderResponse(OrderStatus.CANCELED));

                    mockMvc.perform(patch("/api/orders/1/cancel"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.status").value("CANCELED"));
                })),
                endpoint("PATCH /api/orders/{id}/status", () -> {
                    when(orderService.updateStatus(any(Long.class), any(OrderStatusRequest.class)))
                            .thenReturn(orderResponse(OrderStatus.PAID));

                    mockMvc.perform(json(patch("/api/orders/1/status"), new OrderStatusRequest(OrderStatus.PAID)))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.status").value("PAID"));
                }),
                endpoint("POST /api/payments/abacatepay/checkout/{orderId}", () -> authenticated(() -> {
                    when(paymentService.createAbacatePayCheckout(1L)).thenReturn(paymentResponse());

                    mockMvc.perform(post("/api/payments/abacatepay/checkout/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.checkoutUrl").value("https://checkout.example.com"));
                })),
                endpoint("POST /api/payments/{paymentId}/simulate-approval", () -> authenticated(() -> {
                    when(paymentService.simulateApproval(1L)).thenReturn(paymentResponse(PaymentStatus.APPROVED));

                    mockMvc.perform(post("/api/payments/1/simulate-approval"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.status").value("APPROVED"));
                })),
                endpoint("POST /api/payments/abacatepay/webhook", () -> {
                    when(webhookHandler.handle(any(), any(), any(), any(), any()))
                            .thenReturn(ResponseEntity.ok(webhookLogResponse()));

                    mockMvc.perform(json(post("/api/payments/abacatepay/webhook"), Map.of("event", "transparent.completed")))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.provider").value("abacatepay"));
                }),
                endpoint("POST /api/categories", () -> {
                    when(categoryService.create(any(CategoryRequest.class))).thenReturn(categoryResponse());

                    mockMvc.perform(json(post("/api/categories"), categoryRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.name").value("Eletronicos"));
                }),
                endpoint("GET /api/categories", () -> {
                    when(categoryService.findAll()).thenReturn(List.of(categoryResponse()));

                    mockMvc.perform(get("/api/categories"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].id").value(1));
                }),
                endpoint("GET /api/categories/{id}", () -> {
                    when(categoryService.findById(1L)).thenReturn(categoryResponse());

                    mockMvc.perform(get("/api/categories/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.description").value("Categoria teste"));
                }),
                endpoint("PUT /api/categories/{id}", () -> {
                    when(categoryService.update(any(Long.class), any(CategoryRequest.class))).thenReturn(categoryResponse());

                    mockMvc.perform(json(put("/api/categories/1"), categoryRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.active").value(true));
                }),
                endpoint("DELETE /api/categories/{id}", () ->
                        mockMvc.perform(delete("/api/categories/1"))
                                .andExpect(status().isNoContent())
                ),
                endpoint("POST /api/products", () -> {
                    when(productService.create(any(ProductRequest.class))).thenReturn(productResponse());

                    mockMvc.perform(json(post("/api/products"), productRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.name").value("Mouse Gamer"));
                }),
                endpoint("GET /api/products", () -> {
                    when(productService.findAll()).thenReturn(List.of(productResponse()));

                    mockMvc.perform(get("/api/products"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].price").value(100.0));
                }),
                endpoint("GET /api/products/{id}", () -> {
                    when(productService.findById(1L)).thenReturn(productResponse());

                    mockMvc.perform(get("/api/products/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.categoryId").value(1));
                }),
                endpoint("PUT /api/products/{id}", () -> {
                    when(productService.update(any(Long.class), any(ProductRequest.class))).thenReturn(productResponse());

                    mockMvc.perform(json(put("/api/products/1"), productRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.storeId").value(1));
                }),
                endpoint("DELETE /api/products/{id}", () ->
                        mockMvc.perform(delete("/api/products/1"))
                                .andExpect(status().isNoContent())
                ),
                endpoint("POST /api/stores", () -> {
                    when(storeService.create(any(StoreRequest.class))).thenReturn(storeResponse());

                    mockMvc.perform(json(post("/api/stores"), storeRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.tradeName").value("ShopBank Store"));
                }),
                endpoint("GET /api/stores", () -> {
                    when(storeService.findAll()).thenReturn(List.of(storeResponse()));

                    mockMvc.perform(get("/api/stores"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$[0].cnpj").value("12345678000199"));
                }),
                endpoint("GET /api/stores/{id}", () -> {
                    when(storeService.findById(1L)).thenReturn(storeResponse());

                    mockMvc.perform(get("/api/stores/1"))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.id").value(1));
                }),
                endpoint("PUT /api/stores/{id}", () -> {
                    when(storeService.update(any(Long.class), any(StoreRequest.class))).thenReturn(storeResponse());

                    mockMvc.perform(json(put("/api/stores/1"), storeRequest()))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.email").value("store@email.com"));
                }),
                endpoint("DELETE /api/stores/{id}", () ->
                        mockMvc.perform(delete("/api/stores/1"))
                                .andExpect(status().isNoContent())
                )
        );
    }

    private DynamicTest endpoint(String name, EndpointAssertion assertion) {
        return dynamicTest(name, assertion::run);
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, Object body)
            throws JsonProcessingException {
        return builder.contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private void authenticated(EndpointAssertion assertion) throws Exception {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(USER_EMAIL)
                .password("ignored")
                .roles("CLIENT")
                .build();

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                principal,
                principal.getPassword(),
                principal.getAuthorities()
        ));

        SecurityContextHolder.setContext(context);
        try {
            assertion.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private AdminDashboardResponse adminDashboardResponse() {
        return new AdminDashboardResponse(
                1,
                1,
                1,
                0,
                1,
                0,
                0,
                1,
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(100),
                new AdminDashboardResponse.BestSellingProduct(1L, "Mouse Gamer", 1),
                List.of(new AdminDashboardResponse.MonthlyRevenue("2026-01", BigDecimal.valueOf(100))),
                List.of(new AdminDashboardResponse.TopProduct(1L, "Mouse Gamer", 1)),
                Map.of(OrderStatus.PAID.name(), 1L),
                List.of(new AdminDashboardResponse.CategoryRevenue(1L, "Eletronicos", BigDecimal.valueOf(100))),
                List.of(new AdminDashboardResponse.LowStockEntry(1L, "Mouse Gamer", 1))
        );
    }

    private AdminReportResponse adminReportResponse() {
        return new AdminReportResponse(
                Map.of(OrderStatus.PAID.name(), 1L),
                Map.of(PaymentStatus.APPROVED.name(), 1L),
                BigDecimal.valueOf(100)
        );
    }

    private AdminInventoryResponse adminInventoryResponse() {
        return new AdminInventoryResponse(1L, 1L, "Mouse Gamer", 9, 1, true);
    }

    private ViaCepResponse viaCepResponse() {
        return new ViaCepResponse("58015000", "Rua Central", "Centro", "Campina Grande", "PB");
    }

    private CustomerAddressRequest addressRequest() {
        return new CustomerAddressRequest(
                1L,
                "Casa",
                "Maria Silva",
                "58015000",
                "Rua Central",
                "100",
                "Apto 101",
                "Centro",
                "Campina Grande",
                "PB",
                "Proximo ao mercado",
                true
        );
    }

    private CustomerAddressResponse addressResponse() {
        return new CustomerAddressResponse(
                1L,
                1L,
                "Casa",
                "Maria Silva",
                "58015000",
                "Rua Central",
                "100",
                "Apto 101",
                "Centro",
                "Campina Grande",
                "PB",
                "Proximo ao mercado",
                true,
                true
        );
    }

    private AuditLogResponse auditLogResponse() {
        return new AuditLogResponse(
                1L,
                "Order",
                1L,
                "CREATE",
                null,
                "{}",
                1L,
                "Order created",
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
    }

    private User user() {
        return User.builder()
                .id(1L)
                .email(USER_EMAIL)
                .role(UserRole.CLIENT)
                .active(true)
                .build();
    }

    private Customer customer() {
        return Customer.builder()
                .id(1L)
                .user(user())
                .fullName("Maria Silva")
                .cpf("12345678900")
                .active(true)
                .build();
    }

    private RegisterRequest registerRequest() {
        return new RegisterRequest(USER_EMAIL, "123456", "Maria Silva", "12345678900");
    }

    private LoginRequest loginRequest() {
        return new LoginRequest(USER_EMAIL, "123456");
    }

    private BankRequest bankRequest() {
        return new BankRequest("001", "ShopBank", true);
    }

    private BankResponse bankResponse() {
        return new BankResponse(1L, "001", "ShopBank", true);
    }

    private CheckingAccountRequest checkingAccountRequest() {
        return new CheckingAccountRequest(
                1L,
                1L,
                null,
                "0001",
                "12345",
                "0",
                BigDecimal.valueOf(100),
                AccountType.CUSTOMER,
                true
        );
    }

    private CheckingAccountResponse checkingAccountResponse() {
        return new CheckingAccountResponse(
                1L,
                1L,
                1L,
                null,
                "0001",
                "12345",
                "0",
                BigDecimal.valueOf(100),
                AccountType.CUSTOMER,
                true
        );
    }

    private AccountTransactionResponse transactionResponse() {
        return new AccountTransactionResponse(
                1L,
                1L,
                1L,
                1L,
                TransactionType.CREDIT,
                BigDecimal.valueOf(100),
                "Payment approved",
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
    }

    private CustomerRequest customerRequest() {
        return new CustomerRequest(
                1L,
                "Maria Silva",
                "12345678900",
                "83999999999",
                LocalDate.of(1995, 5, 10),
                true
        );
    }

    private CustomerResponse customerResponse() {
        return new CustomerResponse(
                1L,
                1L,
                "Maria Silva",
                "12345678900",
                "83999999999",
                LocalDate.of(1995, 5, 10),
                true,
                true
        );
    }

    private InventoryRequest inventoryRequest() {
        return new InventoryRequest(1L, 1);
    }

    private InventoryResponse inventoryResponse() {
        return new InventoryResponse(1L, 1L, 9, 1, LocalDateTime.of(2026, 1, 1, 10, 0));
    }

    private CreateOrderRequest createOrderRequest() {
        return new CreateOrderRequest(1L, 1L, List.of(new OrderItemRequest(1L, 1)));
    }

    private OrderResponse orderResponse() {
        return orderResponse(OrderStatus.CREATED);
    }

    private OrderResponse orderResponse(OrderStatus status) {
        return new OrderResponse(
                1L,
                1L,
                status,
                BigDecimal.valueOf(100),
                List.of(new OrderItemResponse(1L, "Mouse Gamer", 1, BigDecimal.valueOf(100), BigDecimal.valueOf(100))),
                new OrderShippingAddressResponse(
                        1L,
                        "Maria Silva",
                        "58015000",
                        "Rua Central",
                        "100",
                        "Apto 101",
                        "Centro",
                        "Campina Grande",
                        "PB",
                        "Proximo ao mercado"
                ),
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
    }

    private PaymentResponse paymentResponse() {
        return paymentResponse(PaymentStatus.CREATED);
    }

    private PaymentResponse paymentResponse(PaymentStatus status) {
        return new PaymentResponse(
                1L,
                1L,
                PaymentMethod.ABACATEPAY,
                status,
                BigDecimal.valueOf(100),
                "https://checkout.example.com",
                LocalDateTime.of(2026, 1, 1, 10, 0),
                null
        );
    }

    private WebhookLogResponse webhookLogResponse() {
        return new WebhookLogResponse(
                1L,
                "abacatepay",
                "event-1",
                "payment",
                true,
                LocalDateTime.of(2026, 1, 1, 10, 0),
                LocalDateTime.of(2026, 1, 1, 10, 1)
        );
    }

    private CategoryRequest categoryRequest() {
        return new CategoryRequest("Eletronicos", "Categoria teste", true);
    }

    private CategoryResponse categoryResponse() {
        return new CategoryResponse(1L, "Eletronicos", "Categoria teste", true);
    }

    private ProductRequest productRequest() {
        return new ProductRequest(
                1L,
                1L,
                "Mouse Gamer",
                "Mouse com sensor optico",
                BigDecimal.valueOf(100),
                "https://example.com/mouse.jpg",
                true
        );
    }

    private ProductResponse productResponse() {
        return new ProductResponse(
                1L,
                1L,
                1L,
                "Mouse Gamer",
                "Mouse com sensor optico",
                BigDecimal.valueOf(100),
                "https://example.com/mouse.jpg",
                true
        );
    }

    private StoreRequest storeRequest() {
        return new StoreRequest(
                "ShopBank Comercio LTDA",
                "ShopBank Store",
                "12345678000199",
                "store@email.com",
                true
        );
    }

    private StoreResponse storeResponse() {
        return new StoreResponse(
                1L,
                "ShopBank Comercio LTDA",
                "ShopBank Store",
                "12345678000199",
                "store@email.com",
                true
        );
    }

    @FunctionalInterface
    private interface EndpointAssertion {
        void run() throws Exception;
    }
}
