package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.InventoryRequest;
import acc.br.shopbank.application.dto.InventoryResponse;
import acc.br.shopbank.application.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/reserve")
    public ResponseEntity<InventoryResponse> reserve(@RequestBody @Valid InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.reserve(request));
    }

    @PostMapping("/replenish")
    public ResponseEntity<InventoryResponse> replenish(@RequestBody @Valid InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.replenish(request));
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<InventoryResponse> findByProduct(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.findByProductId(id));
    }
    
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> findAll() {
        return ResponseEntity.ok(inventoryService.findAll());
    }
}
