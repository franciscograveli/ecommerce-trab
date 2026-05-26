CREATE DATABASE IF NOT EXISTS ecommerce_b2b;
USE ecommerce_b2b;

CREATE TABLE perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO perfis (nome) VALUES ('admin'), ('representante'), ('comprador');

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    perfil_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
);

CREATE TABLE tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE representantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE NOT NULL,
    percentual_comissao DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(50),
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    representante_id INT, -- Para o requisito de carteira de clientes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (representante_id) REFERENCES representantes(id) ON DELETE SET NULL
);

CREATE TABLE compradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE NOT NULL,
    cliente_id INT NOT NULL,        
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    cor VARCHAR(50),
    tamanho VARCHAR(50),
    voltagem VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE tabelas_precos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    regiao VARCHAR(100) NULL,
    regra_volume_minimo INT DEFAULT 1
);

CREATE TABLE produto_precos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    tabela_preco_id INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (tabela_preco_id) REFERENCES tabelas_precos(id) ON DELETE CASCADE
);

CREATE TABLE depositos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255)
);

CREATE TABLE estoques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT NOT NULL,
    deposito_id INT NOT NULL,
    quantidade INT DEFAULT 0,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    FOREIGN KEY (deposito_id) REFERENCES depositos(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    comprador_id INT NOT NULL,
    representante_id INT,
    status ENUM('orcamento', 'aguardando_aprovacao_credito', 'aprovado', 'em_separacao', 'enviado', 'entregue', 'cancelado') DEFAULT 'orcamento',
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (comprador_id) REFERENCES compradores(id),
    FOREIGN KEY (representante_id) REFERENCES representantes(id)
);

CREATE TABLE pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    grade_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades(id)
);

CREATE TABLE expedicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT UNIQUE NOT NULL,
    status_logistica ENUM('picking_pendente', 'picking_concluido', 'packing', 'pronto_envio', 'em_transito') DEFAULT 'picking_pendente',
    transportadora VARCHAR(100),
    codigo_rastreio VARCHAR(100),
    valor_frete DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE boletos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    linha_digitavel VARCHAR(255) NOT NULL,
    url_pdf VARCHAR(255) NOT NULL,
    data_vencimento DATE NOT NULL,
    status ENUM('pendente', 'pago', 'vencido') DEFAULT 'pendente',
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE rma_solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    comprador_id INT NOT NULL,
    tipo ENUM('troca', 'devolucao') NOT NULL,
    motivo TEXT NOT NULL,
    status ENUM('aberto', 'em_analise', 'aprovado', 'rejeitado', 'concluido') DEFAULT 'aberto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (comprador_id) REFERENCES compradores(id)
);

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);