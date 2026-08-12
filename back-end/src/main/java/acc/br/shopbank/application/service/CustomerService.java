package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.CustomerRequest;
import acc.br.shopbank.application.dto.CustomerResponse;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public CustomerResponse create(CustomerRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Customer customer = Customer.builder()
                .user(user)
                .fullName(request.fullName())
                .cpf(request.cpf())
                .phone(request.phone())
                .birthDate(request.birthDate())
                .marketingOptIn(request.marketingOptIn())
                .active(true)
                .build();

        return toResponse(customerRepository.save(customer));
    }

    public List<CustomerResponse> findAll() {
        return customerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerResponse findById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        return toResponse(customer);
    }

    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        customer.setUser(user);
        customer.setFullName(request.fullName());
        customer.setCpf(request.cpf());
        customer.setPhone(request.phone());
        customer.setBirthDate(request.birthDate());
        customer.setMarketingOptIn(request.marketingOptIn());

        return toResponse(customerRepository.save(customer));
    }

    public void deactivate(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        customer.setActive(false);
        customerRepository.save(customer);
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getUser().getId(),
                customer.getFullName(),
                customer.getCpf(),
                customer.getPhone(),
                customer.getBirthDate(),
                customer.getMarketingOptIn(),
                customer.getActive()
        );
    }
}
