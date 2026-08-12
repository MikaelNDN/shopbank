package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.AuditLogResponse;
import acc.br.shopbank.domain.model.AuditLog;
import acc.br.shopbank.domain.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditLogService auditLogService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        auditLogService = new AuditLogService(auditLogRepository);
    }

    @Test
    void shouldRecordAuditLog() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            log.setId(1L);
            return log;
        });

        AuditLog log = auditLogService.record("Order", 1L, "CREATED", null, "RESERVED", 7L, "created");

        assertEquals(1L, log.getId());
        assertEquals("Order", log.getEntityName());
        assertEquals("CREATED", log.getAction());
    }

    @Test
    void shouldFindAllAuditLogs() {
        AuditLog log = AuditLog.builder()
                .id(1L)
                .entityName("Order")
                .entityId(1L)
                .action("CREATED")
                .newValue("RESERVED")
                .description("created")
                .build();

        when(auditLogRepository.findAll()).thenReturn(List.of(log));

        List<AuditLogResponse> response = auditLogService.findAll();

        assertEquals(1, response.size());
        assertEquals("Order", response.get(0).entityName());
    }
}
