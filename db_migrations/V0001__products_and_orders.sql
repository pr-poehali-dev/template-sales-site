CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(16),
    tag VARCHAR(64),
    price_uzs INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_token VARCHAR(64) NOT NULL UNIQUE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    amount_uzs INTEGER NOT NULL,
    provider VARCHAR(16) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    provider_transaction_id VARCHAR(128),
    customer_email VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(order_token);
CREATE INDEX IF NOT EXISTS idx_orders_tx ON orders(provider_transaction_id);

INSERT INTO products (title, description, emoji, tag, price_uzs, file_url) VALUES
('Прописи букв', 'Учим алфавит весело: 40 страниц с буквами и картинками.', '✏️', '3-6 лет', 30000, 'https://cdn.poehali.dev/files/sample-propisi.pdf'),
('Считаем до 20', 'Цифры, счёт и первые примеры в игровой форме.', '🔢', '4-7 лет', 25000, 'https://cdn.poehali.dev/files/sample-schet.pdf'),
('Рисуем по точкам', 'Развиваем моторику: 30 заданий-раскрасок.', '🎨', '3-5 лет', 20000, 'https://cdn.poehali.dev/files/sample-risuem.pdf'),
('Логика и внимание', 'Лабиринты, найди отличия и весёлые головоломки.', '🦊', '5-8 лет', 28000, 'https://cdn.poehali.dev/files/sample-logika.pdf'),
('Готовимся к школе', 'Большой набор: буквы, цифры, прописи — всё сразу.', '🌟', '6-7 лет', 50000, 'https://cdn.poehali.dev/files/sample-shkola.pdf'),
('Английский для малышей', 'Первые слова и буквы английского алфавита.', '🐻', '4-7 лет', 33000, 'https://cdn.poehali.dev/files/sample-english.pdf');