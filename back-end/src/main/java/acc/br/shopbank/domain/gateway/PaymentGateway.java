package acc.br.shopbank.domain.gateway;

import acc.br.shopbank.domain.model.Order;

public interface PaymentGateway {

    PaymentGatewayPreference createPreference(Order order);

    PaymentGatewayPayment findPayment(String gatewayPaymentId);
}
