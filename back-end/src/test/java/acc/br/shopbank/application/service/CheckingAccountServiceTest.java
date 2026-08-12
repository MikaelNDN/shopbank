package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CheckingAccountRequest;
import acc.br.shopbank.application.dto.CheckingAccountResponse;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.AccountType;
import acc.br.shopbank.domain.enums.TransactionType;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CheckingAccountServiceTest {

    @Mock
    private CheckingAccountRepository checkingAccountRepository;

    @Mock
    private AccountTransactionRepository accountTransactionRepository;

    @Mock
    private BankRepository bankRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private StoreRepository storeRepository;

    private CheckingAccountService checkingAccountService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        checkingAccountService = new CheckingAccountService(
                checkingAccountRepository,
                accountTransactionRepository,
                bankRepository,
                customerRepository,
                storeRepository
        );
    }

    @Test
    void shouldCreateCustomerCheckingAccount() {
        Bank bank = Bank.builder().id(1L).code("001").build();
        Customer customer = Customer.builder().id(2L).fullName("Maria").build();
        CheckingAccountRequest request = new CheckingAccountRequest(
                1L, 2L, null, "0001", "123", "0", new BigDecimal("100.00"), AccountType.CUSTOMER, true
        );

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(customerRepository.findById(2L)).thenReturn(Optional.of(customer));
        when(checkingAccountRepository.save(any(CheckingAccount.class))).thenAnswer(invocation -> {
            CheckingAccount account = invocation.getArgument(0);
            account.setId(1L);
            return account;
        });

        CheckingAccountResponse response = checkingAccountService.create(request);

        assertEquals(1L, response.id());
        assertEquals(2L, response.customerId());
        assertNull(response.storeId());
        assertEquals(AccountType.CUSTOMER, response.type());
    }

    @Test
    void shouldCreateStoreCheckingAccount() {
        Bank bank = Bank.builder().id(1L).code("001").build();
        Store store = Store.builder().id(3L).tradeName("ShopBank").build();
        CheckingAccountRequest request = new CheckingAccountRequest(
                1L, null, 3L, "0001", "123", "0", BigDecimal.ZERO, AccountType.STORE, true
        );

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(storeRepository.findById(3L)).thenReturn(Optional.of(store));
        when(checkingAccountRepository.save(any(CheckingAccount.class))).thenAnswer(invocation -> {
            CheckingAccount account = invocation.getArgument(0);
            account.setId(1L);
            return account;
        });

        CheckingAccountResponse response = checkingAccountService.create(request);

        assertEquals(3L, response.storeId());
        assertNull(response.customerId());
        assertEquals(AccountType.STORE, response.type());
    }

    @Test
    void shouldCreateMarketplaceCheckingAccount() {
        Bank bank = Bank.builder().id(1L).code("001").build();
        CheckingAccountRequest request = new CheckingAccountRequest(
                1L, null, null, "0001", "30001", "0", BigDecimal.ZERO, AccountType.MARKETPLACE, true
        );

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(checkingAccountRepository.save(any(CheckingAccount.class))).thenAnswer(invocation -> {
            CheckingAccount account = invocation.getArgument(0);
            account.setId(1L);
            return account;
        });

        CheckingAccountResponse response = checkingAccountService.create(request);

        assertNull(response.customerId());
        assertNull(response.storeId());
        assertEquals(AccountType.MARKETPLACE, response.type());
    }

    @Test
    void shouldThrowWhenOwnerDoesNotMatchAccountType() {
        CheckingAccountRequest request = new CheckingAccountRequest(
                1L, 2L, 3L, "0001", "123", "0", BigDecimal.ZERO, AccountType.CUSTOMER, true
        );

        when(bankRepository.findById(1L)).thenReturn(Optional.of(Bank.builder().id(1L).build()));

        assertThrows(BusinessException.class, () -> checkingAccountService.create(request));
        verify(checkingAccountRepository, never()).save(any(CheckingAccount.class));
    }

    @Test
    void shouldThrowWhenInitialBalanceIsNegative() {
        CheckingAccountRequest request = new CheckingAccountRequest(
                1L, 2L, null, "0001", "123", "0", new BigDecimal("-1.00"), AccountType.CUSTOMER, true
        );

        assertThrows(BusinessException.class, () -> checkingAccountService.create(request));
        verifyNoInteractions(bankRepository);
    }

    @Test
    void shouldDebitCustomerAccount() {
        Customer customer = Customer.builder().id(1L).build();
        CheckingAccount account = CheckingAccount.builder()
                .id(1L)
                .customer(customer)
                .bank(Bank.builder().id(1L).build())
                .balance(new BigDecimal("100.00"))
                .type(AccountType.CUSTOMER)
                .active(true)
                .build();

        when(checkingAccountRepository.findFirstByCustomerIdAndTypeAndActiveTrue(1L, AccountType.CUSTOMER))
                .thenReturn(Optional.of(account));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> {
            AccountTransaction transaction = invocation.getArgument(0);
            transaction.setId(10L);
            return transaction;
        });

        AccountTransaction transaction = checkingAccountService.debitCustomer(
                1L, new BigDecimal("40.00"), null, null, "debit"
        );

        assertEquals(new BigDecimal("60.00"), account.getBalance());
        assertEquals(TransactionType.DEBIT, transaction.getType());
        verify(checkingAccountRepository).save(account);
    }

    @Test
    void shouldThrowWhenCustomerBalanceIsInsufficient() {
        CheckingAccount account = CheckingAccount.builder()
                .id(1L)
                .balance(new BigDecimal("10.00"))
                .type(AccountType.CUSTOMER)
                .active(true)
                .build();

        when(checkingAccountRepository.findFirstByCustomerIdAndTypeAndActiveTrue(1L, AccountType.CUSTOMER))
                .thenReturn(Optional.of(account));

        assertThrows(BusinessException.class,
                () -> checkingAccountService.debitCustomer(1L, new BigDecimal("40.00"), null, null, "debit"));

        verify(accountTransactionRepository, never()).save(any(AccountTransaction.class));
    }

    @Test
    void shouldCreditStoreAccountAndRefundCustomer() {
        Store store = Store.builder().id(2L).build();
        Customer customer = Customer.builder().id(1L).build();
        CheckingAccount storeAccount = CheckingAccount.builder()
                .id(2L)
                .store(store)
                .bank(Bank.builder().id(1L).build())
                .balance(BigDecimal.ZERO)
                .type(AccountType.STORE)
                .active(true)
                .build();
        CheckingAccount customerAccount = CheckingAccount.builder()
                .id(1L)
                .customer(customer)
                .bank(Bank.builder().id(1L).build())
                .balance(BigDecimal.ZERO)
                .type(AccountType.CUSTOMER)
                .active(true)
                .build();
        CheckingAccount marketplaceAccount = CheckingAccount.builder()
                .id(3L)
                .bank(Bank.builder().id(1L).build())
                .balance(BigDecimal.ZERO)
                .type(AccountType.MARKETPLACE)
                .active(true)
                .build();

        when(checkingAccountRepository.findFirstByStoreIdAndTypeAndActiveTrue(2L, AccountType.STORE))
                .thenReturn(Optional.of(storeAccount));
        when(checkingAccountRepository.findFirstByCustomerIdAndTypeAndActiveTrue(1L, AccountType.CUSTOMER))
                .thenReturn(Optional.of(customerAccount));
        when(checkingAccountRepository.findFirstByTypeAndActiveTrue(AccountType.MARKETPLACE))
                .thenReturn(Optional.of(marketplaceAccount));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        checkingAccountService.creditStore(2L, new BigDecimal("20.00"), null, null, "credit");
        checkingAccountService.refundCustomer(1L, new BigDecimal("15.00"), null, null, "refund");
        checkingAccountService.creditMarketplace(new BigDecimal("2.00"), null, null, "marketplace fee");

        assertEquals(new BigDecimal("20.00"), storeAccount.getBalance());
        assertEquals(new BigDecimal("15.00"), customerAccount.getBalance());
        assertEquals(new BigDecimal("2.00"), marketplaceAccount.getBalance());
    }

    @Test
    void shouldThrowWhenActiveStoreAccountIsMissing() {
        when(checkingAccountRepository.findFirstByStoreIdAndTypeAndActiveTrue(99L, AccountType.STORE))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> checkingAccountService.creditStore(99L, BigDecimal.ONE, null, null, "credit"));
    }

    @Test
    void shouldFindTransactionsAndDeactivateAccount() {
        CheckingAccount account = CheckingAccount.builder()
                .id(1L)
                .bank(Bank.builder().id(1L).build())
                .balance(BigDecimal.ZERO)
                .type(AccountType.CUSTOMER)
                .active(true)
                .build();
        AccountTransaction transaction = AccountTransaction.builder()
                .id(1L)
                .checkingAccount(account)
                .type(TransactionType.CREDIT)
                .amount(BigDecimal.ONE)
                .description("credit")
                .build();

        when(checkingAccountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(checkingAccountRepository.findAll()).thenReturn(List.of(account));
        when(accountTransactionRepository.findByCheckingAccountId(1L)).thenReturn(List.of(transaction));

        checkingAccountService.deactivate(1L);

        assertFalse(account.getActive());
        assertEquals(1, checkingAccountService.findAll().size());
        assertEquals(1, checkingAccountService.findTransactions(1L).size());
        assertEquals(1L, checkingAccountService.findById(1L).id());
    }
}
