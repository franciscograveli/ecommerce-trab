<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad(); // não falha se .env não existir (ex: ambiente Docker)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../app/helpers.php';

// Captura qualquer exceção não tratada e retorna JSON em vez de HTML de erro
set_exception_handler(function (Throwable $e) {
    json(['erro' => 'Erro interno do servidor', 'detalhe' => $e->getMessage()], 500);
});

// CORS
$allowedOrigin = $_ENV['FRONTEND_URL'] ?? '*';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../routes.php';
