package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.CustomerRequest;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerAccessService customerAccessService;

    @PostMapping
    public ResponseEntity<CustomerResponse> create(
            @RequestBody @Valid CustomerRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertUserAccess(request.userId(), userDetails);
        return ResponseEntity.ok(customerService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> findAll() {
        return ResponseEntity.ok(customerService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(id, userDetails);
        return ResponseEntity.ok(customerService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid CustomerRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(id, userDetails);
        return ResponseEntity.ok(customerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(id, userDetails);
        customerService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
