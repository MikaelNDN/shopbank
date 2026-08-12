package acc.br.shopbank.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private String label;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "postal_code")
    private String postalCode;

    private String street;

    private String number;

    private String complement;

    private String district;

    private String city;

    private String state;

    private String reference;

    private Boolean favorite;

    private Boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

    }

    @PreUpdate
    public void preUpdate() {

        updatedAt = LocalDateTime.now();

    }
}