package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.ProductRequest;
import acc.br.shopbank.application.dto.ProductResponse;
import acc.br.shopbank.domain.model.Category;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CategoryRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import acc.br.shopbank.domain.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private StoreRepository storeRepository;

    private ProductService productService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        productService = new ProductService(productRepository, categoryRepository, storeRepository);
    }

    @Test
    void shouldCreateProduct() {
        Category cat = Category.builder().id(1L).name("Cat").build();

        ProductRequest req = new ProductRequest(1L, 10L, "Prod", "Desc", new BigDecimal("9.90"), null, true);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(storeRepository.existsById(10L)).thenReturn(true);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        ProductResponse resp = productService.create(req);

        assertNotNull(resp);
        assertEquals("Prod", resp.name());
        assertEquals(1L, resp.categoryId());
    }

    @Test
    void shouldThrowWhenCategoryNotFound() {
        ProductRequest req = new ProductRequest(99L, 10L, "Prod", "Desc", new BigDecimal("9.90"), null, true);

        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.create(req));
    }

    @Test
    void shouldThrowWhenStoreNotFound() {
        Category cat = Category.builder().id(1L).name("Cat").build();
        ProductRequest req = new ProductRequest(1L, 99L, "Prod", "Desc", new BigDecimal("9.90"), null, true);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(storeRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> productService.create(req));
    }

    @Test
    void shouldThrowWhenPriceIsInvalid() {
        ProductRequest req = new ProductRequest(1L, 10L, "Prod", "Desc", BigDecimal.ZERO, null, true);

        assertThrows(RuntimeException.class, () -> productService.create(req));

        verifyNoInteractions(categoryRepository);
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void shouldFindAllProducts() {
        Category cat = Category.builder().id(1L).name("Cat").build();
        Product p = Product.builder().id(1L).category(cat).name("Prod").price(new BigDecimal("5.00")).build();

        when(productRepository.findAll()).thenReturn(List.of(p));

        List<ProductResponse> list = productService.findAll();

        assertEquals(1, list.size());
        assertEquals("Prod", list.get(0).name());
    }

    @Test
    void shouldFindProductById() {
        Category cat = Category.builder().id(1L).name("Cat").build();
        Product p = Product.builder().id(1L).category(cat).name("Prod").build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(p));

        ProductResponse resp = productService.findById(1L);

        assertEquals(1L, resp.id());
        assertEquals("Prod", resp.name());
    }

    @Test
    void shouldUpdateProduct() {
        Category cat = Category.builder().id(2L).name("New Cat").build();
        Product product = Product.builder()
                .id(1L)
                .category(Category.builder().id(1L).build())
                .storeId(10L)
                .name("Old")
                .price(new BigDecimal("5.00"))
                .active(true)
                .build();
        ProductRequest req = new ProductRequest(2L, 20L, "New", "New Desc", new BigDecimal("15.00"), "img", true);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(cat));
        when(storeRepository.existsById(20L)).thenReturn(true);
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.update(1L, req);

        assertEquals("New", response.name());
        assertEquals(2L, response.categoryId());
        assertEquals(20L, response.storeId());
    }

    @Test
    void shouldDeactivateProduct() {
        Product product = Product.builder().id(1L).active(true).build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        productService.deactivate(1L);

        assertFalse(product.getActive());
        verify(productRepository).save(product);
    }
}
