package acc.br.shopbank.infrastructure.security;

import acc.br.shopbank.domain.enums.UserRole;
import acc.br.shopbank.domain.model.User;
import acc.br.shopbank.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CustomUserDetailsServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final CustomUserDetailsService service = new CustomUserDetailsService(userRepository);

    @Test
    void shouldLoadActiveUserWithRoleAuthority() {
        User user = User.builder()
                .email("cliente@email.com")
                .passwordHash("hash")
                .role(UserRole.CLIENT)
                .active(true)
                .build();

        when(userRepository.findByEmail("cliente@email.com")).thenReturn(Optional.of(user));

        var details = service.loadUserByUsername("cliente@email.com");

        assertEquals("cliente@email.com", details.getUsername());
        assertEquals("hash", details.getPassword());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_CLIENT")));
    }

    @Test
    void shouldExposeInactiveUserAsDisabled() {
        User user = User.builder()
                .email("admin@email.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .active(false)
                .build();

        when(userRepository.findByEmail("admin@email.com")).thenReturn(Optional.of(user));

        var details = service.loadUserByUsername("admin@email.com");

        assertFalse(details.isEnabled());
        assertTrue(details.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void shouldThrowWhenUserDoesNotExist() {
        when(userRepository.findByEmail("missing@email.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing@email.com"));
    }
}
