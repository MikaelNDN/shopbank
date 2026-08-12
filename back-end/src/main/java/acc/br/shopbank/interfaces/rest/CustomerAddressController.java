package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.CustomerAddressRequest;
import acc.br.shopbank.application.dto.CustomerAddressResponse;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.CustomerAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/{customerId}/addresses")
@RequiredArgsConstructor
public class CustomerAddressController {

    private final CustomerAddressService addressService;
    private final CustomerAccessService customerAccessService;

    @PostMapping
    public ResponseEntity<CustomerAddressResponse> create(
            @PathVariable Long customerId,
            @RequestBody @Valid CustomerAddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(addressService.createForCustomer(customerId, request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerAddressResponse>> findByCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(addressService.findByCustomer(customerId));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<CustomerAddressResponse> update(
            @PathVariable Long customerId,
            @PathVariable Long addressId,
            @RequestBody @Valid CustomerAddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(addressService.updateForCustomer(customerId, addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long customerId,
            @PathVariable Long addressId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        addressService.deactivateForCustomer(customerId, addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{addressId}/favorite")
    public ResponseEntity<CustomerAddressResponse> setFavorite(
            @PathVariable Long customerId,
            @PathVariable Long addressId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(addressService.setFavoriteForCustomer(customerId, addressId));
    }
}
