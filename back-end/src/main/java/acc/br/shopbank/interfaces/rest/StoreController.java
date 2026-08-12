package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.StoreRequest;
import acc.br.shopbank.application.dto.StoreResponse;
import acc.br.shopbank.application.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping
    public ResponseEntity<StoreResponse> create(@RequestBody @Valid StoreRequest request) {
        return ResponseEntity.ok(storeService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> findAll() {
        return ResponseEntity.ok(storeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoreResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoreResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid StoreRequest request
    ) {
        return ResponseEntity.ok(storeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        storeService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
