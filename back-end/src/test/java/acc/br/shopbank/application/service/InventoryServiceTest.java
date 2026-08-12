package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.InventoryRequest;
import acc.br.shopbank.application.dto.InventoryResponse;
import acc.br.shopbank.domain.model.Inventory;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.InventoryRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductRepository productRepository;

    private InventoryService inventoryService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        inventoryService = new InventoryService(inventoryRepository, productRepository);
    }

    @Test
    void shouldReserveStockSuccessfully() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(10)
                .reservedQuantity(2)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);

        InventoryResponse response = inventoryService.reserve(new InventoryRequest(1L, 4));

        assertEquals(6, response.availableQuantity());
        assertEquals(6, response.reservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void shouldThrowWhenStockIsInsufficient() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(2)
                .reservedQuantity(0)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));

        assertThrows(BusinessException.class,
                () -> inventoryService.reserve(new InventoryRequest(1L, 5)));

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    void shouldThrowWhenInventoryIsMissingOnReserve() {
        when(inventoryRepository.findByProductId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> inventoryService.reserve(new InventoryRequest(99L, 1)));

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    void shouldReplenishExistingStock() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(3)
                .reservedQuantity(1)
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);

        InventoryResponse response = inventoryService.replenish(new InventoryRequest(1L, 7));

        assertEquals(10, response.availableQuantity());
        assertEquals(1, response.reservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void shouldCreateInventoryWhenReplenishingNewProduct() {
        Product product = Product.builder().id(1L).name("Notebook").build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
            Inventory inventory = invocation.getArgument(0);
            inventory.setId(1L);
            return inventory;
        });

        InventoryResponse response = inventoryService.replenish(new InventoryRequest(1L, 5));

        assertEquals(1L, response.productId());
        assertEquals(5, response.availableQuantity());
        assertEquals(0, response.reservedQuantity());
        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    void shouldThrowWhenReplenishQuantityIsNegative() {
        assertThrows(BusinessException.class,
                () -> inventoryService.replenish(new InventoryRequest(1L, -1)));

        verifyNoInteractions(productRepository);
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    void shouldThrowWhenProductIsMissingOnReplenish() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> inventoryService.replenish(new InventoryRequest(99L, 1)));

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    void shouldFindInventoryByProduct() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(8)
                .reservedQuantity(2)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));

        InventoryResponse response = inventoryService.findByProductId(1L);

        assertEquals(1L, response.id());
        assertEquals(1L, response.productId());
        assertEquals(8, response.availableQuantity());
        assertEquals(2, response.reservedQuantity());
    }

    @Test
    void shouldReleaseReservedStock() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(3)
                .reservedQuantity(5)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);

        Inventory result = inventoryService.releaseReserved(1L, 2);

        assertEquals(5, result.getAvailableQuantity());
        assertEquals(3, result.getReservedQuantity());
    }

    @Test
    void shouldConfirmReservedStock() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(3)
                .reservedQuantity(5)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);

        Inventory result = inventoryService.confirmReserved(1L, 4);

        assertEquals(3, result.getAvailableQuantity());
        assertEquals(1, result.getReservedQuantity());
    }

    @Test
    void shouldThrowWhenReservedStockIsInsufficientToRelease() {
        Product product = Product.builder().id(1L).name("Notebook").build();
        Inventory inventory = Inventory.builder()
                .id(1L)
                .product(product)
                .availableQuantity(3)
                .reservedQuantity(1)
                .build();

        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));

        assertThrows(BusinessException.class, () -> inventoryService.releaseReserved(1L, 2));

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }
}
