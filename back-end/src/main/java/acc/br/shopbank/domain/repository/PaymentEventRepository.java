package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, Long> {
}
