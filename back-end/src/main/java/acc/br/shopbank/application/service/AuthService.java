package acc.br.shopbank.application.service;

import acc.br.shopbank.application.dto.LoginRequest;
import acc.br.shopbank.application.dto.RegisterRequest;
import acc.br.shopbank.domain.model.Customer;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.repository.CustomerRepository;
import acc.br.shopbank.domain.repository.UserRepository;
import acc.br.shopbank.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public RegisterResult register(RegisterRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BusinessException("Email already exists");
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.CLIENT)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        Customer customer = Customer.builder()
                .user(savedUser)
                .fullName(request.fullName())
                .cpf(request.cpf())
                .active(true)
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        return new RegisterResult(savedUser, savedCustomer);
    }

    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException("User is inactive");
        }

        boolean validPassword = passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        );

        if (!validPassword) {
            throw new BusinessException("Invalid credentials");
        }

        return jwtService.generateToken(user);
    }

    public record RegisterResult(User user, Customer customer) {
    }
}
