# E-commerce B2B (Atacado)

Trabalho prático das disciplinas de **Engenharia de Software I** e **Desenvolvimento Web II**
IF Sudeste MG — Campus Muriaé | Prof. Paulo Vinícius Moreira Dutra

---

## O que é o sistema

Plataforma de e-commerce B2B (business-to-business) voltada para venda no atacado. Clientes são empresas (PJ), não pessoas físicas. O sistema gerencia representantes comerciais, catálogo com preços dinâmicos por volume/região, pedidos com fluxo de aprovação de crédito, logística de expedição e portal do cliente com pós-venda.

---

## Rodando o projeto

**Pré-requisito:** ter [Docker](https://www.docker.com/) instalado.

```bash
git clone <url-do-repo>
cd ecommerce-trab
make up
```

Após o `make up` o ambiente estará disponível em:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api |
| Banco (MariaDB) | localhost:3306 — usuário `root`, senha `root` |

O `composer install` roda automaticamente dentro do container na primeira subida.
Credenciais do banco são apenas para desenvolvimento local.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | PHP puro + Composer |
| ORM | Eloquent standalone (`illuminate/database`) |
| Autenticação | Token simples (gerado no login, salvo no banco) |
| Frontend | HTML, CSS e JavaScript puros |
| Comunicação | REST API (JSON) |
| Banco | MySQL / MariaDB |

---

## O que precisa ser entregue (checklist)

- [ ] Script DDL `.sql` com a estrutura completa do banco (MySQL/MariaDB)
- [ ] Diagrama Entidade-Relacionamento (imagem/PDF + arquivo editável)
- [ ] Projeto completo (código + interfaces + lógica de negócio)
- [ ] Documentação do projeto (modelo fornecido pelo professor)
- [ ] Link para este repositório no GitHub

> **Atenção:** Entrega via SIGAA. Não atualizar o repositório após a data de entrega.

---

## Módulos do sistema

### 1. Autenticação e Controle de Acesso
- Login com perfis distintos: **Admin**, **Representante Comercial** e **Cliente (comprador da empresa)**
- Token gerado no login, enviado em todo request via `Authorization: Bearer <token>`
- Cada representante enxerga apenas sua carteira de clientes

### 2. Gestão de Clientes Corporativos e Representantes
- Cadastro de empresas com CNPJ e Inscrição Estadual
- Cadastro de compradores autorizados vinculados à empresa
- Cadastro de representantes comerciais com carteira de clientes e comissões

### 3. Catálogo de Produtos e Preços Dinâmicos
- CRUD de produtos com grades (cor, tamanho, voltagem)
- Múltiplas tabelas de preço por volume de compra ou região
- Estoque por depósito com disponibilidade em tempo real

### 4. Gestão de Pedidos e Fluxo de Aprovação
- Criação de orçamentos convertíveis em pedidos
- Bloqueio automático quando valor excede o limite de crédito do cliente
- Fila de aprovação para o financeiro liberar pedidos bloqueados

### 5. Logística de Expedição e Entrega
- Geração de lista de separação (picking) após aprovação
- Gerenciamento de embalagem (packing)
- Emissão de etiquetas de transporte
- Integração com API de transportadora para cálculo de frete e rastreamento

### 6. Portal do Cliente e Pós-Venda
- Histórico de pedidos e segunda via de boletos
- Abertura de solicitações de troca ou devolução (RMA)
- Acompanhamento de status do chamado RMA em tempo real

---

## Estrutura de pastas

```
ecommerce-trab/
├── backend/
│   ├── public/
│   │   ├── index.php        # Entrada única da API (todas as rotas passam aqui)
│   │   └── .htaccess        # Redireciona tudo para index.php
│   ├── app/
│   │   ├── Controllers/     # Um controller por módulo
│   │   ├── Models/          # Eloquent models
│   │   └── Middleware/      # Autenticação, CORS, etc.
│   ├── config/
│   │   └── database.php     # Configuração e boot do Eloquent
│   ├── routes.php           # Definição de todas as rotas da API
│   ├── composer.json
│   └── .env.example
│
├── frontend/
│   ├── index.html           # Página inicial / login
│   ├── pages/               # Uma página HTML por tela
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js           # Wrapper centralizado de fetch (lida com token)
│       └── pages/           # Um arquivo JS por página
│
├── database/
│   └── schema.sql           # Script DDL entregável
│
├── .gitignore
└── README.md
```

---

## Como rodar localmente (Docker — recomendado)

**Pré-requisito:** Docker + Docker Compose instalados.

```bash
# 1. Clonar o repositório
git clone <url-do-repo>
cd ecommerce-trab

# 2. Subir todos os serviços (backend, frontend, banco)
make up
```

Pronto. O `composer install` roda automaticamente dentro do container.

| Serviço | URL |
|---|---|
| API (backend) | http://localhost:8000/api |
| Frontend | http://localhost:3000 |
| Banco (MariaDB) | localhost:3306 |

### Comandos úteis

```bash
make logs          # acompanhar logs em tempo real
make shell-backend # abrir bash no container PHP
make shell-db      # abrir cliente MariaDB
make db-reset      # recriar o banco do zero (apaga dados!)
make down          # derrubar os containers
```

> As credenciais do banco no ambiente Docker são `root / root` — apenas para desenvolvimento local.

---

## Como rodar sem Docker (alternativa)

**Pré-requisitos:** PHP 8.1+, Composer, MySQL/MariaDB

```bash
cd backend
composer install
cp .env.example .env
# editar .env com as credenciais do banco local

mysql -u root -p < ../database/schema.sql

# Em terminais separados:
php -S localhost:8000 -t public/    # API
php -S localhost:3000 ../frontend/  # Frontend
```

---

## Fluxo de trabalho Git

Nunca commitar direto na `main`. Abrir PR da branch de feat/fix para `main` ao concluir cada task.
