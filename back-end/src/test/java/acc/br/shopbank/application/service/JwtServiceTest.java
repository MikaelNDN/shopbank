package acc.br.shopbank.application.service;

import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService();

    @Test
    void shouldGenerateValidToken() {
        User user = User.builder()
                .email("cliente@email.com")
                .role(UserRole.CLIENT)
                .build();

        String token = jwtService.generateToken(user);

        assertNotNull(token);
        assertTrue(jwtService.isValid(token));
    }

    @Test
    void shouldExtractEmailFromToken() {
        User user = User.builder()
                .email("cliente@email.com")
                .role(UserRole.CLIENT)
                .build();

        String token = jwtService.generateToken(user);

        assertEquals("cliente@email.com", jwtService.extractEmail(token));
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        assertFalse(jwtService.isValid("invalid-token"));
    }
}