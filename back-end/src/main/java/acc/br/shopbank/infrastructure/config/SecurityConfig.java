package acc.br.shopbank.infrastructure.config;

import acc.br.shopbank.infrastructure.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())

                .headers(headers ->
                        headers.frameOptions(frame -> frame.sameOrigin())
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth


                        .requestMatchers(HttpMethod.POST, "/", "/webhook", "/webhook/").permitAll()

                        .requestMatchers(
                                "/api/auth/**",
                                "/api/payments/abacatepay/webhook",
                                "/api/payments/abacatepay/webhook/",
                                "/api/payments/mobile-return",
                                "/api/payments/config",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/h2-console/**"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/inventory/product/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/inventory").permitAll()

                        .requestMatchers(
                                "/api/admin/**",
                                "/api/products/**",
                                "/api/categories/**",
                                "/api/inventory/**",
                                "/api/stores/**",
                                "/api/banks/**",
                                "/api/audit-logs/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/checking-accounts").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/checking-accounts").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/checking-accounts/**").hasRole("ADMIN")

                        .requestMatchers("/api/checking-accounts/**").hasAnyRole("CLIENT", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/customers").hasRole("ADMIN")
                        .requestMatchers("/api/orders/*/status").hasRole("ADMIN")

                        .requestMatchers(
                                "/api/customers/**",
                                "/api/addresses/**",
                                "/api/orders/**",
                                "/api/payments/**"
                        ).hasAnyRole("CLIENT", "ADMIN")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }
}
