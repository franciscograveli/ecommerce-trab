# Plano de Implementação — Cards In Progress

Cards que estão parcialmente implementados e precisam ser ajustados para
atender ao contrato definido em cada issue.

---

## Cards #6, #7 e #8 — Autenticação e Middleware

> Issues: [#6](../../issues/6), [#7](../../issues/7), [#8](../../issues/8)

### Problema atual

| Card | O que foi feito | O que falta |
|------|----------------|-------------|
| #6 Login | Endpoint funciona, gera token | Token salvo em `usuarios.token_autenticacao` sem expiração |
| #7 Logout | Endpoint funciona | Método HTTP é `POST`, card exige `DELETE`; não remove da tabela `tokens` |
| #8 Middleware | Valida token e protege rotas | Sem Model `Token`, sem verificação de `expires_at` |

### O que precisa ser feito

#### 1. `database/schema.sql`
Adicionar tabela `tokens` após a tabela `usuarios`:

```sql
CREATE TABLE tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

#### 2. `backend/app/Models/Token.php`
Criar model com relacionamento para `Usuario`:

```php
class Token extends Model {
    protected $table = 'tokens';
    protected $fillable = ['usuario_id', 'token', 'expires_at'];
    public $timestamps = false;

    public function usuario() {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
```

#### 3. `backend/app/Middleware/Auth.php`
Trocar a busca por `token_autenticacao` em `usuarios` pela busca na tabela `tokens` com verificação de expiração:

```php
$token = Token::where('token', $raw)
    ->where('expires_at', '>', now())
    ->with('usuario.perfil')
    ->first();

if (!$token) {
    json(['erro' => 'Token inválido ou expirado'], 401);
}

self::$usuarioCache = $token->usuario->toArray();
```

#### 4. `backend/app/Controllers/AuthController.php`

**`login()`** — salvar na tabela `tokens` com `expires_at = now + 8h`:
```php
$token = bin2hex(random_bytes(32));
Token::create([
    'usuario_id' => $usuario->id,
    'token'      => $token,
    'expires_at' => date('Y-m-d H:i:s', strtotime('+8 hours')),
]);
```

**`logout()`** — deletar o registro da tabela `tokens`:
```php
Token::where('token', bearerToken())->delete();
```

#### 5. `backend/routes/api.php`
Trocar o método do logout de `POST` para `DELETE`:

```php
// antes
$router->post('/auth/logout', [AuthController::class, 'logout'], []);

// depois
$router->delete('/auth/logout', [AuthController::class, 'logout'], []);
```

---

## Card #15 — Controle de Estoque por Depósito

> Issue: [#15](../../issues/15)

### Problema atual

| O que foi feito | O que falta |
|----------------|-------------|
| `POST /estoque` com campo `operacao: set/add/sub` | Card exige `POST /estoque/entrada` e `POST /estoque/saida` como rotas separadas |
| Entrada/saída manual funciona | Estoque **não é decrementado** automaticamente ao aprovar pedido |
| — | Estoque **não é incrementado** automaticamente ao concluir RMA de devolução |

### O que precisa ser feito

#### 1. `backend/app/Controllers/EstoqueController.php`
Adicionar métodos `entrada()` e `saida()` separados (mantendo `store()` para compatibilidade interna):

```php
// POST /estoque/entrada
public function entrada(array $params): void {
    // valida grade_id, deposito_id, quantidade
    // incrementa estoque (operacao = add)
}

// POST /estoque/saida
public function saida(array $params): void {
    // valida grade_id, deposito_id, quantidade
    // verifica se há saldo suficiente
    // decrementa estoque (operacao = sub)
}
```

#### 2. `backend/app/Controllers/PedidoController.php`
No método `update()`, quando `status` for alterado para `aprovado`, decrementar o estoque de cada item do pedido:

```php
if ($body['status'] === 'aprovado') {
    foreach ($pedido->itens as $item) {
        Estoque::where('grade_id', $item->grade_id)
            ->decrement('quantidade', $item->quantidade);
    }
}
```

> Verificar saldo antes de aprovar. Retornar `422` se alguma grade não tiver estoque suficiente.

#### 3. `backend/app/Controllers/RmaController.php`
No método `update()`, quando `status` for alterado para `concluido` e `tipo` for `devolucao`, incrementar o estoque:

```php
if ($body['status'] === 'concluido' && $rma->tipo === 'devolucao') {
    foreach ($rma->pedido->itens as $item) {
        Estoque::where('grade_id', $item->grade_id)
            ->increment('quantidade', $item->quantidade);
    }
}
```

#### 4. `backend/routes/api.php`
Adicionar as novas rotas de entrada e saída:

```php
// antes
$router->post('/estoque', [EstoqueController::class, 'store'], ['admin']);

// depois
$router->post('/estoque/entrada', [EstoqueController::class, 'entrada'], ['admin']);
$router->post('/estoque/saida',   [EstoqueController::class, 'saida'],   ['admin']);
```

---

## Card #26 — RMA

> Issue: [#26](../../issues/26)

### Problema atual

| O que foi feito | O que falta |
|----------------|-------------|
| `POST /rma`, `GET /rma`, `GET /rma/{id}` | `PUT /rma/{id}` implementado, card exige `PUT /rma/{id}/status` |

### O que precisa ser feito

#### 1. `backend/routes/api.php`
Ajustar o path do PUT:

```php
// antes
$router->put('/rma/{id}', [RmaController::class, 'update'], ['admin', 'representante']);

// depois
$router->put('/rma/{id}/status', [RmaController::class, 'update'], ['admin', 'representante']);
```

Nenhuma mudança no controller é necessária.

---

## Ordem de execução

```
1. database/schema.sql        → adicionar tabela tokens
2. app/Models/Token.php        → criar model
3. app/Middleware/Auth.php     → usar Token com expires_at
4. app/Controllers/AuthController.php → login/logout com tabela tokens
5. routes/api.php              → DELETE logout + /rma/{id}/status + /estoque/entrada + /estoque/saida
6. app/Controllers/EstoqueController.php → métodos entrada() e saida()
7. app/Controllers/PedidoController.php  → decremento automático na aprovação
8. app/Controllers/RmaController.php     → incremento automático na devolução concluída
```

## Impacto nos testes

Após as mudanças, atualizar `backend/cli/test-api.php`:
- Logout: trocar `POST` por `DELETE`
- Estoque: trocar `/estoque` (com `operacao`) por `/estoque/entrada` e `/estoque/saida`
- RMA update: trocar `/rma/{id}` por `/rma/{id}/status`
- Adicionar teste de estoque insuficiente ao tentar aprovar pedido
