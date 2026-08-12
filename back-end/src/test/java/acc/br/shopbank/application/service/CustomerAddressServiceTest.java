package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CustomerAddressRequest;
import acc.br.shopbank.application.dto.CustomerAddressResponse;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.CustomerAddress;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerAddressRepository;
import acc.br.shopbank.domain.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerAddressServiceTest {

    @Mock
    private CustomerAddressRepository addressRepository;

    @Mock
    private CustomerRepository customerRepository;

    private CustomerAddressService service;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        service = new CustomerAddressService(addressRepository, customerRepository);
    }

    @Test
    void shouldCreateAddressSuccessfully() {
        Customer customer = Customer.builder()
                .id(1L)
                .fullName("Maria Silva")
                .build();

        CustomerAddressRequest request = new CustomerAddressRequest(
                1L,
                "Casa",
                "Maria Silva",
                "58015000",
                "Rua Teste",
                "100",
                "Apto 101",
                "Centro",
                "Campina Grande",
                "PB",
                "Próximo ao mercado",
                false
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));

        when(addressRepository.save(any(CustomerAddress.class)))
                .thenAnswer(invocation -> {
                    CustomerAddress address = invocation.getArgument(0);
                    address.setId(1L);
                    return address;
                });

        CustomerAddressResponse response = service.create(request);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals(1L, response.customerId());
        assertEquals("Casa", response.label());
        assertEquals("58015000", response.postalCode());
        assertFalse(response.favorite());
        assertTrue(response.active());

        verify(addressRepository).save(any(CustomerAddress.class));
    }

    @Test
    void shouldCreateFavoriteAddressAndRemoveOldFavorites() {
        Customer customer = Customer.builder()
                .id(1L)
                .fullName("Maria Silva")
                .build();

        CustomerAddress oldFavorite = CustomerAddress.builder()
                .id(10L)
                .customer(customer)
                .label("Antigo")
                .favorite(true)
                .active(true)
                .build();

        CustomerAddressRequest request = new CustomerAddressRequest(
                1L,
                "Trabalho",
                "Maria Silva",
                "58015000",
                "Rua Empresa",
                "500",
                "Sala 12",
                "Centro",
                "Campina Grande",
                "PB",
                "Próximo ao banco",
                true
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(addressRepository.findByCustomerId(1L)).thenReturn(List.of(oldFavorite));

        when(addressRepository.save(any(CustomerAddress.class)))
                .thenAnswer(invocation -> {
                    CustomerAddress address = invocation.getArgument(0);
                    address.setId(2L);
                    return address;
                });

        CustomerAddressResponse response = service.create(request);

        assertNotNull(response);
        assertEquals(2L, response.id());
        assertTrue(response.favorite());
        assertFalse(oldFavorite.getFavorite());

        verify(addressRepository).saveAll(List.of(oldFavorite));
        verify(addressRepository).save(any(CustomerAddress.class));
    }

    @Test
    void shouldThrowWhenCustomerNotFoundOnCreate() {
        CustomerAddressRequest request = new CustomerAddressRequest(
                99L,
                "Casa",
                "Maria Silva",
                "58015000",
                "Rua Teste",
                "100",
                null,
                "Centro",
                "Campina Grande",
                "PB",
                null,
                false
        );

        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(request));

        verify(addressRepository, never()).save(any(CustomerAddress.class));
    }

    @Test
    void shouldFindAddressesByCustomer() {
        Customer customer = Customer.builder()
                .id(1L)
                .fullName("Maria Silva")
                .build();

        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .label("Casa")
                .recipientName("Maria Silva")
                .postalCode("58015000")
                .street("Rua Teste")
                .number("100")
                .complement("Apto 101")
                .district("Centro")
                .city("Campina Grande")
                .state("PB")
                .reference("Próximo ao mercado")
                .favorite(true)
                .active(true)
                .build();

        when(addressRepository.findByCustomerId(1L)).thenReturn(List.of(address));

        List<CustomerAddressResponse> response = service.findByCustomer(1L);

        assertEquals(1, response.size());
        assertEquals("Casa", response.get(0).label());
        assertTrue(response.get(0).favorite());
    }

    @Test
    void shouldSetAddressAsFavorite() {
        Customer customer = Customer.builder()
                .id(1L)
                .fullName("Maria Silva")
                .build();

        CustomerAddress address1 = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .label("Casa")
                .favorite(true)
                .active(true)
                .build();

        CustomerAddress address2 = CustomerAddress.builder()
                .id(2L)
                .customer(customer)
                .label("Trabalho")
                .favorite(false)
                .active(true)
                .build();

        when(addressRepository.findById(2L)).thenReturn(Optional.of(address2));
        when(addressRepository.findByCustomerId(1L)).thenReturn(List.of(address1, address2));

        when(addressRepository.save(address2)).thenReturn(address2);

        CustomerAddressResponse response = service.setFavorite(2L);

        assertEquals(2L, response.id());
        assertTrue(response.favorite());
        assertFalse(address1.getFavorite());

        verify(addressRepository).saveAll(List.of(address1, address2));
        verify(addressRepository).save(address2);
    }

    @Test
    void shouldThrowWhenAddressNotFoundOnSetFavorite() {
        when(addressRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.setFavorite(99L));

        verify(addressRepository, never()).save(any(CustomerAddress.class));
    }

    @Test
    void shouldThrowWhenInactiveAddressBecomesFavorite() {
        Customer customer = Customer.builder().id(1L).build();
        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .active(false)
                .favorite(false)
                .build();

        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));

        assertThrows(RuntimeException.class, () -> service.setFavorite(1L));

        verify(addressRepository, never()).save(address);
    }

    @Test
    void shouldUpdateAddress() {
        Customer customer = Customer.builder().id(1L).fullName("Maria Silva").build();
        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .label("Casa")
                .favorite(false)
                .active(true)
                .build();
        CustomerAddressRequest request = new CustomerAddressRequest(
                1L,
                "Trabalho",
                "Maria Silva",
                "58015000",
                "Rua Empresa",
                "500",
                "Sala 12",
                "Centro",
                "Campina Grande",
                "PB",
                "Referencia",
                true
        );

        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(addressRepository.findByCustomerId(1L)).thenReturn(List.of(address));
        when(addressRepository.save(address)).thenReturn(address);

        CustomerAddressResponse response = service.update(1L, request);

        assertEquals("Trabalho", response.label());
        assertEquals("58015000", response.postalCode());
        assertTrue(response.favorite());
    }

    @Test
    void shouldThrowWhenUpdatingAddressFromAnotherCustomer() {
        Customer customer = Customer.builder().id(1L).build();
        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .active(true)
                .build();
        CustomerAddressRequest request = new CustomerAddressRequest(
                2L,
                "Casa",
                "Maria",
                "58015000",
                "Rua",
                "10",
                null,
                "Centro",
                "Campina Grande",
                "PB",
                null,
                false
        );

        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));

        assertThrows(RuntimeException.class, () -> service.update(1L, request));
    }

    @Test
    void shouldDeactivateAddress() {
        Customer customer = Customer.builder().id(1L).build();
        CustomerAddress address = CustomerAddress.builder()
                .id(1L)
                .customer(customer)
                .active(true)
                .favorite(true)
                .build();

        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));

        service.deactivate(1L);

        assertFalse(address.getActive());
        assertFalse(address.getFavorite());
        verify(addressRepository).save(address);
    }
}
