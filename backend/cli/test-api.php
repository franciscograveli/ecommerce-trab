#!/usr/bin/env php
<?php

/**
 * Testa todos os endpoints da API E-commerce B2B via HTTP.
 *
 * Uso:
 *   php cli/test-api.php [--base-url=http://localhost:8000/api]
 *
 * Requer que o seed já tenha sido executado:
 *   php cli/seed.php
 */

$baseUrl = getenv('API_URL') ?: 'http://localhost:8000/api';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base-url=')) {
        $baseUrl = substr($arg, strlen('--base-url='));
    }
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

$passed = 0;
$failed = 0;

function request(string $method, string $path, array $body = [], ?string $token = null): array
{
    global $baseUrl;

    $ch = curl_init($baseUrl . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $response   = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $statusCode,
        'body'   => json_decode($response, true) ?? [],
        'raw'    => $response,
    ];
}

function check(string $label, int $expected, array $resp, ?callable $assert = null): void
{
    global $passed, $failed;

    $ok = $resp['status'] === $expected;
    if ($ok && $assert !== null) {
        $ok = (bool) $assert($resp['body']);
    }

    if ($ok) {
        echo "\033[32m✅ $label\033[0m\n";
        $passed++;
    } else {
        echo "\033[31m❌ $label → esperado HTTP $expected, recebido {$resp['status']}\033[0m\n";
        echo "   " . json_encode($resp['body'], JSON_UNESCAPED_UNICODE) . "\n";
        $failed++;
    }
}

function section(string $title): void
{
    echo "\n\033[1;34m=== $title ===\033[0m\n";
}

echo "\033[1mBase URL: $baseUrl\033[0m\n";

// -------------------------------------------------------
// 1. Autenticação
// -------------------------------------------------------

section('Autenticação');

check('Rota pública (GET /)', 200, request('GET', '/'));

check('Login com credenciais inválidas → 401', 401, request('POST', '/auth/login', [
    'email' => 'nao@existe.com',
    'senha' => 'errada',
]));

check('Login sem campos obrigatórios → 422', 422, request('POST', '/auth/login', []));

$rAdmin = request('POST', '/auth/login', ['email' => 'admin@test.com', 'senha' => '123456']);
check('Login admin → 200 com token', 200, $rAdmin, fn($b) => isset($b['token']));
$tokenAdmin = $rAdmin['body']['token'] ?? null;

$rRep = request('POST', '/auth/login', ['email' => 'rep@test.com', 'senha' => '123456']);
check('Login representante → 200 com token', 200, $rRep, fn($b) => isset($b['token']));
$tokenRep = $rRep['body']['token'] ?? null;

$rComp = request('POST', '/auth/login', ['email' => 'comp@test.com', 'senha' => '123456']);
check('Login comprador → 200 com token', 200, $rComp, fn($b) => isset($b['token']));
$tokenComp = $rComp['body']['token'] ?? null;

check('Rota protegida sem token → 401', 401, request('GET', '/usuarios'));

// fix #42 — login deve retornar dados do perfil específico
check('[#42] Login rep retorna representante.id', 200, $rRep,
    fn($b) => isset($b['representante']['id']));
check('[#42] Login comprador retorna comprador.id e cliente_id', 200, $rComp,
    fn($b) => isset($b['comprador']['id']) && isset($b['comprador']['cliente_id']));
check('[#42] Login admin não retorna representante nem comprador', 200, $rAdmin,
    fn($b) => !isset($b['representante']) && !isset($b['comprador']));
$repId   = $rRep['body']['representante']['id']   ?? null;
$clienteIdDoComprador = $rComp['body']['comprador']['cliente_id'] ?? null;

if (!$tokenAdmin || !$tokenRep || !$tokenComp) {
    echo "\n\033[31mNão foi possível obter tokens. Verifique se o seed foi executado.\033[0m\n";
    exit(1);
}

