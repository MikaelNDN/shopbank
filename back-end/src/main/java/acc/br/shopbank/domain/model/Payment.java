package acc.br.shopbank.domain.model;

import acc.br.shopbank.domain.enums.PaymentMethod;
import acc.br.shopbank.domain.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "gateway_preference_id")
    private String gatewayPreferenceId;

    @Column(name = "gateway_payment_id")
    private String gatewayPaymentId;

    @Column(name = "checkout_url", length = 2000)
    private String checkoutUrl;

    @Column(name = "qr_code", length = 4000)
    private String qrCode;

    @Lob
    @Column(name = "qr_code_base64")
    private String qrCodeBase64;

    @Column(name = "boleto_url", length = 2000)
    private String boletoUrl;

    @Column(name = "status_detail", length = 200)
    private String statusDetail;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

}
