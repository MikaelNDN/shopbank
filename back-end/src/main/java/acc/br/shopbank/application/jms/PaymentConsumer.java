package acc.br.shopbank.application.jms;

import acc.br.shopbank.application.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentConsumer {

    private final PaymentService paymentService;


    @JmsListener(destination = "pagamentos.queue")
    public void onReceiver(String rawPayload) {
        try {
            log.info("Mensagem recebida da fila: {}", rawPayload);
            paymentService.processAsynchronousWebhook(rawPayload);
        } catch (Exception e) {
            log.error("Erro ao processar mensagem da fila de pagamentos", e);
            throw e;
        }
    }
}