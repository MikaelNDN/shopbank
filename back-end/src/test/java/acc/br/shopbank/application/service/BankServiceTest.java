package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.BankRequest;
import acc.br.shopbank.application.dto.BankResponse;
import acc.br.shopbank.domain.model.Bank;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.BankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BankServiceTest {

    @Mock
    private BankRepository bankRepository;

    private BankService bankService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        bankService = new BankService(bankRepository);
    }

    @Test
    void shouldCreateBank() {
        BankRequest request = new BankRequest("001", "Banco do Brasil", true);

        when(bankRepository.findByCode("001")).thenReturn(Optional.empty());
        when(bankRepository.save(any(Bank.class))).thenAnswer(invocation -> {
            Bank bank = invocation.getArgument(0);
            bank.setId(1L);
            return bank;
        });

        BankResponse response = bankService.create(request);

        assertEquals(1L, response.id());
        assertEquals("001", response.code());
    }

    @Test
    void shouldThrowWhenCodeAlreadyExists() {
        BankRequest request = new BankRequest("001", "Banco do Brasil", true);

        when(bankRepository.findByCode("001")).thenReturn(Optional.of(new Bank()));

        assertThrows(BusinessException.class, () -> bankService.create(request));
    }

    @Test
    void shouldUpdateBankAndListAll() {
        Bank bank = Bank.builder().id(1L).code("001").name("Old").active(true).build();
        BankRequest request = new BankRequest("237", "Bradesco", false);

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));
        when(bankRepository.save(bank)).thenReturn(bank);
        when(bankRepository.findAll()).thenReturn(List.of(bank));

        BankResponse response = bankService.update(1L, request);

        assertEquals("237", response.code());
        assertFalse(response.active());
        assertEquals(1, bankService.findAll().size());
    }

    @Test
    void shouldThrowWhenBankNotFound() {
        when(bankRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bankService.findById(99L));
    }

    @Test
    void shouldDeactivateBank() {
        Bank bank = Bank.builder().id(1L).active(true).build();

        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));

        bankService.deactivate(1L);

        assertFalse(bank.getActive());
        verify(bankRepository).save(bank);
    }
}
