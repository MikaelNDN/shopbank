package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.AuditLogResponse;
import acc.br.shopbank.domain.model.AuditLog;
import acc.br.shopbank.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog record(
            String entityName,
            Long entityId,
            String action,
            String oldValue,
            String newValue,
            Long userId,
            String description
    ) {
        AuditLog log = AuditLog.builder()
                .entityName(entityName)
                .entityId(entityId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .userId(userId)
                .description(description)
                .build();

        return auditLogRepository.save(log);
    }

    public List<AuditLogResponse> findAll() {
        return auditLogRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getEntityName(),
                log.getEntityId(),
                log.getAction(),
                log.getOldValue(),
                log.getNewValue(),
                log.getUserId(),
                log.getDescription(),
                log.getCreatedAt()
        );
    }
}
