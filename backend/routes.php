<?php

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Remove prefixo /api se existir
$uri = preg_replace('#^/api#', '', $uri);

// Segmentos da URI — ex: /pedidos/42 → ['pedidos', '42']
$segments = array_values(array_filter(explode('/', $uri)));

// Rota de saúde
if ($uri === '' || $uri === '/') {
    json(['status' => 'API E-commerce B2B rodando']);
}

// -------------------------------------------------------
// Rotas agrupadas por recurso
// -------------------------------------------------------

$resource  = $segments[0] ?? null;
$id        = $segments[1] ?? null;

match ($resource) {
    'auth'        => require __DIR__ . '/app/Controllers/AuthController.php',
    'usuarios'    => require __DIR__ . '/app/Controllers/UsuarioController.php',
    'empresas'    => require __DIR__ . '/app/Controllers/EmpresaController.php',
    'produtos'    => require __DIR__ . '/app/Controllers/ProdutoController.php',
    'pedidos'     => require __DIR__ . '/app/Controllers/PedidoController.php',
    'estoque'     => require __DIR__ . '/app/Controllers/EstoqueController.php',
    'expedicao'   => require __DIR__ . '/app/Controllers/ExpedicaoController.php',
    'rma'         => require __DIR__ . '/app/Controllers/RmaController.php',
    default       => json(['erro' => 'Rota não encontrada'], 404),
};
