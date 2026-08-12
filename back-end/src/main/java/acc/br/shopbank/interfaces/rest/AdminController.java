package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.AdminDashboardResponse;
import acc.br.shopbank.application.dto.AdminInventoryResponse;
import acc.br.shopbank.application.dto.AdminReportResponse;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.application.service.AdminService;
import acc.br.shopbank.application.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CustomerService customerService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> dashboard(
            @RequestParam(defaultValue = "30d") String period
    ) {
        return ResponseEntity.ok(adminService.dashboard(period));
    }

    @GetMapping("/reports")
    public ResponseEntity<AdminReportResponse> reports() {
        return ResponseEntity.ok(adminService.reports());
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponse>> customers() {
        return ResponseEntity.ok(customerService.findAll());
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<AdminInventoryResponse>> inventory() {
        return ResponseEntity.ok(adminService.inventory());
    }
}
