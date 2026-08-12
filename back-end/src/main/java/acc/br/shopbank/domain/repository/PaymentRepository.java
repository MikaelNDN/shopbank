package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);

    List<Payment> findByStatus(PaymentStatus status);
}
