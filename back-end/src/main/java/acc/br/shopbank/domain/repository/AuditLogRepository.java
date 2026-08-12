package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
