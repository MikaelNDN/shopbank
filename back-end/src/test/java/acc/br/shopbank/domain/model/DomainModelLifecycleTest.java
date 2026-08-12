package acc.br.shopbank.domain.model;

import acc.br.shopbank.domain.enums.AccountType;
import acc.br.shopbank.domain.enums.OrderStatus;
import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import acc.br.shopbank.domain.enums.TransactionType;
import acc.br.shopbank.domain.enums.UserRole;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class DomainModelLifecycleTest {

    @Test
    void shouldApplyBankStoreAndCheckingAccountDefaultsOnPersist() {
        Bank bank = Bank.builder().id(1L).code("001").name("ShopBank").build();
        bank.prePersist();

        Store store = Store.builder().id(2L).legalName("Loja LTDA").tradeName("Loja").cnpj("123").build();
        store.prePersist();

        CheckingAccount account = CheckingAccount.builder()
                .id(3L)
                .bank(bank)
                .store(store)
                .agency("0001")
                .number("123")
                .digit("9")
                .type(AccountType.STORE)
                .build();
        account.prePersist();
        account.preUpdate();

        assertTrue(bank.getActive());
        assertTrue(store.getActive());
        assertNotNull(store.getCreatedAt());
        assertEquals(BigDecimal.ZERO, account.getBalance());
        assertTrue(account.getActive());
        assertNotNull(account.getUpdatedAt());
    }

    @Test
    void shouldUpdateCatalogAndInventoryTimestamps() {
        Category category = Category.builder().id(1L).name("Tech").description("Devices").active(true).build();
        category.prePersist();
        category.preUpdate();

        Product product = Product.builder()
                .id(1L)
                .category(category)
                .storeId(2L)
                .name("Phone")
                .description("Smartphone")
                .price(new BigDecimal("999.90"))
                .imageUrl("https://image.test/phone.png")
                .active(true)
                .build();
        product.prePersist();
        product.preUpdate();

        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(10)
                .reservedQuantity(0)
                .build();
        inventory.prePersist();
        inventory.preUpdate();

        assertNotNull(category.getUpdatedAt());
        assertNotNull(product.getCreatedAt());
        assertEquals("Phone", inventory.getProduct().getName());
        assertNotNull(inventory.getUpdatedAt());
    }

    @Test
    void shouldUpdateUserCustomerAddressOrderAndPaymentLifecycleFields() {
        User user = User.builder()
                .id(1L)
                .email("cliente@email.com")
                .passwordHash("hash")
                .role(UserRole.CLIENT)
                .active(true)
                .build();
        user.prePersist();
        user.preUpdate();

        Customer customer = Customer.builder()
                .id(1L)
                .user(user)
                .fullName("Cliente")
                .cpf("12345678900")
                .phone("11999999999")
                .birthDate(LocalDate.of(1990, 1, 1))
                .marketingOptIn(true)
                .active(true)
                .build();
        customer.prePersist();
        customer.preUpdate();

        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .label("Casa")
                .recipientName("Cliente")
                .postalCode("01001000")
                .street("Rua A")
                .number("10")
                .city("Sao Paulo")
                .state("SP")
                .favorite(true)
                .active(true)
                .build();
        address.prePersist();
        address.preUpdate();

        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .status(OrderStatus.CREATED)
                .totalAmount(new BigDecimal("100.00"))
                .items(new ArrayList<>())
                .build();
        order.prePersist();
        order.preUpdate();

        Payment payment = Payment.builder()
                .id(1L)
                .order(order)
                .method(PaymentMethod.PIX)
                .status(PaymentStatus.CREATED)
                .amount(order.getTotalAmount())
                .gatewayPreferenceId("pref")
                .gatewayPaymentId("pay")
                .checkoutUrl("https://checkout.test")
                .qrCode("qr")
                .qrCodeBase64("base64")
                .boletoUrl("https://boleto.test")
                .statusDetail("created")
                .build();
        payment.prePersist();

        AccountTransaction transaction = AccountTransaction.builder()
                .id(1L)
                .checkingAccount(CheckingAccount.builder().bank(Bank.builder().code("001").name("Bank").build()).build())
                .order(order)
                .payment(payment)
                .type(TransactionType.CREDIT)
                .amount(new BigDecimal("100.00"))
                .description("credit")
                .build();
        transaction.prePersist();

        assertNotNull(user.getUpdatedAt());
        assertNotNull(customer.getUpdatedAt());
        assertEquals("Casa", address.getLabel());
        assertNotNull(order.getUpdatedAt());
        assertNotNull(payment.getCreatedAt());
        assertNotNull(transaction.getCreatedAt());
    }
}
