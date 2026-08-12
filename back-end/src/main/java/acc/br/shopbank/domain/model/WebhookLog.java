package acc.br.shopbank.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String provider;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "event_type")
    private String eventType;

    @Column(length = 4000)
    private String payload;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    private Boolean processed;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    public void prePersist() {
        receivedAt = LocalDateTime.now();
        processed = processed == null ? Boolean.FALSE : processed;
    }
}
