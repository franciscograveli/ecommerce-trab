# E-commerce B2B (Atacado)

Trabalho prático das disciplinas de **Engenharia de Software I** e **Desenvolvimento Web II**
IF Sudeste MG — Campus Muriaé | Prof. Paulo Vinícius Moreira Dutra

---

## O que é o sistema

Plataforma de e-commerce B2B (business-to-business) voltada para venda no atacado. Clientes são empresas (PJ), não pessoas físicas. O sistema gerencia representantes comerciais, catálogo com preços dinâmicos por volume/região, pedidos com fluxo de aprovação de crédito, logística de expedição e portal do cliente com pós-venda.

---

## Documentos entregáveis

| Arquivo | Descrição |
|---|---|
| `docs/Trabalho__IFSUDESTEMG.zip` | Documento de requisitos do projeto |
| `docs/EER.pdf` | Diagrama Entidade-Relacionamento |
| `docs/EER.png` | Diagrama ER em imagem |
| `database/EER.mwb` | Fonte do diagrama ER |
| `database/schema.sql` | Script DDL completo do banco de dados |

---

## O que precisa ser entregue (checklist)

- [x] Script DDL `.sql` com a estrutura completa do banco (`database/schema.sql`)
- [x] Diagrama Entidade-Relacionamento (`database/EER.mwb` + `docs/EER.pdf`)
- [x] Projeto completo (código + interfaces + lógica de negócio)
- [x] Documentação do projeto (`docs/Trabalho__IFSUDESTEMG.zip`)
- [x] Link para este repositório no GitHub

> **Atenção:** Entrega via SIGAA. Não atualizar o repositório após a data de entrega.

---

## Rodando o projeto

**Pré-requisito:** Docker + Docker Compose instalados.

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

### Comandos úteis

```bash
make logs          # acompanhar logs em tempo real
make shell-backend # abrir bash no container PHP
make shell-db      # abrir cliente MariaDB
make db-reset      # recriar o banco do zero (apaga dados!)
make down          # derrubar os containers
```

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

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | PHP 8.1 + roteador customizado |
| ORM | Eloquent standalone (`illuminate/database`) |
| Autenticação | Token simples (gerado no login, salvo no banco) |
| Frontend | HTML, CSS (Tailwind CDN) e JavaScript puros |
| Comunicação | REST API (JSON) |
| Banco | MariaDB |

---

## Módulos do sistema

### 1. Autenticação e Controle de Acesso
- Login com perfis distintos: **Admin**, **Representante Comercial** e **Comprador**
- Token gerado no login, enviado em todo request via `Authorization: Bearer <token>`
- Cada representante enxerga apenas sua carteira de clientes

### 2. Gestão de Clientes Corporativos e Representantes
- Cadastro de empresas com CNPJ e Inscrição Estadual
- Representante pode cadastrar empresa e propor limite de crédito; admin aprova
- Cadastro de compradores autorizados vinculados à empresa
- Cadastro de representantes comerciais com carteira de clientes e comissões

### 3. Catálogo de Produtos e Preços Dinâmicos
- CRUD de produtos com grades (cor, tamanho)
- Múltiplas tabelas de preço por volume mínimo ou região
- Estoque por depósito com disponibilidade em tempo real

### 4. Gestão de Pedidos e Fluxo de Aprovação
- Criação de orçamentos convertíveis em pedidos
- Bloqueio automático quando valor excede o limite de crédito do cliente
- Fila de aprovação para o financeiro liberar pedidos bloqueados

### 5. Logística de Expedição e Entrega
- Geração de lista de separação (picking) após aprovação
- Gerenciamento de embalagem (packing)
- Registro de transportadora, código de rastreio e valor de frete

### 6. Portal do Cliente e Pós-Venda
- Histórico de pedidos e segunda via de boletos
- Abertura de solicitações de troca ou devolução (RMA)
- Acompanhamento de status do chamado RMA

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
│   │   ├── Middleware/      # Autenticação (Auth.php)
│   │   ├── Router.php       # Roteador customizado
│   │   └── helpers.php      # Funções utilitárias globais
│   ├── routes/
│   │   └── api.php          # Definição de todas as rotas da API
│   ├── config/
│   │   └── database.php     # Configuração e boot do Eloquent
│   ├── cli/                 # Scripts utilitários (seed, testes)
│   ├── composer.json
│   └── .env.example
│
├── frontend/
│   ├── index.html           # Página inicial / login
│   ├── pages/               # Uma página HTML por tela
│   ├── css/
│   │   ├── base.css
│   │   └── style.css
│   └── js/
│       ├── api.js           # Wrapper centralizado de fetch (lida com token)
│       ├── layout.js        # Sidebar e estrutura de layout
│       ├── modal.js         # Utilitário de modais reutilizáveis
│       ├── tw-config.js     # Configuração de tema Tailwind
│       └── pages/           # Um arquivo JS por página
│
├── database/
│   ├── schema.sql           # Script DDL entregável
│   └── EER.mwb              # Diagrama ER (MySQL Workbench)
│
├── docs/
│   ├── EER.pdf              # Diagrama ER exportado
│   └── EER.png              # Diagrama ER (imagem)
│
├── docker-compose.yml
├── Makefile
├── .gitignore
└── README.md
```

---

## Fluxo de trabalho Git

Nunca commitar direto na `main`. Abrir PR da branch de feat/fix para `main` ao concluir cada task.
