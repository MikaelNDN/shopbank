package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.StoreRequest;
import acc.br.shopbank.application.dto.StoreResponse;
import acc.br.shopbank.domain.model.Store;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    public StoreResponse create(StoreRequest request) {
        storeRepository.findByCnpj(request.cnpj())
                .ifPresent(store -> {
                    throw new BusinessException("Store CNPJ already exists");
                });

        Store store = Store.builder()
                .legalName(request.legalName())
                .tradeName(request.tradeName())
                .cnpj(request.cnpj())
                .email(request.email())
                .active(!Boolean.FALSE.equals(request.active()))
                .build();

        return toResponse(storeRepository.save(store));
    }

    public List<StoreResponse> findAll() {
        return storeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public StoreResponse findById(Long id) {
        return toResponse(findStore(id));
    }

    public StoreResponse update(Long id, StoreRequest request) {
        Store store = findStore(id);

        store.setLegalName(request.legalName());
        store.setTradeName(request.tradeName());
        store.setCnpj(request.cnpj());
        store.setEmail(request.email());
        store.setActive(!Boolean.FALSE.equals(request.active()));

        return toResponse(storeRepository.save(store));
    }

    public void deactivate(Long id) {
        Store store = findStore(id);
        store.setActive(false);
        storeRepository.save(store);
    }

    private Store findStore(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
    }

    private StoreResponse toResponse(Store store) {
        return new StoreResponse(
                store.getId(),
                store.getLegalName(),
                store.getTradeName(),
                store.getCnpj(),
                store.getEmail(),
                store.getActive()
        );
    }
}
