package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.AccountTransactionResponse;
import acc.br.shopbank.application.dto.AmountRequest;
import acc.br.shopbank.application.dto.CheckingAccountRequest;
import acc.br.shopbank.application.dto.CheckingAccountResponse;
import acc.br.shopbank.application.service.CheckingAccountService;
import acc.br.shopbank.domain.enums.TransactionType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/checking-accounts")
@RequiredArgsConstructor
public class CheckingAccountController {

    private final CheckingAccountService checkingAccountService;

    @PostMapping
    public ResponseEntity<CheckingAccountResponse> create(@RequestBody @Valid CheckingAccountRequest request) {
        return ResponseEntity.ok(checkingAccountService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CheckingAccountResponse>> findAll() {
        return ResponseEntity.ok(checkingAccountService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CheckingAccountResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(checkingAccountService.findById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<CheckingAccountResponse> findByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(checkingAccountService.findByCustomerId(customerId));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<AccountTransactionResponse>> findTransactions(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) TransactionType type
    ) {
        if (from == null && to == null && type == null) {
            return ResponseEntity.ok(checkingAccountService.findTransactions(id));
        }
        return ResponseEntity.ok(checkingAccountService.findTransactions(id, from, to, type));
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<CheckingAccountResponse> deposit(
            @PathVariable Long id,
            @RequestBody @Valid AmountRequest request
    ) {
        return ResponseEntity.ok(checkingAccountService.deposit(id, request.amount(), request.description()));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<CheckingAccountResponse> withdraw(
            @PathVariable Long id,
            @RequestBody @Valid AmountRequest request
    ) {
        return ResponseEntity.ok(checkingAccountService.withdraw(id, request.amount(), request.description()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        checkingAccountService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
