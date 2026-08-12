package acc.br.shopbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;

@SpringBootApplication
@EnableJms
public class ShopbankApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShopbankApplication.class, args);
	}

}
