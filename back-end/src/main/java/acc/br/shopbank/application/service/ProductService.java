package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.ProductRequest;
import acc.br.shopbank.application.dto.ProductResponse;
import acc.br.shopbank.application.dto.CategoryResponse;
import acc.br.shopbank.domain.model.Category;
import acc.br.shopbank.domain.model.Product;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CategoryRepository;
import acc.br.shopbank.domain.repository.ProductRepository;
import acc.br.shopbank.domain.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;

    public ProductResponse create(ProductRequest request) {
        validatePrice(request.price());

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        validateStore(request.storeId());

        Product p = Product.builder()
                .category(category)
                .storeId(request.storeId())
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .imageUrl(request.imageUrl())
                .active(!Boolean.FALSE.equals(request.active()))
                .build();

        return toResponse(productRepository.save(p));
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse findById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return toResponse(p);
    }

    public ProductResponse update(Long id, ProductRequest request) {
        validatePrice(request.price());

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        validateStore(request.storeId());

        product.setCategory(category);
        product.setStoreId(request.storeId());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());
        product.setActive(!Boolean.FALSE.equals(request.active()));

        return toResponse(productRepository.save(product));
    }

    public void deactivate(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setActive(false);
        productRepository.save(product);
    }

    private void validateStore(Long storeId) {
        if (!storeRepository.existsById(storeId)) {
            throw new ResourceNotFoundException("Store not found");
        }
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Product price must be greater than zero");
        }
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getCategory() == null ? null : p.getCategory().getId(),
                p.getStoreId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getImageUrl(),
                p.getActive()
        );
    }
}
