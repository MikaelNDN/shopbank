package acc.br.shopbank;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "abacatepay.webhook-auto-registration-enabled=false")
class ShopbankApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void mainStartsApplication() {
		String[] args = {};

		try (MockedStatic<SpringApplication> springApplication = Mockito.mockStatic(SpringApplication.class)) {
			ShopbankApplication.main(args);

			springApplication.verify(() -> SpringApplication.run(ShopbankApplication.class, args));
		}
	}

}
