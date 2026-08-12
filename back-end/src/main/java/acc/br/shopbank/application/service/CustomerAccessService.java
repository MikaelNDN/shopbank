package acc.br.shopbank.application.service;

import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.CustomerAddress;
import acc.br.shopbank.domain.model.Order;
import acc.br.shopbank.domain.model.Payment;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerAddressRepository;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.OrderRepository;
import acc.br.shopbank.domain.repository.PaymentRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerAccessService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public Long currentCustomerId(UserDetails userDetails) {
        return currentCustomer(userDetails).getId();
    }

    public void assertCustomerAccess(Long customerId, UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return;
        }

        Long authenticatedCustomerId = currentCustomerId(userDetails);

        if (!authenticatedCustomerId.equals(customerId)) {
            throw new AccessDeniedException("Access denied for customer resource");
        }
    }

    public void assertUserAccess(Long userId, UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return;
        }

        if (userDetails == null) {
            throw new AccessDeniedException("Authenticated user is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equals(userDetails.getUsername())) {
            throw new AccessDeniedException("Access denied for user resource");
        }
    }

    public void assertAddressAccess(Long addressId, UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return;
        }

        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        assertCustomerAccess(address.getCustomer().getId(), userDetails);
    }

    public void assertOrderAccess(Long orderId, UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return;
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        assertCustomerAccess(order.getCustomer().getId(), userDetails);
    }

    public void assertPaymentAccess(Long paymentId, UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return;
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        assertCustomerAccess(payment.getOrder().getCustomer().getId(), userDetails);
    }

    private Customer currentCustomer(UserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authenticated user is required");
        }

        return customerRepository.findByUserEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    }

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities()
                .stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
