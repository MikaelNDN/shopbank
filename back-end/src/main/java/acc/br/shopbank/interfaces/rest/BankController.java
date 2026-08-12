package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.BankRequest;
import acc.br.shopbank.application.dto.BankResponse;
import acc.br.shopbank.application.service.BankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BankController {

    private final BankService bankService;

    @PostMapping
    public ResponseEntity<BankResponse> create(@RequestBody @Valid BankRequest request) {
        return ResponseEntity.ok(bankService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<BankResponse>> findAll() {
        return ResponseEntity.ok(bankService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BankResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(bankService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BankResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid BankRequest request
    ) {
        return ResponseEntity.ok(bankService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bankService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