// -------------------------------------------------------
// 2. Controle de acesso (roles)
// -------------------------------------------------------

section('Controle de Acesso');

check('Admin → GET /usuarios (200)',            200, request('GET', '/usuarios', [], $tokenAdmin));
check('Representante → GET /usuarios (403)',    403, request('GET', '/usuarios', [], $tokenRep));
check('Comprador → GET /usuarios (403)',        403, request('GET', '/usuarios', [], $tokenComp));

check('Admin → GET /empresas (200)',            200, request('GET', '/empresas', [], $tokenAdmin));
check('Representante → GET /empresas (200)',   200, request('GET', '/empresas', [], $tokenRep));
check('Comprador → POST /empresas (403)',       403, request('POST', '/empresas', ['razao_social' => 'X', 'cnpj' => 'X'], $tokenComp));

check('Comprador → GET /produtos (200)',        200, request('GET', '/produtos', [], $tokenComp));
check('Comprador → POST /produtos (403)',       403, request('POST', '/produtos', ['nome' => 'X'], $tokenComp));
check('Admin → POST /rma (403)',                403, request('POST', '/rma', [], $tokenAdmin));
check('Representante → GET /estoque (200)',     200, request('GET', '/estoque', [], $tokenRep));
check('Comprador → GET /estoque (403)',         403, request('GET', '/estoque', [], $tokenComp));

// -------------------------------------------------------
// 3. Usuários
// -------------------------------------------------------

section('Usuários');

$novoUser = request('POST', '/usuarios', [
    'perfil_id'           => 2,
    'nome'                => 'Rep CLI Teste',
    'email'               => 'rep.cli@test.com',
    'senha'               => '123456',
    'percentual_comissao' => 3.5,
], $tokenAdmin);
check('Criar usuário representante → 201', 201, $novoUser, fn($b) => isset($b['id']));
$novoUserId = $novoUser['body']['id'] ?? null;

check('E-mail duplicado → 409', 409, request('POST', '/usuarios', [
    'perfil_id' => 1, 'nome' => 'X', 'email' => 'rep.cli@test.com', 'senha' => '123456',
], $tokenAdmin));

check('GET /usuarios/:id → 200', 200,
    request('GET', "/usuarios/$novoUserId", [], $tokenAdmin),
    fn($b) => $b['email'] === 'rep.cli@test.com');

check('PUT /usuarios/:id → 200', 200,
    request('PUT', "/usuarios/$novoUserId", ['nome' => 'Rep CLI Atualizado'], $tokenAdmin),
    fn($b) => $b['nome'] === 'Rep CLI Atualizado');

// fix #43 — update deve persistir percentual_comissao na tabela representantes
check('[#43] PUT percentual_comissao persiste no representante', 200,
    request('PUT', "/usuarios/$novoUserId", ['percentual_comissao' => 12.5], $tokenAdmin),
    fn($b) => isset($b['representante']['percentual_comissao'])
           && (float)$b['representante']['percentual_comissao'] === 12.5);

check('DELETE /usuarios/:id → 200', 200,
    request('DELETE', "/usuarios/$novoUserId", [], $tokenAdmin));

check('GET usuário deletado → 404', 404,
    request('GET', "/usuarios/$novoUserId", [], $tokenAdmin));

// -------------------------------------------------------
// 4. Empresas
// -------------------------------------------------------

section('Empresas');

$novaEmpresa = request('POST', '/empresas', [
    'razao_social'   => 'CLI Empresa SA',
    'cnpj'           => '99.888.777/0001-66',
    'limite_credito' => 20000.00,
], $tokenAdmin);
check('Criar empresa → 201', 201, $novaEmpresa, fn($b) => isset($b['id']));
$empresaId = $novaEmpresa['body']['id'] ?? null;

check('CNPJ duplicado → 409', 409, request('POST', '/empresas', [
    'razao_social' => 'Outra', 'cnpj' => '99.888.777/0001-66',
], $tokenAdmin));

