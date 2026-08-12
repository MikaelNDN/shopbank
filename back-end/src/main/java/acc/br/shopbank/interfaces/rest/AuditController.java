package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.AuditLogResponse;
import acc.br.shopbank.application.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> findAll() {
        return ResponseEntity.ok(auditLogService.findAll());
    }
}
