package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.BankRequest;
import acc.br.shopbank.application.dto.BankResponse;
import acc.br.shopbank.domain.model.Bank;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.BankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankRepository bankRepository;

    public BankResponse create(BankRequest request) {
        bankRepository.findByCode(request.code())
                .ifPresent(bank -> {
                    throw new BusinessException("Bank code already exists");
                });

        Bank bank = Bank.builder()
                .code(request.code())
                .name(request.name())
                .active(!Boolean.FALSE.equals(request.active()))
                .build();

        return toResponse(bankRepository.save(bank));
    }

    public List<BankResponse> findAll() {
        return bankRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BankResponse findById(Long id) {
        return toResponse(findBank(id));
    }

    public BankResponse update(Long id, BankRequest request) {
        Bank bank = findBank(id);
        bank.setCode(request.code());
        bank.setName(request.name());
        bank.setActive(!Boolean.FALSE.equals(request.active()));

        return toResponse(bankRepository.save(bank));
    }

    public void deactivate(Long id) {
        Bank bank = findBank(id);
        bank.setActive(false);
        bankRepository.save(bank);
    }

    private Bank findBank(Long id) {
        return bankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found"));
    }

    private BankResponse toResponse(Bank bank) {
        return new BankResponse(
                bank.getId(),
                bank.getCode(),
                bank.getName(),
                bank.getActive()
        );
    }
}