check('GET /empresas/:id → 200', 200,
    request('GET', "/empresas/$empresaId", [], $tokenAdmin));

check('PUT /empresas/:id → 200', 200,
    request('PUT', "/empresas/$empresaId", ['limite_credito' => 30000.00], $tokenAdmin));

check('DELETE /empresas/:id → 200', 200,
    request('DELETE', "/empresas/$empresaId", [], $tokenAdmin));

// -------------------------------------------------------
// 5. Produtos, grades e preços
// -------------------------------------------------------

section('Produtos');

$novoProd = request('POST', '/produtos', [
    'nome' => 'Produto CLI', 'descricao' => 'Teste via CLI',
], $tokenAdmin);
check('Criar produto → 201', 201, $novoProd, fn($b) => isset($b['id']));
$prodId = $novoProd['body']['id'] ?? null;

check('GET /produtos/:id → 200', 200, request('GET', "/produtos/$prodId", [], $tokenComp));
check('PUT /produtos/:id → 200', 200, request('PUT', "/produtos/$prodId", ['nome' => 'Produto CLI v2'], $tokenAdmin));

$skuUnique = 'CLI-SKU-' . time();
$novaGrade = request('POST', "/produtos/$prodId/grades", [
    'sku' => $skuUnique, 'cor' => 'Verde', 'tamanho' => 'M',
], $tokenAdmin);
check('Criar grade → 201', 201, $novaGrade, fn($b) => isset($b['id']));
$gradeId = $novaGrade['body']['id'] ?? null;

check('SKU duplicado → 409', 409,
    request('POST', "/produtos/$prodId/grades", ['sku' => $skuUnique], $tokenAdmin));

check('GET /produtos/:id/grades → 200', 200,
    request('GET', "/produtos/$prodId/grades", [], $tokenComp));

$novaTabela = request('POST', '/produtos/tabelas', [
    'nome' => 'Tabela CLI', 'regra_volume_minimo' => 1,
], $tokenAdmin);
check('Criar tabela de preço → 201', 201, $novaTabela, fn($b) => isset($b['id']));
$tabelaId = $novaTabela['body']['id'] ?? null;

check('GET /produtos/tabelas → 200', 200, request('GET', '/produtos/tabelas', [], $tokenAdmin));

check('Criar preço → 201', 201, request('POST', "/produtos/$prodId/precos", [
    'tabela_preco_id' => $tabelaId, 'preco' => 49.90,
], $tokenAdmin));

check('GET /produtos/:id/precos → 200', 200,
    request('GET', "/produtos/$prodId/precos", [], $tokenComp),
    fn($b) => count($b) > 0);

// -------------------------------------------------------
// 6. Estoque
// -------------------------------------------------------

section('Estoque');

$novoDeposito = request('POST', '/depositos', [
    'nome' => 'Depósito CLI', 'localizacao' => 'Galpão Z',
], $tokenAdmin);
check('Criar depósito → 201', 201, $novoDeposito, fn($b) => isset($b['id']));
$depositoId = $novoDeposito['body']['id'] ?? null;

check('GET /depositos → 200', 200, request('GET', '/depositos', [], $tokenRep));

check('Entrada 100 unidades → 200', 200, request('POST', '/estoque/entrada', [
    'grade_id' => $gradeId, 'deposito_id' => $depositoId, 'quantidade' => 100,
], $tokenAdmin));

check('Entrada mais 20 unidades → 200', 200, request('POST', '/estoque/entrada', [
    'grade_id' => $gradeId, 'deposito_id' => $depositoId, 'quantidade' => 20,
], $tokenAdmin));

check('Saída 10 unidades → 200', 200, request('POST', '/estoque/saida', [
    'grade_id' => $gradeId, 'deposito_id' => $depositoId, 'quantidade' => 10,
], $tokenAdmin));

