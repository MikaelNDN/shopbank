package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.WebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {

    boolean existsByProviderAndEventId(String provider, String eventId);

    Optional<WebhookLog> findByProviderAndEventId(String provider, String eventId);
}
