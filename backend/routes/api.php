<?php

use App\Controllers\AuthController;
use App\Controllers\UsuarioController;
use App\Controllers\EmpresaController;
use App\Controllers\ProdutoController;
use App\Controllers\PedidoController;
use App\Controllers\EstoqueController;
use App\Controllers\ExpedicaoController;
use App\Controllers\RmaController;

$router->post('/auth/login',  [AuthController::class, 'login']);
$router->post('/auth/logout', [AuthController::class, 'logout']);

$router->get('/usuarios',         [UsuarioController::class, 'index']);
$router->post('/usuarios',        [UsuarioController::class, 'store']);
$router->get('/usuarios/{id}',    [UsuarioController::class, 'show']);
$router->put('/usuarios/{id}',    [UsuarioController::class, 'update']);
$router->delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);

$router->get('/empresas',         [EmpresaController::class, 'index']);
$router->post('/empresas',        [EmpresaController::class, 'store']);
$router->get('/empresas/{id}',    [EmpresaController::class, 'show']);
$router->put('/empresas/{id}',    [EmpresaController::class, 'update']);
$router->delete('/empresas/{id}', [EmpresaController::class, 'destroy']);

$router->get('/produtos',         [ProdutoController::class, 'index']);
$router->post('/produtos',        [ProdutoController::class, 'store']);
$router->get('/produtos/{id}',    [ProdutoController::class, 'show']);
$router->put('/produtos/{id}',    [ProdutoController::class, 'update']);
$router->delete('/produtos/{id}', [ProdutoController::class, 'destroy']);

$router->get('/produtos/{id}/grades',          [ProdutoController::class, 'indexGrades']);
$router->post('/produtos/{id}/grades',         [ProdutoController::class, 'storeGrade']);
$router->delete('/produtos/{id}/grades/{gid}', [ProdutoController::class, 'destroyGrade']);

$router->get('/produtos/tabelas',   [ProdutoController::class, 'indexTabelas']);
$router->post('/produtos/tabelas',  [ProdutoController::class, 'storeTabela']);

$router->get('/produtos/{id}/precos',  [ProdutoController::class, 'indexPrecos']);
$router->post('/produtos/{id}/precos', [ProdutoController::class, 'storePreco']);

$router->get('/pedidos',         [PedidoController::class, 'index']);
$router->post('/pedidos',        [PedidoController::class, 'store']);
$router->get('/pedidos/{id}',    [PedidoController::class, 'show']);
$router->put('/pedidos/{id}',    [PedidoController::class, 'update']);
$router->delete('/pedidos/{id}', [PedidoController::class, 'cancel']);

$router->get('/pedidos/{id}/itens',            [PedidoController::class, 'indexItens']);
$router->post('/pedidos/{id}/itens',           [PedidoController::class, 'storeItem']);
$router->delete('/pedidos/{id}/itens/{iid}',   [PedidoController::class, 'destroyItem']);

$router->get('/estoque',          [EstoqueController::class, 'index']);
$router->post('/estoque',         [EstoqueController::class, 'store']);
$router->get('/depositos',        [EstoqueController::class, 'indexDepositos']);
$router->post('/depositos',       [EstoqueController::class, 'storeDeposito']);

$router->get('/expedicao',              [ExpedicaoController::class, 'index']);
$router->post('/expedicao',             [ExpedicaoController::class, 'store']);
$router->get('/expedicao/{id}',         [ExpedicaoController::class, 'show']);
$router->put('/expedicao/{id}',         [ExpedicaoController::class, 'update']);
$router->post('/expedicao/{id}/boleto', [ExpedicaoController::class, 'storeBoleto']);

$router->get('/rma',         [RmaController::class, 'index']);
$router->post('/rma',        [RmaController::class, 'store']);
$router->get('/rma/{id}',    [RmaController::class, 'show']);
$router->put('/rma/{id}',    [RmaController::class, 'update']);
