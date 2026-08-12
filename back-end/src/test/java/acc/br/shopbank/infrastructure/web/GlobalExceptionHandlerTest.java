package acc.br.shopbank.infrastructure.web;

import acc.br.shopbank.domain.exception.BusinessException;
import acc.br.shopbank.domain.exception.ResourceNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldHandleDomainAndSecurityExceptions() {
        assertError(handler.handleBusiness(new BusinessException("business")), HttpStatus.BAD_REQUEST,
                "Business rule error", "business");
        assertError(handler.handleNotFound(new ResourceNotFoundException("missing")), HttpStatus.NOT_FOUND,
                "Resource not found", "missing");
        assertError(handler.handleAccessDenied(new AccessDeniedException("denied")), HttpStatus.FORBIDDEN,
                "Access denied", "denied");
    }

    @Test
    void shouldHandleRequestValidationErrors() throws Exception {
        var bindingResult = new BeanPropertyBindingResult(new ValidationPayload(""), "payload");
        bindingResult.addError(new FieldError("payload", "name", "must not be blank"));
        var parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getDeclaredMethod("validate", ValidationPayload.class),
                0
        );

        var response = handler.handleValidation(new MethodArgumentNotValidException(parameter, bindingResult));

        assertError(response, HttpStatus.BAD_REQUEST, "Validation error", "name: must not be blank");
    }

    @Test
    void shouldHandleBadBodyParametersConstraintAndGenericErrors() {
        assertError(handler.handleInvalidBody(new HttpMessageNotReadableException("bad body")),
                HttpStatus.BAD_REQUEST, "Invalid request body", "Request body has an invalid format or type");

        assertError(handler.handleTypeMismatch(new MethodArgumentTypeMismatchException(
                        "abc", Long.class, "id", null, new IllegalArgumentException("bad id"))),
                HttpStatus.BAD_REQUEST, "Invalid parameter type", "id has an invalid type");

        assertError(handler.handleConstraintViolation(new ConstraintViolationException("invalid field", Set.of())),
                HttpStatus.BAD_REQUEST, "Validation error", "invalid field");

        assertError(handler.handleGeneric(new RuntimeException("boom")),
                HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "boom");
    }

    @SuppressWarnings("unused")
    private void validate(ValidationPayload payload) {
    }

    private record ValidationPayload(String name) {
    }

    private void assertError(org.springframework.http.ResponseEntity<Map<String, Object>> response,
                             HttpStatus status,
                             String error,
                             String message) {
        assertEquals(status, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(status.value(), response.getBody().get("status"));
        assertEquals(error, response.getBody().get("error"));
        assertEquals(message, response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
    }
}
