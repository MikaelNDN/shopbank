package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.LoginRequest;
import acc.br.shopbank.application.dto.LoginResponse;
import acc.br.shopbank.application.dto.RegisterRequest;
import acc.br.shopbank.application.dto.UserResponse;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import acc.br.shopbank.application.service.AuthService;
import acc.br.shopbank.application.service.AuthService.RegisterResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
        RegisterResult result = authService.register(request);
        UserResponse resp = new UserResponse(
                result.user().getId(),
                result.user().getEmail(),
                result.user().getRole(),
                result.user().getActive(),
                result.customer().getId(),
                result.customer().getFullName(),
                result.customer().getCpf()
        );
        return ResponseEntity.ok(resp);
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResourceNotFoundException("Sessão inválida");
        }
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Customer customer = customerRepository.findByUserEmail(user.getEmail()).orElse(null);
        UserResponse resp = new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getActive(),
                customer != null ? customer.getId() : null,
                customer != null ? customer.getFullName() : null,
                customer != null ? customer.getCpf() : null
        );
        return ResponseEntity.ok(resp);
    }
}
