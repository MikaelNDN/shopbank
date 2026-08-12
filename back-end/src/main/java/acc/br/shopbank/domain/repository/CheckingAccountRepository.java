package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.CheckingAccount;
import acc.br.shopbank.domain.enums.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CheckingAccountRepository extends JpaRepository<CheckingAccount, Long> {

    Optional<CheckingAccount> findFirstByCustomerIdAndTypeAndActiveTrue(Long customerId, AccountType type);

    Optional<CheckingAccount> findFirstByStoreIdAndTypeAndActiveTrue(Long storeId, AccountType type);

    Optional<CheckingAccount> findFirstByTypeAndActiveTrue(AccountType type);
}
