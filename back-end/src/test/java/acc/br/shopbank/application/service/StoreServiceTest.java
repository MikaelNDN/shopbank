package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.StoreRequest;
import acc.br.shopbank.application.dto.StoreResponse;
import acc.br.shopbank.domain.model.Store;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StoreServiceTest {

    @Mock
    private StoreRepository storeRepository;

    private StoreService storeService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        storeService = new StoreService(storeRepository);
    }

    @Test
    void shouldCreateStore() {
        StoreRequest request = new StoreRequest("ShopBank LTDA", "ShopBank", "123", "loja@email.com", true);

        when(storeRepository.findByCnpj("123")).thenReturn(Optional.empty());
        when(storeRepository.save(any(Store.class))).thenAnswer(invocation -> {
            Store store = invocation.getArgument(0);
            store.setId(1L);
            return store;
        });

        StoreResponse response = storeService.create(request);

        assertEquals(1L, response.id());
        assertEquals("ShopBank", response.tradeName());
        assertTrue(response.active());
    }

    @Test
    void shouldThrowWhenCnpjAlreadyExists() {
        StoreRequest request = new StoreRequest("ShopBank LTDA", "ShopBank", "123", "loja@email.com", true);

        when(storeRepository.findByCnpj("123")).thenReturn(Optional.of(new Store()));

        assertThrows(BusinessException.class, () -> storeService.create(request));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    void shouldFindAndUpdateStore() {
        Store store = Store.builder().id(1L).legalName("Old").tradeName("Old").cnpj("123").active(true).build();
        StoreRequest request = new StoreRequest("New LTDA", "New", "456", "new@email.com", false);

        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(storeRepository.save(store)).thenReturn(store);

        StoreResponse response = storeService.update(1L, request);

        assertEquals("New", response.tradeName());
        assertFalse(response.active());
        assertEquals("New", storeService.findById(1L).tradeName());
    }

    @Test
    void shouldThrowWhenStoreNotFound() {
        when(storeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> storeService.findById(99L));
    }

    @Test
    void shouldDeactivateStoreAndListAll() {
        Store store = Store.builder().id(1L).legalName("ShopBank").tradeName("ShopBank").cnpj("123").active(true).build();

        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(storeRepository.findAll()).thenReturn(List.of(store));

        storeService.deactivate(1L);

        assertFalse(store.getActive());
        assertEquals(1, storeService.findAll().size());
        verify(storeRepository).save(store);
    }
}
