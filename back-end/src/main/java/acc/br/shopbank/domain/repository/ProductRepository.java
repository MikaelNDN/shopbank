package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

}
