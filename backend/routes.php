<?php

use App\Router;

$router = new Router();

require_once __DIR__ . '/routes/api.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$uri    = preg_replace('#^/api#', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];

if ($uri === '' || $uri === '/') {
    json(['status' => 'API E-commerce B2B rodando']);
}

$router->dispatch($method, $uri);
