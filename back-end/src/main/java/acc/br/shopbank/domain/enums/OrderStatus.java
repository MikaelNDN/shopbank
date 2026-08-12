package acc.br.shopbank.domain.enums;

public enum OrderStatus {
    CREATED,
    RESERVED,
    WAITING_PAYMENT,
    PAID,
    PREPARING,
    SHIPPED,
    DELIVERED,
    CANCELED
}
