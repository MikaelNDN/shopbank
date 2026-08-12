package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CategoryRequest;
import acc.br.shopbank.application.dto.CategoryResponse;
import acc.br.shopbank.domain.model.Category;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryResponse create(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .active(!Boolean.FALSE.equals(request.active()))
                .build();

        return toResponse(categoryRepository.save(category));
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse findById(Long id) {
        return toResponse(findCategory(id));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findCategory(id);

        category.setName(request.name());
        category.setDescription(request.description());
        category.setActive(!Boolean.FALSE.equals(request.active()));

        return toResponse(categoryRepository.save(category));
    }

    public void deactivate(Long id) {
        Category category = findCategory(id);
        category.setActive(false);
        categoryRepository.save(category);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive()
        );
    }
}
