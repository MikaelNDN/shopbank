package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findByCnpj(String cnpj);
}
