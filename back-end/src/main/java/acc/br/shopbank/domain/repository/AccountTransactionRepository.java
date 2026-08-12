package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.enums.TransactionType;
import acc.br.shopbank.domain.model.AccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, Long> {

    List<AccountTransaction> findByCheckingAccountId(Long checkingAccountId);

    @Query("""
            SELECT t FROM AccountTransaction t
            WHERE t.checkingAccount.id = :accountId
              AND (:type IS NULL OR t.type = :type)
              AND (:from IS NULL OR t.createdAt >= :from)
              AND (:to IS NULL OR t.createdAt <= :to)
            ORDER BY t.createdAt DESC
            """)
    List<AccountTransaction> findFiltered(
            @Param("accountId") Long accountId,
            @Param("type") TransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
