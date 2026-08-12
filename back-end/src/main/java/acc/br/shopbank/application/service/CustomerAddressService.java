package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CustomerAddressRequest;
import acc.br.shopbank.application.dto.CustomerAddressResponse;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.CustomerAddress;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerAddressRepository;
import acc.br.shopbank.domain.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAddressService {

    private final CustomerAddressRepository addressRepository;
    private final CustomerRepository customerRepository;

    public CustomerAddressResponse create(CustomerAddressRequest request) {

        if (request.customerId() == null) {
            throw new BusinessException("Customer is required");
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (Boolean.TRUE.equals(request.favorite())) {
            removeFavoriteFromCustomerAddresses(customer.getId());
        }

        CustomerAddress address = CustomerAddress.builder()
                .customer(customer)
                .label(request.label())
                .recipientName(request.recipientName())
                .postalCode(request.postalCode())
                .street(request.street())
                .number(request.number())
                .complement(request.complement())
                .district(request.district())
                .city(request.city())
                .state(request.state())
                .reference(request.reference())
                .favorite(Boolean.TRUE.equals(request.favorite()))
                .active(true)
                .build();

        return toResponse(addressRepository.save(address));
    }

    public CustomerAddressResponse createForCustomer(Long customerId, CustomerAddressRequest request) {
        return create(new CustomerAddressRequest(
                customerId,
                request.label(),
                request.recipientName(),
                request.postalCode(),
                request.street(),
                request.number(),
                request.complement(),
                request.district(),
                request.city(),
                request.state(),
                request.reference(),
                request.favorite()
        ));
    }

    public List<CustomerAddressResponse> findByCustomer(Long customerId) {
        return addressRepository.findByCustomerId(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerAddressResponse setFavorite(Long addressId) {

        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!Boolean.TRUE.equals(address.getActive())) {
            throw new BusinessException("Inactive address cannot be favorite");
        }

        removeFavoriteFromCustomerAddresses(address.getCustomer().getId());

        address.setFavorite(true);

        return toResponse(addressRepository.save(address));
    }

    public CustomerAddressResponse setFavoriteForCustomer(Long customerId, Long addressId) {
        CustomerAddress address = findAddressForCustomer(customerId, addressId);

        if (!Boolean.TRUE.equals(address.getActive())) {
            throw new BusinessException("Inactive address cannot be favorite");
        }

        removeFavoriteFromCustomerAddresses(customerId);

        address.setFavorite(true);

        return toResponse(addressRepository.save(address));
    }

    public CustomerAddressResponse update(Long addressId, CustomerAddressRequest request) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getCustomer().getId().equals(request.customerId())) {
            throw new BusinessException("Address does not belong to customer");
        }

        if (Boolean.TRUE.equals(request.favorite())) {
            removeFavoriteFromCustomerAddresses(request.customerId());
        }

        address.setLabel(request.label());
        address.setRecipientName(request.recipientName());
        address.setPostalCode(request.postalCode());
        address.setStreet(request.street());
        address.setNumber(request.number());
        address.setComplement(request.complement());
        address.setDistrict(request.district());
        address.setCity(request.city());
        address.setState(request.state());
        address.setReference(request.reference());
        address.setFavorite(Boolean.TRUE.equals(request.favorite()));

        return toResponse(addressRepository.save(address));
    }

    public CustomerAddressResponse updateForCustomer(Long customerId, Long addressId, CustomerAddressRequest request) {
        findAddressForCustomer(customerId, addressId);

        return update(addressId, new CustomerAddressRequest(
                customerId,
                request.label(),
                request.recipientName(),
                request.postalCode(),
                request.street(),
                request.number(),
                request.complement(),
                request.district(),
                request.city(),
                request.state(),
                request.reference(),
                request.favorite()
        ));
    }

    public void deactivate(Long addressId) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        address.setActive(false);
        address.setFavorite(false);
        addressRepository.save(address);
    }

    public void deactivateForCustomer(Long customerId, Long addressId) {
        findAddressForCustomer(customerId, addressId);
        deactivate(addressId);
    }

    private void removeFavoriteFromCustomerAddresses(Long customerId) {
        List<CustomerAddress> addresses = addressRepository.findByCustomerId(customerId);

        addresses.stream()
                .filter(address -> Boolean.TRUE.equals(address.getActive()))
                .forEach(address -> address.setFavorite(false));

        addressRepository.saveAll(addresses);
    }

    private CustomerAddress findAddressForCustomer(Long customerId, Long addressId) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("Address does not belong to customer");
        }

        return address;
    }

    private CustomerAddressResponse toResponse(CustomerAddress address) {
        return new CustomerAddressResponse(
                address.getId(),
                address.getCustomer().getId(),
                address.getLabel(),
                address.getRecipientName(),
                address.getPostalCode(),
                address.getStreet(),
                address.getNumber(),
                address.getComplement(),
                address.getDistrict(),
                address.getCity(),
                address.getState(),
                address.getReference(),
                address.getFavorite(),
                address.getActive()
        );
    }
}
