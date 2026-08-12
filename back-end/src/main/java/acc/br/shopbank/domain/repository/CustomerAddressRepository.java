package acc.br.shopbank.domain.repository;

import acc.br.shopbank.domain.model.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerAddressRepository
        extends JpaRepository<CustomerAddress, Long> {

    List<CustomerAddress> findByCustomerId(Long customerId);

}