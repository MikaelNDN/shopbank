package acc.br.shopbank.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_shipping_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderShippingAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(name = "customer_address_id_origin")
    private Long customerAddressIdOrigin;

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
}