check('Saída maior que estoque → 422', 422, request('POST', '/estoque/saida', [
    'grade_id' => $gradeId, 'deposito_id' => $depositoId, 'quantidade' => 99999,
], $tokenAdmin));

check('GET /estoque → 200', 200, request('GET', '/estoque', [], $tokenRep));

// -------------------------------------------------------
// 7. Pedidos e itens
// -------------------------------------------------------

section('Pedidos');

// Busca IDs do cliente e comprador criados no seed
$rEmpresas = request('GET', '/empresas', [], $tokenAdmin);
$clienteId = $rEmpresas['body'][0]['id'] ?? 1;

$rUsuarios = request('GET', '/usuarios', [], $tokenAdmin);
$compradorUserId = null;
foreach ($rUsuarios['body'] as $u) {
    if ($u['perfil']['nome'] === 'comprador') {
        $compradorUserId = $u['id'];
        break;
    }
}
$rComp2 = request('POST', '/auth/login', ['email' => 'comp@test.com', 'senha' => '123456']);
$tokenComp = $rComp2['body']['token'] ?? $tokenComp;

$novoPedido = request('POST', '/pedidos', [
    'cliente_id'   => $clienteId,
    'comprador_id' => 1,
], $tokenAdmin);
check('Criar orçamento (admin) → 201 com status orcamento', 201, $novoPedido,
    fn($b) => $b['status'] === 'orcamento');
$pedidoId = $novoPedido['body']['id'] ?? null;

check('GET /pedidos → 200', 200, request('GET', '/pedidos', [], $tokenComp));
check('GET /pedidos/:id → 200', 200, request('GET', "/pedidos/$pedidoId", [], $tokenAdmin));

// fix #44 — representante só vê pedidos de clientes da sua carteira
// $repId vem do login (#42), então o teste é auto-suficiente

// cria empresa vinculada ao rep e um pedido para ela
$ts = substr(time(), -3);
$cnpjNaCarteira = "44.$ts.444/0001-44";
$empresaNaCarteira = request('POST', '/empresas', [
    'razao_social'    => 'Empresa Na Carteira',
    'cnpj'            => $cnpjNaCarteira,
    'limite_credito'  => 10000.00,
    'representante_id'=> $repId,
], $tokenAdmin);
$empresaNaCarteiraId = $empresaNaCarteira['body']['id'] ?? null;

$pedidoNaCarteira = request('POST', '/pedidos', [
    'cliente_id'   => $empresaNaCarteiraId,
    'comprador_id' => 1,
], $tokenRep);
$pedidoNaCarteiraId = $pedidoNaCarteira['body']['id'] ?? null;

// cria empresa SEM representante e um pedido para ela
$cnpjForaCarteira = "55.$ts.555/0001-55";
$empresaForaCarteira = request('POST', '/empresas', [
    'razao_social'   => 'Empresa Fora Carteira',
    'cnpj'           => $cnpjForaCarteira,
    'limite_credito' => 5000.00,
], $tokenAdmin);
$empresaForaCarteiraId = $empresaForaCarteira['body']['id'] ?? null;

// Rep tenta criar pedido fora da carteira → 403 (esperado)
$pedidoForaCarteira = request('POST', '/pedidos', [
    'cliente_id'   => $empresaForaCarteiraId,
    'comprador_id' => 1,
], $tokenRep);
check('[#44] Rep não pode criar pedido fora da carteira → 403', 403, $pedidoForaCarteira);

// Admin cria pedido para empresa fora da carteira (para testar visibilidade)
$pedidoForaCarteiraAdmin = request('POST', '/pedidos', [
    'cliente_id'   => $empresaForaCarteiraId,
    'comprador_id' => 1,
], $tokenAdmin);
$pedidoForaId = $pedidoForaCarteiraAdmin['body']['id'] ?? null;

$pedidosRepFinal   = request('GET', '/pedidos', [], $tokenRep);
$pedidosAdminFinal = request('GET', '/pedidos', [], $tokenAdmin);

