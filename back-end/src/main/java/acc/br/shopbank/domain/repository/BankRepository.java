package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.Bank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankRepository extends JpaRepository<Bank, Long> {

    Optional<Bank> findByCode(String code);
}
