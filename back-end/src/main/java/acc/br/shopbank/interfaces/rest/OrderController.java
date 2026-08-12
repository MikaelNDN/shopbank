package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.CreateOrderRequest;
import acc.br.shopbank.application.dto.OrderResponse;
import acc.br.shopbank.application.dto.OrderStatusRequest;
import acc.br.shopbank.application.service.CustomerAccessService;
import acc.br.shopbank.application.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CustomerAccessService customerAccessService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @RequestBody @Valid CreateOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(request.customerId(), userDetails);
        return ResponseEntity.ok(orderService.create(request));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderResponse>> findByCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertCustomerAccess(customerId, userDetails);
        return ResponseEntity.ok(orderService.findByCustomer(customerId));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> findMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.findMyOrders(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(id, userDetails);
        return ResponseEntity.ok(orderService.findById(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        customerAccessService.assertOrderAccess(id, userDetails);
        return ResponseEntity.ok(orderService.cancel(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid OrderStatusRequest request
    ) {
        return ResponseEntity.ok(orderService.updateStatus(id, request));
    }
}