check('[#44] Rep vê pedido da sua carteira', 200, $pedidosRepFinal,
    fn($b) => is_array($b) && in_array($pedidoNaCarteiraId, array_column($b, 'id')));

check('[#44] Rep não vê pedido fora da sua carteira', 200, $pedidosRepFinal,
    fn($b) => is_array($b) && !in_array($pedidoForaId, array_column($b, 'id')));

check('[#44] Admin vê todos os pedidos (inclui o fora da carteira)', 200, $pedidosAdminFinal,
    fn($b) => is_array($b) && in_array($pedidoForaId, array_column($b, 'id')));

$novoItem = request('POST', "/pedidos/$pedidoId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 5, 'preco_unitario' => 49.90,
], $tokenComp);
check('Adicionar item → 201', 201, $novoItem);

check('GET /pedidos/:id/itens → 200', 200,
    request('GET', "/pedidos/$pedidoId/itens", [], $tokenComp),
    fn($b) => count($b) > 0);

check('Valor total recalculado (5 × 49.90 = 249.50)', 200,
    request('GET', "/pedidos/$pedidoId", [], $tokenAdmin),
    fn($b) => (float)$b['valor_total'] === 5 * 49.90);

// Avança status para bloquear adição de itens
request('PUT', "/pedidos/$pedidoId", ['status' => 'aguardando_aprovacao_credito'], $tokenAdmin);

check('Adicionar item fora de orçamento → 422', 422,
    request('POST', "/pedidos/$pedidoId/itens", [
        'grade_id' => $gradeId, 'quantidade' => 1, 'preco_unitario' => 10,
    ], $tokenComp));

check('Status inválido → 422', 422,
    request('PUT', "/pedidos/$pedidoId", ['status' => 'status_invalido'], $tokenAdmin));

check('Comprador → PUT /pedidos (403)', 403,
    request('PUT', "/pedidos/$pedidoId", ['status' => 'aprovado'], $tokenComp));

// Garante estoque suficiente para aprovação (110 - 10 = 110 disponível, pedido precisa de 5)
request('POST', '/estoque/entrada', [
    'grade_id' => $gradeId, 'deposito_id' => $depositoId, 'quantidade' => 50,
], $tokenAdmin);

check('Aprovar pedido (decrementa estoque) → 200', 200,
    request('PUT', "/pedidos/$pedidoId", ['status' => 'aprovado'], $tokenAdmin));

// -------------------------------------------------------
// 8. Expedição
// -------------------------------------------------------

section('Expedição');

check('Abrir expedição → 201', 201, request('POST', '/expedicao', [
    'pedido_id' => $pedidoId, 'transportadora' => 'Correios', 'valor_frete' => 25.00,
], $tokenAdmin), fn($b) => $b['status_logistica'] === 'picking_pendente');

$expId = request('GET', '/expedicao', [], $tokenAdmin)['body'][0]['id'] ?? null;

check('Pedido duplicado → 409', 409,
    request('POST', '/expedicao', ['pedido_id' => $pedidoId], $tokenAdmin));

check('GET /expedicao/:id → 200', 200,
    request('GET', "/expedicao/$expId", [], $tokenRep));

check('Atualizar status logístico → 200', 200,
    request('PUT', "/expedicao/$expId", [
        'status_logistica' => 'em_transito', 'codigo_rastreio' => 'BR123456789',
    ], $tokenAdmin));

check('Gerar boleto → 201', 201, request('POST', "/expedicao/$expId/boleto", [
    'linha_digitavel' => '34191.09067 22946.090232 61451.370004 1 97550000024950',
    'url_pdf'         => 'https://boleto.example.com/cli.pdf',
    'data_vencimento' => date('Y-m-d', strtotime('+7 days')),
], $tokenAdmin));

// -------------------------------------------------------
// 9. RMA
// -------------------------------------------------------

section('RMA');

request('PUT', "/pedidos/$pedidoId", ['status' => 'entregue'], $tokenAdmin);

