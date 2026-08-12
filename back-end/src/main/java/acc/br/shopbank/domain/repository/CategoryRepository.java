package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}
