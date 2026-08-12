package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.InventoryRequest;
import acc.br.shopbank.application.dto.InventoryResponse;
import acc.br.shopbank.domain.model.Inventory;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.InventoryRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryResponse reserve(InventoryRequest request) {
        return toResponse(reserve(request.productId(), request.quantity()));
    }

    public Inventory reserve(Long productId, Integer requestedQuantity) {
        int quantity = validateQuantity(requestedQuantity);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        if (inventory.getAvailableQuantity() < quantity) {
            throw new BusinessException("Insufficient stock");
        }

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);

        return inventoryRepository.save(inventory);
    }

    public InventoryResponse replenish(InventoryRequest request) {
        int quantity = validateQuantity(request.quantity());

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Inventory inventory = inventoryRepository.findByProductId(request.productId())
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .build());

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);

        return toResponse(inventoryRepository.save(inventory));
    }

    public Inventory releaseReserved(Long productId, Integer requestedQuantity) {
        int quantity = validateQuantity(requestedQuantity);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        if (inventory.getReservedQuantity() < quantity) {
            throw new BusinessException("Reserved stock is insufficient");
        }

        inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);

        return inventoryRepository.save(inventory);
    }

    public Inventory confirmReserved(Long productId, Integer requestedQuantity) {
        int quantity = validateQuantity(requestedQuantity);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        if (inventory.getReservedQuantity() < quantity) {
            throw new BusinessException("Reserved stock is insufficient");
        }

        inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);

        return inventoryRepository.save(inventory);
    }

    @Transactional(readOnly = true)
    public InventoryResponse findByProductId(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        return toResponse(inventory);
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> findAll() {
        return inventoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private int validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Quantity must be greater than zero");
        }

        return quantity;
    }

    private InventoryResponse toResponse(Inventory inventory) {
        return new InventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getAvailableQuantity(),
                inventory.getReservedQuantity(),
                inventory.getUpdatedAt()
        );
    }
}