$novoRma = request('POST', '/rma', [
    'pedido_id'    => $pedidoId,
    'comprador_id' => 1,
    'tipo'         => 'troca',
    'motivo'       => 'Produto com defeito de fabricação',
], $tokenComp);
check('Abrir RMA → 201 com status aberto', 201, $novoRma,
    fn($b) => $b['status'] === 'aberto');
$rmaId = $novoRma['body']['id'] ?? null;

check('Tipo inválido → 422', 422, request('POST', '/rma', [
    'pedido_id' => $pedidoId, 'comprador_id' => 1, 'tipo' => 'reembolso', 'motivo' => 'X',
], $tokenComp));

check('GET /rma/:id → 200', 200, request('GET', "/rma/$rmaId", [], $tokenAdmin));

check('Representante atualiza RMA → 200', 200,
    request('PUT', "/rma/$rmaId/status", ['status' => 'em_analise'], $tokenRep));

check('Comprador atualiza RMA → 403', 403,
    request('PUT', "/rma/$rmaId/status", ['status' => 'aprovado'], $tokenComp));

// -------------------------------------------------------
// 10. #50 — Status aguardando_estoque
// -------------------------------------------------------

section('#50 — aguardando_estoque');

// Grade com estoque zerado para forçar o bloqueio
$skuSemEstoque = 'SEM-EST-' . time();
$gradeSemEst = request('POST', "/produtos/$prodId/grades", [
    'sku' => $skuSemEstoque, 'cor' => 'Cinza', 'tamanho' => 'G',
], $tokenAdmin);
$gradeSemEstId = $gradeSemEst['body']['id'] ?? null;

// Pedido com grade sem estoque
$pedidoSemEst = request('POST', '/pedidos', [
    'cliente_id'   => $clienteId,
    'comprador_id' => 1,
], $tokenAdmin);
$pedidoSemEstId = $pedidoSemEst['body']['id'] ?? null;

request('POST', "/pedidos/$pedidoSemEstId/itens", [
    'grade_id' => $gradeSemEstId, 'quantidade' => 10, 'preco_unitario' => 49.90,
], $tokenAdmin);

// Confirmar com estoque zerado → deve ir para aguardando_estoque (não 422)
$confirmSemEst = request('PUT', "/pedidos/$pedidoSemEstId", ['status' => 'aprovado'], $tokenAdmin);
check('[#50] Confirmar sem estoque → status aguardando_estoque (não 422)', 200, $confirmSemEst,
    fn($b) => $b['status'] === 'aguardando_estoque');

// Tentar aprovar novamente ainda sem estoque → 422
$aprovSemEst = request('PUT', "/pedidos/$pedidoSemEstId", ['status' => 'aprovado'], $tokenAdmin);
check('[#50] Aprovar em aguardando_estoque sem repor → 422', 422, $aprovSemEst);

// Repor estoque
request('POST', '/estoque/entrada', [
    'grade_id' => $gradeSemEstId, 'deposito_id' => $depositoId, 'quantidade' => 50,
], $tokenAdmin);

// Aprovar após repor → deve funcionar
$aprovComEst = request('PUT', "/pedidos/$pedidoSemEstId", ['status' => 'aprovado'], $tokenAdmin);
check('[#50] Aprovar após repor estoque → status aprovado', 200, $aprovComEst,
    fn($b) => $b['status'] === 'aprovado');

// Pedido com crédito excedido → aguardando_aprovacao_credito (comportamento anterior preservado)
$empresaBaixoLimite = request('POST', '/empresas', [
    'razao_social'   => 'Empresa Baixo Limite',
    'cnpj'           => '11.222.333/0001-' . substr(time(), -2),
    'limite_credito' => 1.00,
], $tokenAdmin);
$empBaixoId = $empresaBaixoLimite['body']['id'] ?? null;

