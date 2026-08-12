-- =====================================================================
-- ShopBank seed data
-- Senhas: 123456 (BCrypt). Para todos os usuários demo.
-- IDs reservados: 1-99 (seed). Auto-increment retomado em 1000.
-- =====================================================================

-- Users
MERGE INTO users (id, email, password_hash, role, active, created_at, updated_at) KEY(id) VALUES
(1, 'admin@shopbank.com',   '$2b$10$SduHG7fNQxtEdHsQjKDrOeQJx.4iHQNWi.4UMf3pEcsYXxULD/QCW', 'ADMIN',  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'cliente@shopbank.com', '$2b$10$SduHG7fNQxtEdHsQjKDrOeQJx.4iHQNWi.4UMf3pEcsYXxULD/QCW', 'CLIENT', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'maria@shopbank.com',   '$2b$10$SduHG7fNQxtEdHsQjKDrOeQJx.4iHQNWi.4UMf3pEcsYXxULD/QCW', 'CLIENT', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'joao@shopbank.com',    '$2b$10$SduHG7fNQxtEdHsQjKDrOeQJx.4iHQNWi.4UMf3pEcsYXxULD/QCW', 'CLIENT', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Customers
MERGE INTO customers (id, user_id, full_name, cpf, phone, birth_date, marketing_opt_in, active, created_at, updated_at) KEY(id) VALUES
(1, 2, 'Cliente Demo', '52998224725', '83999990001', DATE '1995-05-10', TRUE,  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 'Maria Silva',  '11144477735', '11988880002', DATE '1990-08-22', TRUE,  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 4, 'Joao Pereira', '04167906094', '21977770003', DATE '1988-03-15', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Customer addresses
MERGE INTO customer_addresses (id, customer_id, label, recipient_name, postal_code, street, number, complement, district, city, state, reference, favorite, active, created_at, updated_at) KEY(id) VALUES
(1, 1, 'Casa',     'Cliente Demo', '58015000', 'Rua Demo',         '100',  'Apto 101', 'Centro',     'Campina Grande', 'PB', 'Proximo ao mercado', TRUE,  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'Trabalho', 'Cliente Demo', '58000000', 'Av. das Estacoes', '500',  'Sala 301', 'Bodocongo',  'Campina Grande', 'PB', NULL,                 FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 2, 'Casa',     'Maria Silva',  '01310100', 'Av. Paulista',     '1500', NULL,       'Bela Vista', 'Sao Paulo',      'SP', NULL,                 TRUE,  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 3, 'Casa',     'Joao Pereira', '20040020', 'Rua da Carioca',   '88',   NULL,       'Centro',     'Rio de Janeiro', 'RJ', NULL,                 TRUE,  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Banks
MERGE INTO banks (id, code, name, active) KEY(id) VALUES
(1, '001', 'ShopBank Demo', TRUE);

-- Stores
MERGE INTO stores (id, legal_name, trade_name, cnpj, email, active, created_at, updated_at) KEY(id) VALUES
(1, 'ShopBank Comercio LTDA', 'ShopBank Store', '12345678000199', 'store@shopbank.com', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Checking accounts
MERGE INTO checking_accounts (id, bank_id, customer_id, store_id, agency, number, digit, balance, type, active, created_at, updated_at) KEY(id) VALUES
(1, 1, 1,    NULL, '0001', '10001', '0', 5000.00, 'CUSTOMER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 2,    NULL, '0001', '10002', '0', 3000.00, 'CUSTOMER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 3,    NULL, '0001', '10003', '0', 2000.00, 'CUSTOMER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, NULL, 1,    '0001', '20001', '0', 0.00,    'STORE',       TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, NULL, NULL, '0001', '30001', '0', 0.00,    'MARKETPLACE', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Categories
MERGE INTO categories (id, name, description, active, created_at, updated_at) KEY(id) VALUES
(1, 'Eletronicos', 'Smartphones, notebooks, audio e mais',     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Casa',        'Eletrodomesticos e itens para o lar',      TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Livros',      'Literatura, tecnicos e didaticos',         TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Moda',        'Roupas, calcados e acessorios',            TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Mercado',     'Alimentos, bebidas e mantimentos',         TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Games',       'Consoles, jogos e perifericos',            TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Products
MERGE INTO products (id, category_id, store_id, name, description, price, image_url, active, created_at, updated_at) KEY(id) VALUES
(1,  1, 1, 'Smartphone Galaxy',   'Smartphone Android tela AMOLED 6.5", 128GB, camera tripla 50MP.',     2499.90, 'https://images.unsplash.com/photo-1505468726633-0069fc52f4b9?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2,  1, 1, 'Notebook Pro',        'Notebook 14" Intel i7, 16GB RAM, SSD 512GB, Windows 11.',             5899.00, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3,  1, 1, 'Headset Bluetooth',   'Fone over-ear sem fio com cancelamento de ruido ativo, 30h bateria.',  449.90, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4,  6, 1, 'Mouse Gamer',         'Mouse RGB 16000 DPI, 7 botoes programaveis, sensor optico.',           199.90, 'https://images.unsplash.com/photo-1623820919239-0d0ff10797a1?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5,  6, 1, 'Teclado Mecanico',    'Teclado mecanico ABNT2 com switches azuis e RGB por tecla.',           379.90, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6,  3, 1, 'Livro Java 21',       'Guia completo de Java 21 com Spring Boot 3 e arquitetura limpa.',      129.90, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7,  1, 1, 'Smart TV 50"',        'Smart TV 4K UHD 50", HDR10+, Wi-Fi 6, 3 HDMI, Google TV.',            2899.00, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8,  2, 1, 'Cafeteira Eletrica',  'Cafeteira programavel 1.5L, 12 xicaras, com timer e jarra termica.',   349.00, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9,  2, 1, 'Cadeira Escritorio',  'Cadeira ergonomica com apoio lombar ajustavel e bracos 4D.',          1299.00, 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 4, 1, 'Camiseta Basica',     'Camiseta de algodao pima, gola careca, varias cores.',                  79.90, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 6, 1, 'Console GameBox',     'Console next-gen com SSD 1TB, controle wireless e 2 jogos inclusos.', 4299.00, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 4, 1, 'Mochila Executiva',   'Mochila para notebook 15.6" com porta USB e compartimento termico.',   249.90, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inventories
MERGE INTO inventories (id, product_id, available_quantity, reserved_quantity, created_at, updated_at) KEY(id) VALUES
(1,  1,  25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2,  2,  10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3,  3,  40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4,  4,  60, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5,  5,  30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6,  6,  80, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7,  7,   8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8,  8,  20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9,  9,   4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 10, 100, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 11,   0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 12,  35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Orders
MERGE INTO orders (id, customer_id, status, total_amount, created_at, updated_at) KEY(id) VALUES
(1, 1, 'PAID',            3048.80, DATEADD('DAY', -7, CURRENT_TIMESTAMP), DATEADD('DAY', -7, CURRENT_TIMESTAMP)),
(2, 1, 'WAITING_PAYMENT',  579.80, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP)),
(3, 2, 'CANCELED',        4299.00, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, CURRENT_TIMESTAMP));

-- Order items
MERGE INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal) KEY(id) VALUES
(1, 1, 1, 1, 2499.90, 2499.90),
(2, 1, 4, 1,  199.90,  199.90),
(3, 1, 8, 1,  349.00,  349.00),
(4, 2, 3, 1,  449.90,  449.90),
(5, 2, 6, 1,  129.90,  129.90),
(6, 3, 11, 1, 4299.00, 4299.00);

-- Order shipping address snapshots
MERGE INTO order_shipping_addresses (id, order_id, customer_address_id_origin, recipient_name, postal_code, street, number, complement, district, city, state, reference) KEY(id) VALUES
(1, 1, 1, 'Cliente Demo', '58015000', 'Rua Demo',     '100',  'Apto 101', 'Centro',     'Campina Grande', 'PB', 'Proximo ao mercado'),
(2, 2, 1, 'Cliente Demo', '58015000', 'Rua Demo',     '100',  'Apto 101', 'Centro',     'Campina Grande', 'PB', 'Proximo ao mercado'),
(3, 3, 3, 'Maria Silva',  '01310100', 'Av. Paulista', '1500', NULL,       'Bela Vista', 'Sao Paulo',      'SP', NULL);

-- Payments
MERGE INTO payments (id, order_id, method, status, amount, gateway_preference_id, gateway_payment_id, checkout_url, created_at, confirmed_at) KEY(id) VALUES
(1, 1, 'PIX',           'APPROVED', 3048.80, 'pref-mock-001', 'mp-pay-001', 'https://mock.shopbank/pay/1', DATEADD('DAY', -7, CURRENT_TIMESTAMP), DATEADD('DAY', -7, CURRENT_TIMESTAMP)),
(2, 2, 'ABACATEPAY',    'PENDING',   579.80, 'pref-mock-002', NULL,         'https://mock.shopbank/pay/2', DATEADD('DAY', -1, CURRENT_TIMESTAMP), NULL),
(3, 3, 'CREDIT_CARD',   'CANCELED', 4299.00, 'pref-mock-003', NULL,         'https://mock.shopbank/pay/3', DATEADD('DAY', -3, CURRENT_TIMESTAMP), NULL);

-- Reset auto-increment past seed range
ALTER TABLE users                     ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE customers                 ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE customer_addresses        ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE banks                     ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE stores                    ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE checking_accounts         ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE categories                ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE products                  ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE inventories               ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE orders                    ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE order_items               ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE order_shipping_addresses  ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE payments                  ALTER COLUMN id RESTART WITH 1000;
