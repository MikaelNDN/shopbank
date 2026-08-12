package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.AccountTransactionResponse;
import acc.br.shopbank.application.dto.CheckingAccountRequest;
import acc.br.shopbank.application.dto.CheckingAccountResponse;
import acc.br.shopbank.domain.model.*;
import acc.br.shopbank.domain.enums.AccountType;
import acc.br.shopbank.domain.enums.TransactionType;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CheckingAccountService {

    private final CheckingAccountRepository checkingAccountRepository;
    private final AccountTransactionRepository accountTransactionRepository;
    private final BankRepository bankRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;

    public CheckingAccountResponse create(CheckingAccountRequest request) {
        validateInitialBalance(request.balance());

        Bank bank = bankRepository.findById(request.bankId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found"));

        Customer customer = null;
        Store store = null;

        if (request.type() == AccountType.CUSTOMER) {
            if (request.customerId() == null || request.storeId() != null) {
                throw new BusinessException("Customer account must belong only to a customer");
            }
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }

        if (request.type() == AccountType.STORE) {
            if (request.storeId() == null || request.customerId() != null) {
                throw new BusinessException("Store account must belong only to a store");
            }
            store = storeRepository.findById(request.storeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        }

        if (request.type() == AccountType.MARKETPLACE) {
            if (request.customerId() != null || request.storeId() != null) {
                throw new BusinessException("Marketplace account cannot belong to a customer or store");
            }
        }

        CheckingAccount account = CheckingAccount.builder()
                .bank(bank)
                .customer(customer)
                .store(store)
                .agency(request.agency())
                .number(request.number())
                .digit(request.digit())
                .balance(request.balance())
                .type(request.type())
                .active(!Boolean.FALSE.equals(request.active()))
                .build();

        return toResponse(checkingAccountRepository.save(account));
    }

    @Transactional(readOnly = true)
    public List<CheckingAccountResponse> findAll() {
        return checkingAccountRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CheckingAccountResponse findById(Long id) {
        return toResponse(findAccount(id));
    }

    public void deactivate(Long id) {
        CheckingAccount account = findAccount(id);
        account.setActive(false);
        checkingAccountRepository.save(account);
    }

    public AccountTransaction debitCustomer(Long customerId, BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveCustomerAccount(customerId);
        return debit(account, amount, order, payment, TransactionType.DEBIT, description);
    }

    public AccountTransaction refundCustomer(Long customerId, BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveCustomerAccount(customerId);
        return credit(account, amount, order, payment, TransactionType.REFUND, description);
    }

    public AccountTransaction creditStore(Long storeId, BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveStoreAccount(storeId);
        return credit(account, amount, order, payment, TransactionType.CREDIT, description);
    }

    public AccountTransaction debitStoreForRefund(Long storeId, BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveStoreAccount(storeId);
        return debit(account, amount, order, payment, TransactionType.DEBIT, description);
    }

    public AccountTransaction creditMarketplace(BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveMarketplaceAccount();
        return credit(account, amount, order, payment, TransactionType.CREDIT, description);
    }

    public AccountTransaction debitMarketplaceForRefund(BigDecimal amount, Order order, Payment payment, String description) {
        CheckingAccount account = findActiveMarketplaceAccount();
        return debit(account, amount, order, payment, TransactionType.DEBIT, description);
    }

    @Transactional(readOnly = true)
    public List<AccountTransactionResponse> findTransactions(Long checkingAccountId) {
        return accountTransactionRepository.findByCheckingAccountId(checkingAccountId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AccountTransactionResponse> findTransactions(
            Long checkingAccountId,
            LocalDate from,
            LocalDate to,
            TransactionType type
    ) {
        findAccount(checkingAccountId);

        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        LocalDateTime toDt = to == null ? null : to.atTime(LocalTime.MAX);

        return accountTransactionRepository.findFiltered(checkingAccountId, type, fromDt, toDt)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CheckingAccountResponse findByCustomerId(Long customerId) {
        CheckingAccount account = checkingAccountRepository
                .findFirstByCustomerIdAndTypeAndActiveTrue(customerId, AccountType.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Customer checking account not found"));
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public boolean hasSufficientBalance(Long customerId, BigDecimal amount) {
        return checkingAccountRepository
                .findFirstByCustomerIdAndTypeAndActiveTrue(customerId, AccountType.CUSTOMER)
                .map(account -> account.getBalance().compareTo(amount) >= 0)
                .orElse(false);
    }

    public CheckingAccountResponse deposit(Long accountId, BigDecimal amount, String description) {
        CheckingAccount account = findAccount(accountId);
        ensureActive(account);
        ensureCustomerAccount(account, "Deposits are only allowed on customer accounts");

        String narrative = resolveDescription(description, "Customer deposit");
        credit(account, amount, null, null, TransactionType.DEPOSIT, narrative);

        return toResponse(account);
    }

    public CheckingAccountResponse withdraw(Long accountId, BigDecimal amount, String description) {
        CheckingAccount account = findAccount(accountId);
        ensureActive(account);
        ensureCustomerAccount(account, "Withdrawals are only allowed on customer accounts");

        String narrative = resolveDescription(description, "Customer withdrawal");
        debit(account, amount, null, null, TransactionType.WITHDRAWAL, narrative);

        return toResponse(account);
    }

    private void ensureActive(CheckingAccount account) {
        if (Boolean.FALSE.equals(account.getActive())) {
            throw new BusinessException("Account is inactive");
        }
    }

    private void ensureCustomerAccount(CheckingAccount account, String message) {
        if (account.getType() != AccountType.CUSTOMER) {
            throw new BusinessException(message);
        }
    }

    private String resolveDescription(String supplied, String fallback) {
        return (supplied == null || supplied.isBlank()) ? fallback : supplied;
    }

    private CheckingAccount findActiveCustomerAccount(Long customerId) {
        return checkingAccountRepository.findFirstByCustomerIdAndTypeAndActiveTrue(customerId, AccountType.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Customer checking account not found"));
    }

    private CheckingAccount findActiveStoreAccount(Long storeId) {
        return checkingAccountRepository.findFirstByStoreIdAndTypeAndActiveTrue(storeId, AccountType.STORE)
                .orElseThrow(() -> new ResourceNotFoundException("Store checking account not found"));
    }

    private CheckingAccount findActiveMarketplaceAccount() {
        return checkingAccountRepository.findFirstByTypeAndActiveTrue(AccountType.MARKETPLACE)
                .orElseThrow(() -> new ResourceNotFoundException("Marketplace checking account not found"));
    }

    private AccountTransaction debit(
            CheckingAccount account,
            BigDecimal amount,
            Order order,
            Payment payment,
            TransactionType type,
            String description
    ) {
        validateOperationAmount(amount);

        if (account.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient account balance");
        }

        account.setBalance(account.getBalance().subtract(amount));
        checkingAccountRepository.save(account);

        return saveTransaction(account, order, payment, type, amount, description);
    }

    private AccountTransaction credit(
            CheckingAccount account,
            BigDecimal amount,
            Order order,
            Payment payment,
            TransactionType type,
            String description
    ) {
        validateOperationAmount(amount);

        account.setBalance(account.getBalance().add(amount));
        checkingAccountRepository.save(account);

        return saveTransaction(account, order, payment, type, amount, description);
    }

    private AccountTransaction saveTransaction(
            CheckingAccount account,
            Order order,
            Payment payment,
            TransactionType type,
            BigDecimal amount,
            String description
    ) {
        AccountTransaction transaction = AccountTransaction.builder()
                .checkingAccount(account)
                .order(order)
                .payment(payment)
                .type(type)
                .amount(amount)
                .description(description)
                .build();

        return accountTransactionRepository.save(transaction);
    }

    private CheckingAccount findAccount(Long id) {
        return checkingAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Checking account not found"));
    }

    private void validateInitialBalance(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Initial balance cannot be negative");
        }
    }

    private void validateOperationAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be greater than zero");
        }
    }

    private CheckingAccountResponse toResponse(CheckingAccount account) {
        return new CheckingAccountResponse(
                account.getId(),
                account.getBank().getId(),
                account.getCustomer() == null ? null : account.getCustomer().getId(),
                account.getStore() == null ? null : account.getStore().getId(),
                account.getAgency(),
                account.getNumber(),
                account.getDigit(),
                account.getBalance(),
                account.getType(),
                account.getActive()
        );
    }

    private AccountTransactionResponse toTransactionResponse(AccountTransaction transaction) {
        return new AccountTransactionResponse(
                transaction.getId(),
                transaction.getCheckingAccount().getId(),
                transaction.getOrder() == null ? null : transaction.getOrder().getId(),
                transaction.getPayment() == null ? null : transaction.getPayment().getId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
