package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CategoryRequest;
import acc.br.shopbank.application.dto.CategoryResponse;
import acc.br.shopbank.domain.model.Category;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    private CategoryService categoryService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        categoryService = new CategoryService(categoryRepository);
    }

    @Test
    void shouldCreateCategory() {
        CategoryRequest request = new CategoryRequest("Eletronicos", "Produtos", true);

        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(1L);
            return category;
        });

        CategoryResponse response = categoryService.create(request);

        assertEquals(1L, response.id());
        assertEquals("Eletronicos", response.name());
        assertTrue(response.active());
    }

    @Test
    void shouldFindAllCategories() {
        Category category = Category.builder().id(1L).name("Eletronicos").active(true).build();

        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<CategoryResponse> response = categoryService.findAll();

        assertEquals(1, response.size());
        assertEquals("Eletronicos", response.get(0).name());
    }

    @Test
    void shouldUpdateCategory() {
        Category category = Category.builder().id(1L).name("Old").active(true).build();
        CategoryRequest request = new CategoryRequest("New", "Desc", false);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(category)).thenReturn(category);

        CategoryResponse response = categoryService.update(1L, request);

        assertEquals("New", response.name());
        assertFalse(response.active());
    }

    @Test
    void shouldThrowWhenCategoryNotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.findById(99L));
    }

    @Test
    void shouldDeactivateCategory() {
        Category category = Category.builder().id(1L).active(true).build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        categoryService.deactivate(1L);

        assertFalse(category.getActive());
        verify(categoryRepository).save(category);
    }
}
