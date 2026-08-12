package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.CustomerAddressRequest;
import acc.br.shopbank.application.dto.CustomerAddressResponse;
import acc.br.shopbank.application.dto.ViaCepResponse;
import acc.br.shopbank.infrastructure.integration.cep.ViaCepClient;
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
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final ViaCepClient viaCepClient;
    private final CustomerAddressService addressService;
    private final CustomerAccessService customerAccessService;

    @GetMapping("/postal-code/{postalCode}")
    public ResponseEntity<ViaCepResponse> findByPostalCode(
            @PathVariable String postalCode
    ) {
        return ResponseEntity.ok(viaCepClient.findAddress(postalCode));
    }

    @PostMapping
    public ResponseEntity<CustomerAddressResponse> create(
            @RequestBody @Valid CustomerAddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(request.customerId(), userDetails);
        return ResponseEntity.ok(addressService.create(request));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomerAddressResponse>> findByCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(addressService.findByCustomer(customerId));
    }

    @PatchMapping("/{addressId}/favorite")
    public ResponseEntity<CustomerAddressResponse> setFavorite(
            @PathVariable Long addressId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertAddressAccess(addressId, userDetails);
        return ResponseEntity.ok(addressService.setFavorite(addressId));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<CustomerAddressResponse> update(
            @PathVariable Long addressId,
            @RequestBody @Valid CustomerAddressRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertAddressAccess(addressId, userDetails);
        return ResponseEntity.ok(addressService.update(addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long addressId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertAddressAccess(addressId, userDetails);
        addressService.deactivate(addressId);
        return ResponseEntity.noContent().build();
    }
}
