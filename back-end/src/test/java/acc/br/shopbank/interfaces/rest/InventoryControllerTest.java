package acc.br.shopbank.interfaces.rest;

import acc.br.shopbank.application.dto.InventoryRequest;
import acc.br.shopbank.application.dto.InventoryResponse;
import acc.br.shopbank.infrastructure.web.GlobalExceptionHandler;
import acc.br.shopbank.application.service.InventoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InventoryControllerTest {

    private MockMvc mockMvc;
    private InventoryService inventoryService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        inventoryService = Mockito.mock(InventoryService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new InventoryController(inventoryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldReserveInventory() throws Exception {
        InventoryRequest request = new InventoryRequest(1L, 2);
        InventoryResponse response = new InventoryResponse(1L, 1L, 8, 2, null);

        when(inventoryService.reserve(any(InventoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/inventory/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableQuantity").value(8))
                .andExpect(jsonPath("$.reservedQuantity").value(2));
    }

    @Test
    void shouldReturnBadRequestWhenIntegerReceivesString() throws Exception {
        String invalidJson = """
                {
                  "productId": 1,
                  "quantity": "abc"
                }
                """;

        mockMvc.perform(post("/api/inventory/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid request body"));
    }

    @Test
    void shouldReturnBadRequestWhenPathVariableHasInvalidType() throws Exception {
        mockMvc.perform(get("/api/inventory/product/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid parameter type"));
    }
}