$pedidoBaixo = request('POST', '/pedidos', [
    'cliente_id'   => $empBaixoId,
    'comprador_id' => 1,
], $tokenAdmin);
$pedidoBaixoId = $pedidoBaixo['body']['id'] ?? null;

request('POST', "/pedidos/$pedidoBaixoId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 1, 'preco_unitario' => 49.90,
], $tokenAdmin);

$confirmBaixo = request('PUT', "/pedidos/$pedidoBaixoId", ['status' => 'aprovado'], $tokenAdmin);
check('[#50] Crédito excedido ainda vai para aguardando_aprovacao_credito', 200, $confirmBaixo,
    fn($b) => $b['status'] === 'aguardando_aprovacao_credito');

// -------------------------------------------------------
// 11. #56 — Validação de volume mínimo
// -------------------------------------------------------

section('#56 — Volume mínimo');

// Tabela com volume mínimo = 5
$tabelaVolMin = request('POST', '/produtos/tabelas', [
    'nome' => 'Tabela VolMin5', 'regra_volume_minimo' => 5,
], $tokenAdmin);
$tabelaVolMinId = $tabelaVolMin['body']['id'] ?? null;
check('Criar tabela com vol. mínimo 5 → 201', 201, $tabelaVolMin);

// Preço R$99 nessa tabela para o produto de teste
request('POST', "/produtos/$prodId/precos", [
    'tabela_preco_id' => $tabelaVolMinId, 'preco' => 99.00,
], $tokenAdmin);

// Pedido para adicionar itens
$pedidoVolMin = request('POST', '/pedidos', [
    'cliente_id'   => $clienteId,
    'comprador_id' => 1,
], $tokenAdmin);
$pedidoVolMinId = $pedidoVolMin['body']['id'] ?? null;

// Quantidade 2 com preço da tabela vol mínimo 5 → 422
$itemAbaixo = request('POST', "/pedidos/$pedidoVolMinId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 2, 'preco_unitario' => 99.00,
], $tokenAdmin);
check('[#56] Qtd abaixo do volume mínimo (2 < 5) → 422', 422, $itemAbaixo,
    fn($b) => isset($b['erro']) && str_contains($b['erro'], 'mínima'));

// Quantidade exata no mínimo → 201
$itemExato = request('POST', "/pedidos/$pedidoVolMinId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 5, 'preco_unitario' => 99.00,
], $tokenAdmin);
check('[#56] Qtd exatamente no mínimo (5 = 5) → 201', 201, $itemExato);

// Quantidade acima do mínimo → 201
$itemAcima = request('POST', "/pedidos/$pedidoVolMinId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 10, 'preco_unitario' => 99.00,
], $tokenAdmin);
check('[#56] Qtd acima do mínimo (10 > 5) → 201', 201, $itemAcima);

// Preço sem tabela (custom) → não bloqueia, mesmo quantidade baixa
$itemCustom = request('POST', "/pedidos/$pedidoVolMinId/itens", [
    'grade_id' => $gradeId, 'quantidade' => 1, 'preco_unitario' => 1.00,
], $tokenAdmin);
check('[#56] Preço customizado (sem tabela) → não bloqueia → 201', 201, $itemCustom);

// -------------------------------------------------------
// 12. Logout
// -------------------------------------------------------

section('Logout');

check('Logout → 200', 200, request('DELETE', '/auth/logout', [], $tokenAdmin));
check('Token inválido após logout → 401', 401, request('GET', '/usuarios', [], $tokenAdmin));

// -------------------------------------------------------
// Resultado
// -------------------------------------------------------

$total = $passed + $failed;
echo "\n\033[1m" . str_repeat('─', 45) . "\033[0m\n";
echo "\033[1mResultado: $passed/$total testes passaram\033[0m";
if ($failed === 0) {
    echo " \033[32m✅ Todos ok!\033[0m\n";
} else {
    echo " \033[31m($failed falhas)\033[0m\n";
    exit(1);
}
